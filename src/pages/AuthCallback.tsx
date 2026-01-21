import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const run = async () => {
      const code = params.get("code");
      const redirect = params.get("redirect") || "/";

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        // At this point user is authenticated (session stored by supabase-js)
        navigate(redirect, { replace: true });
      } catch (e) {
        console.error("Auth callback error:", e);
        navigate("/login", { replace: true });
      }
    };

    run();
  }, [navigate, params]);

  return (
    <Layout>
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="text-gray-600">Signing you in…</div>
      </div>
    </Layout>
  );
}
