import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/lib/supabase";
import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from "@supabase/supabase-js";

interface Pricing {
  id: string;
  billing_period: string;
  amount: number;
}

type PaymentMethod = "bml" | "bank_transfer";

export default function MakePayment() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [course, setCourse] = useState<any>(null);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [agree, setAgree] = useState(false);

  const [tuitionFee, setTuitionFee] = useState(0);
  const [registrationFee, setRegistrationFee] = useState(0);

  const [method, setMethod] = useState<PaymentMethod>("bml");

  /* -------------------- INIT -------------------- */
  useEffect(() => {
    const init = async () => {
      const pending = localStorage.getItem("pendingPayment");
      if (!pending) {
        navigate("/programs");
        return;
      }

      const { courseId, pricingId } = JSON.parse(pending);

      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) {
        navigate("/login?redirect=/make-payment");
        return;
      }

      const { data: courseData } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single();

      const { data: pricingData } = await supabase
        .from("course_pricing")
        .select("*")
        .eq("id", pricingId)
        .single();

      const { data: regData } = await supabase
        .from("v_student_registration_status")
        .select("is_registered")
        .single();

      if (!courseData || !pricingData) {
        navigate("/programs");
        return;
      }

      setCourse(courseData);
      setPricing(pricingData);
      setIsRegistered(Boolean(regData?.is_registered));

      const tuition = pricingData.amount;
      let regFee = 0;

      if (!regData?.is_registered && pricingData.billing_period !== "annual") {
        regFee = 500;
      }

      setTuitionFee(tuition);
      setRegistrationFee(regFee);
      setLoading(false);
    };

    init();
  }, [navigate]);

  const total = tuitionFee + registrationFee;

  /* -------------------- HELPERS: show real function errors -------------------- */
  const showFunctionError = async (error: any) => {
    if (!error) return;

    if (error instanceof FunctionsHttpError) {
      const status = error.context.status;
      const bodyText = await error.context.text();
      console.error("FunctionsHttpError:", status, bodyText);
      alert(`BML start failed (${status}): ${bodyText}`);
      return;
    }
    if (error instanceof FunctionsRelayError) {
      console.error("FunctionsRelayError:", error.message);
      alert(`BML start failed: ${error.message}`);
      return;
    }
    if (error instanceof FunctionsFetchError) {
      console.error("FunctionsFetchError:", error.message);
      alert(`BML start failed: ${error.message}`);
      return;
    }

    console.error("Unknown function error:", error);
    alert(`BML start failed: ${String(error)}`);
  };

  /* -------------------- BML PAYMENT -------------------- */
  const handleBmlPay = async () => {
    if (!pricing || !course) return;
    if (!agree) {
      alert("Please agree to the Terms & Conditions.");
      return;
    }

    try {
      setSubmitting(true);

      // Make sure session exists (and refreshes)
      await supabase.auth.refreshSession();
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) {
        navigate("/login?redirect=/make-payment");
        return;
      }

      const userId = s.session.user.id;

      console.log("Starting BML payment…", {
        userId,
        courseId: course.id,
        pricingId: pricing.id,
        totalAmount: total,
      });

      const { data, error } = await supabase.functions.invoke(
        "initiate-bml-payment-v2",
        {
          body: {
            userId,
            courseId: course.id,
            pricingId: pricing.id,
            tuitionAmount: tuitionFee,
            registrationFee,
            totalAmount: total,
            currency: "MVR",
          },
        }
      );

      if (error) {
        await showFunctionError(error);
        return;
      }

      if (!data?.redirectUrl) {
        console.error("No redirectUrl returned:", data);
        alert("Gateway did not return a redirect URL.");
        return;
      }

      window.location.href = data.redirectUrl;
    } catch (err) {
      console.error(err);
      alert("Unable to start BML payment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* -------------------- MANUAL BANK TRANSFER -------------------- */
  const handleManualSubmit = async () => {
    if (!pricing || !course) return;
    if (!agree) {
      alert("Please agree to the Terms & Conditions.");
      return;
    }
    if (!file) {
      alert("Please upload a payment slip.");
      return;
    }

    try {
      setSubmitting(true);

      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) {
        navigate("/login?redirect=/make-payment");
        return;
      }

      // IMPORTANT: your bucket per summary is `payment_slips`
      const bucket = "payment_slips";

      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      await supabase.from("payments").insert({
        user_id: user.id,
        course_id: course.id,
        pricing_id: pricing.id,
        tuition_amount: tuitionFee,
        registration_fee: registrationFee,
        total_amount: total,
        amount: total,
        currency: "MVR",
        payment_method: "bank_transfer",
        status: "pending",
        slip_url: urlData.publicUrl,
      });

      localStorage.removeItem("pendingPayment");
      alert("Payment submitted successfully. We will verify and contact you.");
      navigate("/");
    } catch (err) {
      console.error(err);
      alert("Manual payment failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* -------------------- UI -------------------- */
  if (loading) {
    return (
      <Layout>
        <div className="py-20 text-center">Loading payment details…</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto px-4 py-12">
        <h1 className="text-xl font-semibold text-center mb-6">
          Complete Your Payment
        </h1>

        {/* Course Summary */}
        <div className="border rounded-xl p-4 mb-6 bg-white">
          <p className="font-medium">{course.title}</p>
          <p className="text-sm text-gray-500 capitalize">
            {pricing?.billing_period} fee
          </p>
        </div>

        {/* Fee Breakdown */}
        <div className="border rounded-xl p-4 mb-6 bg-white text-sm space-y-2">
          <div className="flex justify-between">
            <span>Tuition Fee</span>
            <span>MVR {tuitionFee.toLocaleString()}</span>
          </div>

          <div className="flex justify-between">
            <span>Registration Fee</span>
            <span>
              {registrationFee === 0 ? "Included" : `MVR ${registrationFee}`}
            </span>
          </div>

          <div className="border-t pt-2 font-semibold flex justify-between">
            <span>Total Payable</span>
            <span>MVR {total.toLocaleString()}</span>
          </div>
        </div>

        {/* Payment method selector */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setMethod("bml")}
            className={`py-3 rounded-lg font-semibold ${
              method === "bml"
                ? "bg-[#1F6F43] text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            BML Gateway
          </button>
          <button
            type="button"
            onClick={() => setMethod("bank_transfer")}
            className={`py-3 rounded-lg font-semibold ${
              method === "bank_transfer"
                ? "bg-gray-700 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Bank Transfer
          </button>
        </div>

        {/* Bank details (shown for manual) */}
        {method === "bank_transfer" && (
          <div className="border rounded-xl p-5 mb-6 bg-white">
            <h3 className="font-semibold mb-3">💰 Bank Transfer Details</h3>
            <p>
              <strong>Bank:</strong> Bank of Maldives
            </p>
            <p>
              <strong>Account Name:</strong> Emir X Pvt Ltd
            </p>
            <p>
              <strong>Account Number:</strong> 7730000761972
            </p>
          </div>
        )}

        {/* Upload slip (manual) */}
        {method === "bank_transfer" && (
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mb-4"
          />
        )}

        {/* Terms */}
        <label className="flex items-start gap-2 text-sm mb-4">
          <input
            type="checkbox"
            checked={agree}
            onChange={() => setAgree(!agree)}
          />
          <span>I agree to the Terms & Conditions and Refund Policy.</span>
        </label>

        {/* Action button */}
        {method === "bml" ? (
          <button
            onClick={handleBmlPay}
            disabled={submitting}
            className="w-full bg-[#1F6F43] text-white py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {submitting ? "Redirecting…" : `Pay via BML (MVR ${total})`}
          </button>
        ) : (
          <button
            onClick={handleManualSubmit}
            disabled={submitting || !file}
            className="w-full bg-gray-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {submitting ? "Submitting…" : `Submit Slip (MVR ${total})`}
          </button>
        )}
      </div>
    </Layout>
  );
}
