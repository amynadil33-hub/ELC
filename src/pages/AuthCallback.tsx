import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/lib/supabase";

function normalizeInternalRedirect(raw: string | null): string | null {
  if (!raw) return null;

  try {
    const decoded = decodeURIComponent(raw);

    // Allow only internal paths or same-origin URLs
    if (decoded.startsWith("/")) return decoded;

    // If a full URL is passed, only allow same-origin
    const u = new URL(decoded);
    if (u.origin === window.location.origin) {
      return u.pathname + u.search + u.hash;
    }

    return null;
  } catch {
    return null;
  }
}

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      try {
        const url = new URL(window.location.href);

        // Supabase PKCE confirm email flow commonly returns ?code=
        const code = url.searchParams.get("code");

        // Support multiple param names (your app uses redirect, earlier we used next)
        const nextParam =
          url.searchParams.get("next") ||
          url.searchParams.get("redirect") ||
          url.searchParams.get("redirect_to");

        const next = normalizeInternalRedirect(nextParam);

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("exchangeCodeForSession error:", error);
          }
        }

        // Priority:
        // 1) explicit next/redirect param
        // 2) pendingPayment exists -> continue flow
        // 3) fallback home
        const pendingPayment = localStorage.getItem("pendingPayment");

        if (next) {
          navigate(next, { replace: true });
          return;
        }

        if (pendingPayment) {
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
