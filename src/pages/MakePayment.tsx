import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface MakePaymentProps {
  courseId: string;
  amount: number;
}

export default function MakePayment({ courseId, amount }: MakePaymentProps) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleBmlPayment = async () => {
    try {
      setLoading(true);

      // 🔑 VERY IMPORTANT: get the logged-in session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        toast.error("You must be logged in to continue");
        return;
      }

      // 🚀 Call Edge Function WITH Authorization header
      const { data, error } = await supabase.functions.invoke(
        "initiate-bml-payment-v2",
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: {
            courseId,
            amount,
          },
        }
      );

      if (error) {
        console.error("BML start failed:", error);
        toast.error("Failed to start BML payment");
        return;
      }

      if (!data?.paymentUrl) {
        console.error("Invalid BML response:", data);
        toast.error("Invalid payment response from BML");
        return;
      }

      // ✅ REDIRECT USER TO BML CARD PAGE
      window.location.href = data.paymentUrl;
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">Make Payment</h1>

        <div className="border rounded-lg p-4 mb-6">
          <p className="mb-2">
            <strong>Amount:</strong> MVR {amount}
          </p>
          <p>
            <strong>Payment Method:</strong> Bank of Maldives (Card)
          </p>
        </div>

        <button
          onClick={handleBmlPayment}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Redirecting to BML..." : "Pay via BML"}
        </button>
      </div>
    </Layout>
  );
}
