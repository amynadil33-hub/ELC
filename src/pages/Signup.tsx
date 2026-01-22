import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function Signup() {
  const [searchParams] = useSearchParams();

  // ✅ IMPORTANT:
  // - If user came from Apply flow, redirect will exist (e.g. /make-payment)
  // - If user came from homepage signup, redirect will be null => go home after verification
  const redirect = searchParams.get("redirect"); // <-- NO default

  const { signUp } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const passwordRequirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Contains a number", met: /\d/.test(password) },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(password) },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      // ✅ If redirect exists: send email link to /auth/callback?next=/make-payment
      // ✅ If redirect is null: do NOT override Supabase default Site URL (home)
      const emailRedirectTo = redirect
        ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect)}`
        : undefined;

      const { error } = await signUp(email, password, {
        emailRedirectTo,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);
      toast.success("Account created! Please check your email to verify.");
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Layout>
        <section className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 bg-[#F4F6F8]">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-[#1F6F43] rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>

              <h1 className="font-serif text-2xl font-bold text-[#2B2B2B] mb-4">
                Check Your Email
              </h1>

              <p className="text-gray-600 mb-6">
                We’ve sent a verification link to <strong>{email}</strong>.
                {redirect ? (
                  <> After verification you’ll continue to payment.</>
                ) : (
                  <> After verification you can sign in normally.</>
                )}
              </p>

              <Link
                to={`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
                className="inline-block bg-[#1F6F43] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#185a36] transition-colors"
              >
                Go to Login
              </Link>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 bg-[#F4F6F8]">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#1F6F43] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">ELC</span>
              </div>
              <h1 className="font-serif text-2xl font-bold text-[#2B2B2B]">
                Create Account
              </h1>
              <p className="text-gray-600 mt-2">
                {redirect
                  ? "Create an account to continue payment"
                  : "Join ELC to enroll in our programs"}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F6F43] focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F6F43] focus:border-transparent"
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>

                <div className="mt-3 space-y-1">
                  {passwordRequirements.map((req, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center text-sm ${
                        req.met ? "text-green-600" : "text-gray-400"
                      }`}
                    >
                      <CheckCircle
                        className={`w-4 h-4 mr-2 ${
                          req.met ? "text-green-600" : "text-gray-300"
                        }`}
                      />
                      {req.label}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F6F43]"
                  placeholder="Confirm password"
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">
                    Passwords do not match
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1F6F43] text-white py-3 rounded-lg font-semibold hover:bg-[#185a36] disabled:opacity-50"
              >
                {loading ? "Creating account…" : "Create Account"}
              </button>
            </form>

            <p className="text-center mt-6 text-gray-600">
              Already have an account?{" "}
              <Link
                to={`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
                className="text-[#1F6F43] font-medium"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
