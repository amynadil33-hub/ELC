import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useApplication } from "@/context/ApplicationContext";

type PaymentMode = "bml" | "transfer";

const SLIP_BUCKET = "payment_slips";

// ✅ Bank details (UPDATED)
const BANK_NAME = "Bank of Maldives";
const ACCOUNT_NAME = "Everyone’s Learning Centre";
const ACCOUNT_NUMBER = "7730000226678";

function toNumberSafe(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function sanitizeFileName(name: string) {
  return name.replace(/[^\w.\-]+/g, "_");
}

function getAmountFromCourse(course: any): number | null {
  // Prefer explicit totals
  const total =
    toNumberSafe(course?.total_amount) ??
    toNumberSafe(course?.totalAmount) ??
    toNumberSafe(course?.price) ??
    toNumberSafe(course?.fee) ??
    toNumberSafe(course?.amount);

  // If total not present, try tuition + registration
  const tuition = toNumberSafe(course?.tuition_amount);
  const reg = toNumberSafe(course?.registration_fee);
  if (!total && (tuition || reg)) {
    const sum = (tuition ?? 0) + (reg ?? 0);
    return sum > 0 ? sum : null;
  }

  return total;
}

export default function MakePayment() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const { selectedCourse } = useApplication() as any;

  const [mode, setMode] = useState<PaymentMode>("bml");

  const [courseId, setCourseId] = useState<string>("");
  const [courseTitle, setCourseTitle] = useState<string>("");
  const [amount, setAmount] = useState<number | null>(null);

  // Optional breakdown (used when inserting transfer rows)
  const [tuitionAmount, setTuitionAmount] = useState<number | null>(null);
  const [registrationFee, setRegistrationFee] = useState<number | null>(null);

  const [loadingCourse, setLoadingCourse] = useState(false);

  const [loadingBml, setLoadingBml] = useState(false);
  const [loadingTransfer, setLoadingTransfer] = useState(false);
  const [slipFile, setSlipFile] = useState<File | null>(null);

  // ✅ For BML compliance: user must accept terms/policies before paying
  const [agree, setAgree] = useState(false);

  // 1) Resolve from query params / location.state / context / localStorage
  const resolved = useMemo(() => {
    const qpCourseId =
      searchParams.get("courseId") || searchParams.get("course_id") || "";
    const qpAmount =
      searchParams.get("amount") || searchParams.get("total_amount") || "";
    const qpTitle = searchParams.get("title") || "";

    const st: any = location.state || {};
    const stCourseId = st.courseId || st.course_id || st.id || "";
    const stAmount = st.amount || st.total_amount || st.totalAmount;
    const stTitle = st.title || "";

    const ctxCourseId = selectedCourse?.id || "";
    const ctxAmount = getAmountFromCourse(selectedCourse);
    const ctxTitle = selectedCourse?.title || "";

    const lsCourseId = localStorage.getItem("elc_course_id") || "";
    const lsAmount = localStorage.getItem("elc_amount") || "";
    const lsTitle = localStorage.getItem("elc_course_title") || "";

    const finalCourseId = qpCourseId || stCourseId || ctxCourseId || lsCourseId;
    const finalAmount = toNumberSafe(qpAmount || stAmount || ctxAmount || lsAmount);

    // Prefer: query param title -> context title -> state title -> localStorage title
    const finalTitle =
      decodeURIComponent(qpTitle || "") || ctxTitle || stTitle || lsTitle || "";

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
      localStorage.setItem("elc_course_title", resolved.finalTitle);
    }
  }, [resolved.finalCourseId, resolved.finalAmount, resolved.finalTitle]);

  // 3) Always fetch course if we have courseId AND (title missing OR amount missing OR breakdown missing)
  useEffect(() => {
    const run = async () => {
      if (!courseId) return;

      // Only skip if we already have everything
      const hasTitle = !!courseTitle;
      const hasAmount = !!amount;
      const hasBreakdown = tuitionAmount !== null || registrationFee !== null;

      if (hasTitle && hasAmount && hasBreakdown) return;

      setLoadingCourse(true);

      const { data, error } = await supabase
        .from("courses")
        .select("id,title,price,fee,amount,total_amount,tuition_amount,registration_fee")
        .eq("id", courseId)
        .single();

      setLoadingCourse(false);

      if (error) {
        console.error("Course fetch failed:", error);
        return;
      }

      if (data?.title && !courseTitle) {
        setCourseTitle(data.title);
        localStorage.setItem("elc_course_title", data.title);
      }

      if (tuitionAmount === null && toNumberSafe((data as any)?.tuition_amount) !== null) {
        setTuitionAmount(Number((data as any).tuition_amount));
      }
      if (registrationFee === null && toNumberSafe((data as any)?.registration_fee) !== null) {
        setRegistrationFee(Number((data as any).registration_fee));
      }

      if (!amount) {
        const derived = getAmountFromCourse(data);
        if (derived) {
          setAmount(derived);
          localStorage.setItem("elc_amount", String(derived));
        }
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, courseTitle, amount, tuitionAmount, registrationFee]);

  const requireSession = async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error || !session) return null;
    return session;
  };

  // ---- BML Pay (use direct fetch so we can see JSON errors)
  const handleBmlPay = async () => {
    if (!agree) {
      toast.error("Please agree to the Terms & Conditions, Privacy Policy, and Refund Policy.");
      return;
    }

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

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/initiate-bml-payment-v2`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ courseId, amount }),
      });

      const text = await res.text();
      let json: any = text;
      try {
        json = JSON.parse(text);
      } catch {
        // keep as text
      }

      if (!res.ok) {
        console.error("BML start failed (body):", json);
        const msg =
          json?.error ||
          json?.message ||
          json?.bml?.message ||
          `Failed to start payment (${res.status})`;
        toast.error(String(msg));
        return;
      }

      // ✅ Support both keys (your edge function may return redirectUrl)
      const paymentUrl = json?.paymentUrl || json?.redirectUrl;

      if (!paymentUrl) {
        console.error("Missing paymentUrl/redirectUrl:", json);
        toast.error("BML did not return a payment URL.");
        return;
      }

      window.location.href = paymentUrl;
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
    if (!agree) {
      toast.error("Please agree to the Terms & Conditions, Privacy Policy, and Refund Policy.");
      return;
    }

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

      // ✅ CRITICAL: payments.amount is integer (laari) and often NOT NULL
      const amountInLaari = Math.round(Number(amount) * 100);
      if (!Number.isFinite(amountInLaari) || amountInLaari <= 0) {
        toast.error("Invalid payment amount. Please refresh and try again.");
        return;
      }

      // 1) Create payments row (pending) — match your schema
      const insertPayload: any = {
        user_id: session.user.id,
        course_id: courseId,
        payment_method: "transfer",
        status: "pending",
        currency: "MVR",
        amount: amountInLaari, // ✅ REQUIRED integer
        total_amount: amount,  // ✅ numeric
      };

      if (tuitionAmount !== null) insertPayload.tuition_amount = tuitionAmount;
      if (registrationFee !== null) insertPayload.registration_fee = registrationFee;

      const { data: payment, error: insertErr } = await supabase
        .from("payments")
        .insert(insertPayload)
        .select("id")
        .single();

      if (insertErr || !payment?.id) {
        console.error("Failed to create payment:", insertErr);
        toast.error(insertErr?.message || "Failed to create payment record.");
        return;
      }

      const paymentId = payment.id as string;

      // 2) Upload slip
      const safeName = sanitizeFileName(slipFile.name);
      const path = `slips/${session.user.id}/${paymentId}/${Date.now()}-${safeName}`;

      const { error: uploadErr } = await supabase.storage
        .from(SLIP_BUCKET)
        .upload(path, slipFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: slipFile.type,
        });

      if (uploadErr) {
        console.error("Slip upload failed:", uploadErr);
        toast.error(uploadErr?.message || "Slip upload failed. Please try again.");
        return;
      }

      // 3) Store slip_url only (your table has slip_url, not slip_path)
      const publicUrl = supabase.storage
        .from(SLIP_BUCKET)
        .getPublicUrl(path).data.publicUrl;

      const { error: updErr } = await supabase
        .from("payments")
        .update({ slip_url: publicUrl })
        .eq("id", paymentId);

      if (updErr) {
        console.warn("Slip URL update failed (non-fatal):", updErr);
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

  const courseLabel = loadingCourse
    ? "Loading course..."
    : courseTitle
      ? courseTitle
      : courseId;

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
              <div className="font-semibold mb-1">Debug:</div>
              <div>courseId: {String(courseId || "(empty)")}</div>
              <div>courseTitle: {String(courseTitle || "(empty)")}</div>
              <div>amount: {String(amount || "(empty)")}</div>
              <div>selectedCourse in context: {String(!!selectedCourse)}</div>
              <div className="mt-2">
                If courseTitle is empty, your course fetch may be blocked by courses RLS.
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="border rounded-lg p-4 mb-6">
              <div className="flex justify-between text-sm">
                <span>Course</span>
                <span className="font-semibold">{courseLabel}</span>
              </div>

              <div className="flex justify-between text-sm mt-2">
                <span>Amount</span>
                <span className="font-semibold">MVR {amount}</span>
              </div>

              {(tuitionAmount !== null || registrationFee !== null) && (
                <div className="mt-3 text-xs text-gray-600">
                  {tuitionAmount !== null && (
                    <div className="flex justify-between">
                      <span>Tuition</span>
                      <span>MVR {tuitionAmount}</span>
                    </div>
                  )}
                  {registrationFee !== null && (
                    <div className="flex justify-between">
                      <span>Registration Fee</span>
                      <span>MVR {registrationFee}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ✅ TEST ENV NOTICE */}
            <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 text-sm rounded-lg p-4 mb-6">
              ⚠️ <strong>BML Payment Gateway is currently in TEST (UAT) mode.</strong>
              <br />
              Please do not use real cards for payment at this time.
            </div>

            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => setMode("bml")}
                className={`px-4 py-2 rounded-lg border ${
                  mode === "bml" ? "bg-black text-white" : ""
                }`}
              >
                BML Gateway
              </button>
              <button
                type="button"
                onClick={() => setMode("transfer")}
                className={`px-4 py-2 rounded-lg border ${
                  mode === "transfer" ? "bg-black text-white" : ""
                }`}
              >
                Manual Bank Transfer
              </button>
            </div>

            {/* ✅ AGREEMENT + LINKS (BML requirement) */}
            <div className="mb-6 border rounded-lg p-4 text-sm">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  I agree to the{" "}
                  <a href="/terms" className="text-blue-600 underline">
                    Terms & Conditions
                  </a>
                  ,{" "}
                  <a href="/privacy-policy" className="text-blue-600 underline">
                    Privacy Policy
                  </a>{" "}
                  and{" "}
                  <a href="/refund-policy" className="text-blue-600 underline">
                    Refund & Cancellation Policy
                  </a>
                  .
                </span>
              </label>
            </div>

            {mode === "bml" && (
              <div className="border rounded-lg p-5">
                <h2 className="text-lg font-semibold mb-2">Pay via BML (Card)</h2>
                <p className="text-sm mb-4">
                  You will be redirected to the Bank of Maldives secure payment page.
                </p>

                <button
                  type="button"
                  onClick={handleBmlPay}
                  disabled={loadingBml || !agree}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg disabled:opacity-50"
                >
                  {loadingBml ? "Redirecting to BML..." : "Pay via BML"}
                </button>

                {/* ✅ Card logos strip */}
                <div className="flex justify-center mt-4">
                  <img
                    src="/bml/cards.png"
                    alt="Accepted cards"
                    className="h-8 object-contain"
                  />
                </div>

                <p className="text-xs text-center mt-3 text-gray-500">
                  Card payments are securely processed by Bank of Maldives. Please retain a copy of
                  your transaction records for reference.
                </p>
              </div>
            )}

            {mode === "transfer" && (
              <div className="border rounded-lg p-5">
                <h2 className="text-lg font-semibold mb-2">Manual Bank Transfer</h2>
                <p className="text-sm mb-4">
                  Transfer to the account below, then upload the slip.
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
                  disabled={loadingTransfer || !agree}
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
