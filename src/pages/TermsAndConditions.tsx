import React from "react";
import Layout from "@/components/layout/Layout";
import { FileText, ShieldCheck, CreditCard, AlertTriangle } from "lucide-react";

export default function TermsAndConditions() {
  const updated = "8 Feb 2026";

  return (
    <Layout>
      <section className="bg-[#1F6F43] py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center bg-white/10 text-white px-4 py-2 rounded-full text-sm mb-4">
            <FileText className="w-4 h-4 mr-2 text-[#C9A24D]" />
            Terms &amp; Conditions
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-white">
            ELC Terms &amp; Conditions
          </h1>
          <p className="text-white/80 mt-2 text-sm">
            Last updated: <span className="text-[#C9A24D] font-medium">{updated}</span>
          </p>
        </div>
      </section>

      <section className="py-12 bg-[#F4F6F8]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-6 h-6 text-[#1F6F43] mt-1" />
              <div>
                <h2 className="font-serif text-xl font-bold text-[#2B2B2B] mb-2">1) Acceptance of Terms</h2>
                <p className="text-gray-600 leading-relaxed">
                  By accessing our website, submitting an application, or making a payment, you agree to these
                  Terms &amp; Conditions. If you do not agree, please do not use the services.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="w-6 h-6 text-[#1F6F43] mt-1" />
              <div>
                <h2 className="font-serif text-xl font-bold text-[#2B2B2B] mb-2">2) Applications & Enrollment</h2>
                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                  <li>Submitting an application does not guarantee a seat unless confirmed by ELC.</li>
                  <li>ELC may request additional information to validate student eligibility.</li>
                  <li>Class schedules, teachers, and locations may change with reasonable notice.</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CreditCard className="w-6 h-6 text-[#1F6F43] mt-1" />
              <div>
                <h2 className="font-serif text-xl font-bold text-[#2B2B2B] mb-2">3) Payments (Card & Transfer)</h2>
                <p className="text-gray-600 leading-relaxed mb-3">
                  Payments can be made via the BML payment gateway (cards) or manual bank transfer (with slip upload).
                </p>
                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                  <li>
                    Card payments are processed securely by <span className="font-semibold">Bank of Maldives</span>.
                    ELC does not store card details.
                  </li>
                  <li>
                    For manual transfers, you must upload a clear slip. Enrollment may remain pending until verified.
                  </li>
                  <li>
                    If a payment fails or is reversed, your enrollment may be paused or canceled until resolved.
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-[#1F6F43] mt-1" />
              <div>
                <h2 className="font-serif text-xl font-bold text-[#2B2B2B] mb-2">4) User Responsibilities</h2>
                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                  <li>You are responsible for providing accurate application information.</li>
                  <li>Do not misuse the website, attempt unauthorized access, or disrupt services.</li>
                  <li>Keep your login credentials secure and do not share your account access.</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="w-6 h-6 text-[#1F6F43] mt-1" />
              <div>
                <h2 className="font-serif text-xl font-bold text-[#2B2B2B] mb-2">5) Refunds & Cancellations</h2>
                <p className="text-gray-600 leading-relaxed">
                  Refund and cancellation rules are described in our{" "}
                  <a href="/refund-policy" className="text-[#1F6F43] font-semibold underline">
                    Refund Policy
                  </a>
                  . By paying, you acknowledge and agree to it.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <ShieldCheck className="w-6 h-6 text-[#1F6F43] mt-1" />
              <div>
                <h2 className="font-serif text-xl font-bold text-[#2B2B2B] mb-2">6) Limitation of Liability</h2>
                <p className="text-gray-600 leading-relaxed">
                  To the maximum extent permitted by law, ELC is not liable for indirect or consequential damages,
                  loss of data, or losses arising from service interruptions, third-party systems, or events beyond
                  our control.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="w-6 h-6 text-[#1F6F43] mt-1" />
              <div>
                <h2 className="font-serif text-xl font-bold text-[#2B2B2B] mb-2">7) Changes to These Terms</h2>
                <p className="text-gray-600 leading-relaxed">
                  We may update these Terms &amp; Conditions from time to time. Updates will be posted on this page.
                </p>
              </div>
            </div>

            <div className="text-xs text-gray-500 pt-4 border-t">
              If you have questions, contact ELC at <span className="font-mono">elc@everyones.com.mv</span>.
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
