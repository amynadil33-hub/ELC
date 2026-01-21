import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const finalizeAuth = async () => {
      await supabase.auth.getSession();

      const redirect =
        localStorage.getItem('postAuthRedirect') || '/programs';

      localStorage.removeItem('postAuthRedirect');

      navigate(redirect, { replace: true });
    };

    finalizeAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-600 text-lg">Verifying your account…</p>
    </div>
  );
}
