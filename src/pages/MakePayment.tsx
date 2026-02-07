import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams, useParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type PaymentMode = "bml" | "transfer";

// ✅ Change if needed
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

export default function MakePayment() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const params = useParams<{ courseId?: string }>();

  const [mode, setMode] = useState<PaymentMode>("bml");

  const [courseId, setCourseId] = useState<string>("");
  const [amount, setAmount] = useState<number | null>(null);
  const [courseTitle, setCourseTitle] = useState<string>("");

  const [loadingBml, setLoadingBml] = useState(false);
  const [loadingTransfer, setLoadingTransfer] = useState(false);

  const [slipFile, setSlipFile] = useState<File | null>(null);

  // ---- Resolve inputs from query/state/params/localStorage
  const resolvedInputs = useMemo(() => {
    const qpCourseId = searchParams.get("courseId") || searchParams.get("course_id") || "";
    const qpAmount = searchParams.get("amount") || searchParams.get("total_amount") || "";

    const st: any = location.state || {};
    const stateCourseId = st.courseId || st.course_id || "";
    const stateAmount = st.amount || st.total_amount || st.totalAmount;

    const paramCourseId = params.courseId || "";

    const lsCourseId = localStorage.getItem("elc_course_id") || "";
    const lsAmount = localStorage.getItem("elc_amount") || "";

    const finalCourseId = qpCourseId || stateCourseId || paramCourseId || lsCourseId;
    const finalAmount = toNumberSafe(qpAmount || stateAmount || lsAmount);

    return { finalCourseId, finalAmount };
  }, [location.state, params.courseId, searchParams]);

  useEffect(() => {
    if (resolvedInputs.finalCourseId) {
      setCourseId(resolvedInputs.finalCourseId);
      localStorage.setItem("elc_course_id", resolvedInputs.finalCourseId);
    }
    if (resolvedInputs.finalAmount) {
      setAmount(resolvedInputs.finalAmount);
      localStorage.setItem("elc_amount", String(resolvedInputs.finalAmount));
    }
  }, [resolvedInputs.finalCourseId, resolvedInputs.finalAmount]);

  // ---- If courseId exists but amount missing, fetch course to derive amount
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
        console.error("Failed to fetch course for amount:", error);
        return;
      }

      setCourseTitle(data?.title || "");

      const derived =
        toNumberSafe(data?.price) ??
        toNumberSafe(data?.fee) ??
        toNumberSafe(data?.amount) ??
        toNumberSafe(data?.total_amount);

      if (derived) {
        setAmount(derived);
        localStorage.setItem("elc_amount", String(derived));
      }
    };

    run();
  }, [courseId, amount]);

  // ---- Session helper
  const requireSession = async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) return null;
    return session;
  };

  // ---- BML
  const handleBmlPay = async () => {
    console.log("BML clicked");
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

      // 🔑 CRITICAL: forward JWT explicitly so auth.uid() is NOT NULL in DB
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

  // ---- Transfer slip validation
  const validateSlip = (file: File) => {
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowed.includes(file.type)) return "Slip must be JPG, PNG, or PDF.";
    const maxMb = 8;
    if (file.size > maxMb * 1024 * 1024) return `Slip must be under ${maxMb}MB.`;
    return null;
  };

  // ---- Manual transfer submit
  const handleTransferSubmit = async () => {
    console.log("Transfer submit clicked");
    if (!courseId || !amount) {
      toast.error("Missing course or amount. Please go back and try again.");
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

      // 1) Create payment row (minimal columns only)
      const { data: payment, error: insertErr } = await supabase
        .from("payments")
        .insert({
          user_id: session.user.id,
          course_id: courseId,
          total_amount: amount,
          status: "pending",
          currency: "MVR", // remove ONLY if your table truly doesn't have it
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

      // 3) Save slip link if your payments table supports it (best effort)
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
            <p className="text-sm">
              Missing payment details. Please return to the course page and try again.
            </p>
            <button
              type="button"
              className="mt-4 px-4 py-2 rounded-lg border"
              onClick={() => navigate(-1)}
            >
              Go Back
            </button>

            <div className="mt-4 text-xs text-gray-600">
              <div>Debug:</div>
              <div>courseId: {String(courseId || "(empty)")}</div>
              <div>amount: {String(amount || "(empty)")}</div>
              <div>
                Tip: Navigate to this page like{" "}
                <span className="font-mono">/make-payment?courseId=...&amp;amount=...</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Header summary */}
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

            {/* Mode selector */}
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

            {/* BML */}
            {mode === "bml" && (
              <div className="border rounded-lg p-5">
                <h2 className="text-lg font-semibold mb-2">Pay via BML (Card)</h2>
                <p className="text-sm mb-4">
                  You will be redirected to the Bank of Maldives secure payment page.
                </p>

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

            {/* Transfer */}
            {mode === "transfer" && (
              <div className="border rounded-lg p-5">
                <h2 className="text-lg font-semibold mb-2">Manual Bank Transfer</h2>
                <p className="text-sm mb-4">
                  Transfer the amount to the bank account below, then upload the transfer slip.
                </p>

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

                <label className="block text-sm font-medium mb-2">
                  Upload transfer slip (JPG/PNG/PDF)
                </label>
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

                <p className="text-xs mt-3 text-gray-600">
                  After submission, an admin will verify and enroll you (no auto-enrollment).
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
