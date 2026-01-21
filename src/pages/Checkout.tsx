import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useApplication } from '@/context/ApplicationContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, 
  CreditCard, 
  User, 
  BookOpen,
  Shield,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function Checkout() {
  const navigate = useNavigate();
  const { selectedCourse, applicationData, clearApplication } = useApplication();
  const { user } = useAuth();
  
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/checkout');
      return;
    }
    
    if (!selectedCourse || !applicationData) {
      navigate('/programs');
    }
  }, [user, selectedCourse, applicationData, navigate]);

  const handlePayment = async () => {
    if (!user || !selectedCourse || !applicationData) return;

    setProcessing(true);
    setError('');

    try {
      // Generate a mock payment reference
      const paymentReference = `ELC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert([{
          user_id: user.id,
          application_id: applicationData.id,
          course_id: selectedCourse.id,
          amount: selectedCourse.fee || 0,
          status: 'paid', // Simulating successful payment
          payment_reference: paymentReference,
          payment_method: 'BML',
        }]);

      if (paymentError) throw paymentError;

      // Update application status
      if (applicationData.id) {
        await supabase
          .from('applications')
          .update({ status: 'paid' })
          .eq('id', applicationData.id);
      }

      toast.success('Payment successful!');
      navigate('/payment-success', { state: { paymentReference } });
    } catch (err) {
      console.error('Payment error:', err);
      setError('Payment failed. Please try again.');
      toast.error('Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  if (!selectedCourse || !applicationData) {
    return null;
  }

  return (
    <Layout>
      {/* Header */}
      <section className="bg-[#1F6F43] py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/apply"
            className="inline-flex items-center text-white/80 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Application
          </Link>
          <h1 className="font-serif text-3xl font-bold text-white">
            Complete Your Payment
          </h1>
          <p className="text-white/80 mt-2">
            Secure checkout for your enrollment
          </p>
        </div>
      </section>

      {/* Checkout Content */}
      <section className="py-12 bg-[#F4F6F8]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Order Summary */}
            <div className="lg:col-span-2 space-y-6">
              {/* Course Summary */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="font-serif text-xl font-bold text-[#2B2B2B] mb-4 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-[#C9A24D]" />
                  Course Details
                </h2>
                
                <div className="border-b border-gray-100 pb-4 mb-4">
                  <h3 className="font-semibold text-[#2B2B2B] text-lg">{selectedCourse.title}</h3>
                  <p className="text-gray-500 text-sm">{selectedCourse.category}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Age Range:</span>
                    <p className="font-medium text-[#2B2B2B]">{selectedCourse.age_range} years</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Duration:</span>
                    <p className="font-medium text-[#2B2B2B]">{selectedCourse.duration}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Schedule:</span>
                    <p className="font-medium text-[#2B2B2B]">{selectedCourse.schedule}</p>
                  </div>
                </div>
              </div>

              {/* Applicant Summary */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="font-serif text-xl font-bold text-[#2B2B2B] mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-[#C9A24D]" />
                  Applicant Information
                </h2>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Student Name:</span>
                    <p className="font-medium text-[#2B2B2B]">{applicationData.full_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Age:</span>
                    <p className="font-medium text-[#2B2B2B]">{applicationData.age} years</p>
                  </div>
                  <div>
                    <span className="text-gray-500">School:</span>
                    <p className="font-medium text-[#2B2B2B]">{applicationData.school}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Grade:</span>
                    <p className="font-medium text-[#2B2B2B]">{applicationData.grade_at_school}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <p className="font-medium text-[#2B2B2B]">{applicationData.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Phone:</span>
                    <p className="font-medium text-[#2B2B2B]">{applicationData.phone}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Parent:</span>
                    <p className="font-medium text-[#2B2B2B]">{applicationData.parent_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Parent Viber:</span>
                    <p className="font-medium text-[#2B2B2B]">{applicationData.parent_viber}</p>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="font-serif text-xl font-bold text-[#2B2B2B] mb-4 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-[#C9A24D]" />
                  Payment Method
                </h2>
                
                <div className="border-2 border-[#1F6F43] rounded-lg p-4 bg-[#1F6F43]/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-[#1F6F43] rounded-lg flex items-center justify-center mr-4">
                        <span className="text-white font-bold text-sm">BML</span>
                      </div>
                      <div>
                        <p className="font-semibold text-[#2B2B2B]">Bank of Maldives</p>
                        <p className="text-sm text-gray-500">Pay securely with BML</p>
                      </div>
                    </div>
                    <CheckCircle className="w-6 h-6 text-[#1F6F43]" />
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 mt-4 flex items-center">
                  <Shield className="w-4 h-4 mr-2 text-[#C9A24D]" />
                  Your payment information is secure and encrypted
                </p>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md p-6 sticky top-28">
                <h2 className="font-serif text-xl font-bold text-[#2B2B2B] mb-6">
                  Payment Summary
                </h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Course Fee</span>
                    <span className="font-medium">MVR {selectedCourse.fee?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Registration Fee</span>
                    <span className="font-medium">MVR 0</span>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between">
                      <span className="font-semibold text-[#2B2B2B]">Total</span>
                      <span className="text-2xl font-bold text-[#1F6F43]">
                        MVR {selectedCourse.fee?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                <button
                  onClick={handlePayment}
                  disabled={processing}
                  className="w-full bg-[#1F6F43] text-white py-4 rounded-lg font-semibold hover:bg-[#185a36] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {processing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      Pay with BML
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-gray-500 mt-4">
                  By completing this payment, you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
