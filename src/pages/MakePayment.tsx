import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// ✅ IMPORTANT: this is the flow you said was working before
// If your project has ApplicationContext, keep this import.
// If the import path differs, adjust it to your actual file.
import { useApplication } from "@/context/ApplicationContext";

type PaymentMode = "bml" | "transfer";

// ✅ Change bucket name if yours is different
const SLIP_BUCKET = "payment_slips";

// Bank details
const BANK_NAME = "Bank of Maldives";
const ACCOUNT_NAME = "Emir X Pvt Ltd";
const ACCOUNT_NUMBER = "7730000761972";

function toNumberSafe(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function sanitizeFileName(name: string) {
  return name.replace(/[^\w.\-]+/g, "_");
}

function getAmountFromCourse(course: any): number | null {
  return (
    toNumberSafe(course?.price) ??
    toNumberSafe(course?.fee) ??
    toNumberSafe(course?.amount) ??
    toNumberSafe(course?.total_amount) ??
    toNumberSafe(course?.totalAmount)
  );
}

export default function MakePayment() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const { selectedCourse } = useApplication() as any; // keep flexible

  const [mode, setMode] = useState<PaymentMode>("bml");

  const [courseId, setCourseId] = useState<string>("");
  const [courseTitle, setCourseTitle] = useState<string>("");
  const [amount, setAmount] = useState<number | null>(null);

  const [loadingBml, setLoadingBml] = useState(false);
  const [loadingTransfer, setLoadingTransfer] = useState(false);
  const [slipFile, setSlipFile] = useState<File | null>(null);

  // 1) Resolve from query params / location.state / ApplicationContext / localStorage
  const resolved = useMemo(() => {
    const qpCourseId = searchParams.get("courseId") || searchParams.get("course_id") || "";
    const qpAmount = searchParams.get("amount") || searchParams.get("total_amount") || "";

    const st: any = location.state || {};
    const stCourseId = st.courseId || st.course_id || st.id || "";
    const stAmount = st.amount || st.total_amount || st.totalAmount;

    const ctxCourseId = selectedCourse?.id || "";
    const ctxAmount = getAmountFromCourse(selectedCourse);

    const lsCourseId = localStorage.getItem("elc_course_id") || "";
    const lsAmount = localStorage.getItem("elc_amount") || "";

    const finalCourseId = qpCourseId || stCourseId || ctxCourseId || lsCourseId;
    const finalAmount = toNumberSafe(qpAmount || stAmount || ctxAmount || lsAmount);

    const finalTitle = selectedCourse?.title || st?.title || "";

    return { finalCourseId, finalAmount, finalTitle };
  }, [location.state, searchParams, selectedCourse]);

  // 2) Apply resolved values + persist for refresh safety
  useEffect(() => {
    if (resolved.finalCourseId) {
      setCourseId(resolved.finalCourseId);
      localStorage.setItem("elc_course_id", resolved.finalCourseId);
    }
    if (resolved.finalAmount) {
      setAmount(resolved.finalAmount);
      localStorage.setItem("elc_amount", String(resolved.finalAmount));
    }
    if (resolved.finalTitle) {
      setCourseTitle(resolved.finalTitle);
    }
  }, [resolved.finalCourseId, resolved.finalAmount, resolved.finalTitle]);

  // 3) If we have courseId but still no amount, fetch from courses table
  useEffect(() => {
    const run = async () => {
      if (!courseId) return;
      if (amount) return;

      const { data, error } = await supabase
        .from("courses")
        .select("id,title,price,fee,amount,total_amount")
        .eq("id", courseId)
        .single();

      if (error) {
        console.error("Course fetch failed:", error);
        return;
      }

      if (data?.title && !courseTitle) setCourseTitle(data.title);

      const derived = getAmountFromCourse(data);
      if (derived) {
        setAmount(derived);
        localStorage.setItem("elc_amount", String(derived));
      }
    };

    run();
  }, [courseId, amount, courseTitle]);

  // ---- session helper
  const requireSession = async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) return null;
    return session;
  };

  // ---- BML Pay (redirect to BML hosted card page)
  const handleBmlPay = async () => {
    if (!courseId || !amount) {
      toast.error("Missing course or amount. Please go back and try again.");
      return;
    }

    setLoadingBml(true);
    try {
      const session = await requireSession();
      if (!session) {
        toast.error("Please log in again.");
        return;
      }

      // 🔑 CRITICAL: Forward JWT explicitly so auth.uid() is NOT NULL in DB
      const { data, error } = await supabase.functions.invoke("initiate-bml-payment-v2", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { courseId, amount },
      });

      if (error) {
        console.error("BML start failed:", error);
        toast.error("Failed to start BML payment.");
        return;
      }

      if (!data?.paymentUrl) {
        console.error("BML response missing paymentUrl:", data);
        toast.error("BML did not return a payment URL.");
        return;
      }

      window.location.href = data.paymentUrl;
    } catch (e) {
      console.error(e);
      toast.error("Unexpected error starting BML payment.");
    } finally {
      setLoadingBml(false);
    }
  };

  // ---- transfer slip validation
  const validateSlip = (file: File) => {
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowed.includes(file.type)) return "Slip must be JPG, PNG, or PDF.";
    const maxMb = 8;
    if (file.size > maxMb * 1024 * 1024) return `Slip must be under ${maxMb}MB.`;
    return null;
  };

  // ---- manual transfer submit
  const handleTransferSubmit = async () => {
    if (!courseId || !amount) {
      toast.error("Missing course or amount.");
      return;
    }
    if (!slipFile) {
      toast.error("Please upload your transfer slip.");
      return;
    }

    const slipErr = validateSlip(slipFile);
    if (slipErr) {
      toast.error(slipErr);
      return;
    }

    setLoadingTransfer(true);
    try {
      const session = await requireSession();
      if (!session) {
        toast.error("Please log in again.");
        return;
      }

      // 1) Create payments row (pending)
      const { data: payment, error: insertErr } = await supabase
        .from("payments")
        .insert({
          user_id: session.user.id,
          course_id: courseId,
          total_amount: amount,
          currency: "MVR", // remove ONLY if your payments table doesn't have this column
          status: "pending",
        })
        .select("id")
        .single();

      if (insertErr || !payment?.id) {
        console.error("Failed to create payment:", insertErr);
        toast.error("Failed to create payment record.");
        return;
      }

      const paymentId = payment.id as string;

      // 2) Upload slip
      const safeName = sanitizeFileName(slipFile.name);
      const path = `slips/${session.user.id}/${paymentId}/${Date.now()}-${safeName}`;

      const { error: uploadErr } = await supabase.storage.from(SLIP_BUCKET).upload(path, slipFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: slipFile.type,
      });

      if (uploadErr) {
        console.error("Slip upload failed:", uploadErr);
        toast.error("Slip upload failed. Please try again.");
        return;
      }

      // 3) Store slip URL/path (best-effort)
      const publicUrl = supabase.storage.from(SLIP_BUCKET).getPublicUrl(path).data.publicUrl;

      const tryUpdates = [
        { slip_url: publicUrl, slip_path: path },
        { slip_url: publicUrl },
        { slip_path: path },
      ];

      for (const payload of tryUpdates) {
        const { error: updErr } = await supabase.from("payments").update(payload).eq("id", paymentId);
        if (!updErr) break;
      }

      toast.success("Slip submitted. Payment pending verification.");
      navigate(`/payment/success?mode=transfer&paymentId=${encodeURIComponent(paymentId)}`);
    } catch (e) {
      console.error(e);
      toast.error("Unexpected error submitting transfer payment.");
    } finally {
      setLoadingTransfer(false);
    }
  };

  const missing = !courseId || !amount;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-6">Make Payment</h1>

        {missing ? (
          <div className="border rounded-lg p-5">
            <p className="text-sm">Missing payment details. Please return to the course page and try again.</p>

            <button type="button" className="mt-4 px-4 py-2 rounded-lg border" onClick={() => navigate(-1)}>
              Go Back
            </button>

            <div className="mt-4 text-xs text-gray-600">
              <div className="font-semibold mb-1">Debug (helps you find what broke):</div>
              <div>courseId: {String(courseId || "(empty)")}</div>
              <div>amount: {String(amount || "(empty)")}</div>
              <div>selectedCourse in context: {String(!!selectedCourse)}</div>
              <div className="mt-2">
                If this is empty now, the navigation stopped setting selectedCourse or state.
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="border rounded-lg p-4 mb-6">
              <div className="flex justify-between text-sm">
                <span>Course</span>
                <span className="font-semibold">{courseTitle || courseId}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span>Amount</span>
                <span className="font-semibold">MVR {amount}</span>
              </div>
            </div>

            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => setMode("bml")}
                className={`px-4 py-2 rounded-lg border ${mode === "bml" ? "bg-black text-white" : ""}`}
              >
                BML Gateway
              </button>
              <button
                type="button"
                onClick={() => setMode("transfer")}
                className={`px-4 py-2 rounded-lg border ${mode === "transfer" ? "bg-black text-white" : ""}`}
              >
                Manual Bank Transfer
              </button>
            </div>

            {mode === "bml" && (
              <div className="border rounded-lg p-5">
                <h2 className="text-lg font-semibold mb-2">Pay via BML (Card)</h2>
                <p className="text-sm mb-4">You will be redirected to the Bank of Maldives secure payment page.</p>

                <button
                  type="button"
                  onClick={handleBmlPay}
                  disabled={loadingBml}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg disabled:opacity-50"
                >
                  {loadingBml ? "Redirecting to BML..." : "Pay via BML"}
                </button>
              </div>
            )}

            {mode === "transfer" && (
              <div className="border rounded-lg p-5">
                <h2 className="text-lg font-semibold mb-2">Manual Bank Transfer</h2>
                <p className="text-sm mb-4">Transfer to the account below, then upload the slip.</p>

                <div className="bg-gray-50 border rounded-lg p-4 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span>Bank</span>
                    <span className="font-semibold">{BANK_NAME}</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span>Account Name</span>
                    <span className="font-semibold">{ACCOUNT_NAME}</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span>Account Number</span>
                    <span className="font-semibold">{ACCOUNT_NUMBER}</span>
                  </div>
                </div>

                <label className="block text-sm font-medium mb-2">Upload transfer slip (JPG/PNG/PDF)</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={(e) => setSlipFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm"
                />

                {slipFile && (
                  <p className="text-xs mt-2">
                    Selected: <span className="font-mono">{slipFile.name}</span>
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleTransferSubmit}
                  disabled={loadingTransfer}
                  className="w-full mt-4 bg-green-600 text-white py-3 rounded-lg disabled:opacity-50"
                >
                  {loadingTransfer ? "Submitting..." : "Submit Slip for Verification"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
