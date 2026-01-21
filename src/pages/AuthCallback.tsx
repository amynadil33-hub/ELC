import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const next = url.searchParams.get("next"); // optional

        // If using PKCE, Supabase sends ?code=
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("exchangeCodeForSession error:", error);
          }
        }

        // Priority:
        // 1) explicit next
        // 2) pendingPayment exists -> continue flow
        // 3) fallback home
        const pending = localStorage.getItem("pendingPayment");

        if (next) {
          navigate(next, { replace: true });
          return;
        }

        if (pending) {
          navigate("/make-payment", { replace: true });
          return;
        }

        navigate("/", { replace: true });
      } catch (err) {
        console.error("AuthCallback error:", err);
        navigate("/", { replace: true });
      }
    };

    run();
  }, [navigate]);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="text-xl font-semibold text-[#2B2B2B]">Signing you in…</div>
        <div className="text-gray-500 mt-2">Please wait a moment.</div>
      </div>
    </Layout>
  );
}
