import React from "react";
import { Link, useLocation } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useApplication } from "@/context/ApplicationContext";
import { CheckCircle, Home, BookOpen, Phone, MessageCircle } from "lucide-react";

export default function PaymentSuccess() {
  const location = useLocation();
  const { selectedCourse, clearApplication } = useApplication();

  const params = new URLSearchParams(location.search);
  const paymentId = params.get("payment_id");

  React.useEffect(() => {
    clearApplication();
  }, [clearApplication]);

  return (
    <Layout>
      <section className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 bg-[#F4F6F8]">
        <div className="max-w-lg w-full mx-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-[#1F6F43] rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>

            {/* Success Message */}
            <h1 className="font-serif text-3xl font-bold text-[#2B2B2B] mb-4">
              Payment Successful!
            </h1>

            <p className="text-gray-600 mb-6">
              Thank you for enrolling at Everyone&apos;s Learning Centre. We&apos;ve received your payment.
            </p>

            {/* Payment Reference */}
            <div className="bg-[#F4F6F8] rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">Payment Reference</p>
              <p className="font-mono text-lg font-bold text-[#1F6F43]">
                {paymentId || "N/A"}
              </p>
            </div>

            {/* Course Info */}
            {selectedCourse && (
              <div className="bg-[#1F6F43]/5 border border-[#1F6F43]/20 rounded-lg p-4 mb-6 text-left">
                <div className="flex items-start">
                  <BookOpen className="w-5 h-5 text-[#1F6F43] mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#2B2B2B]">{selectedCourse.title}</p>
                    <p className="text-sm text-gray-500">{selectedCourse.category}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className="bg-[#C9A24D]/10 border border-[#C9A24D]/30 rounded-lg p-4 mb-8 text-left">
              <h3 className="font-semibold text-[#2B2B2B] mb-3">What&apos;s Next?</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <MessageCircle className="w-4 h-4 text-[#C9A24D] mr-2 flex-shrink-0 mt-0.5" />
                  We will contact you on Viber within 24 hours
                </li>
                <li className="flex items-start">
                  <Phone className="w-4 h-4 text-[#C9A24D] mr-2 flex-shrink-0 mt-0.5" />
                  You may also receive a phone call for confirmation
                </li>
                <li className="flex items-start">
                  <BookOpen className="w-4 h-4 text-[#C9A24D] mr-2 flex-shrink-0 mt-0.5" />
                  Class schedule and materials will be shared soon
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/programs"
                className="flex-1 inline-flex items-center justify-center bg-white border border-[#1F6F43] text-[#1F6F43] px-6 py-3 rounded-lg font-semibold hover:bg-[#1F6F43]/5 transition-colors"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                View Programs
              </Link>

              <Link
                to="/"
                className="flex-1 inline-flex items-center justify-center bg-[#1F6F43] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#185a36] transition-colors"
              >
                <Home className="w-5 h-5 mr-2" />
                Back to Home
              </Link>
            </div>

            {/* Support Info */}
            <p className="text-sm text-gray-500 mt-6">
              Have questions? Contact us at{" "}
              <a href="mailto:info@elc.mv" className="text-[#1F6F43] hover:underline">
                info@elc.mv
              </a>
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
