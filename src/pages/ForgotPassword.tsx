import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/context/AuthContext';
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError('An unexpected error occurred');
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
                We've sent password reset instructions to <strong>{email}</strong>. Please check your inbox.
              </p>
              <Link
                to="/login"
                className="inline-block bg-[#1F6F43] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#185a36] transition-colors"
              >
                Back to Login
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
            {/* Back Link */}
            <Link
              to="/login"
              className="inline-flex items-center text-gray-600 hover:text-[#1F6F43] mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Link>

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="font-serif text-2xl font-bold text-[#2B2B2B]">
                Forgot Password?
              </h1>
              <p className="text-gray-600 mt-2">
                Enter your email and we'll send you instructions to reset your password.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F6F43] focus:border-transparent outline-none"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1F6F43] text-white py-3 rounded-lg font-semibold hover:bg-[#185a36] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Reset Instructions'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
}
