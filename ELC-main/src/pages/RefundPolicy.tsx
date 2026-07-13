import React from "react";
import Layout from "@/components/layout/Layout";
import { RefreshCcw, CreditCard, FileText, AlertTriangle } from "lucide-react";

export default function RefundPolicy() {
  const updated = "8 Feb 2026";

  return (
    <Layout>
      <section className="bg-[#1F6F43] py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center bg-white/10 text-white px-4 py-2 rounded-full text-sm mb-4">
            <RefreshCcw className="w-4 h-4 mr-2 text-[#C9A24D]" />
            Refund &amp; Cancellation Policy
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-white">
            ELC Refund &amp; Cancellation Policy
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
              <FileText className="w-6 h-6 text-[#1F6F43] mt-1" />
              <div>
                <h2 className="font-serif text-xl font-bold text-[#2B2B2B] mb-2">1) Overview</h2>
                <p className="text-gray-600 leading-relaxed">
                  This policy explains refunds and cancellations for course fees paid to Everyone&apos;s Learning Centre
                  (“ELC”). By paying, you acknowledge and agree to this policy.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-[#1F6F43] mt-1" />
              <div>
                <h2 className="font-serif text-xl font-bold text-[#2B2B2B] mb-2">2) General Rules</h2>
                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                  <li>Refunds may be granted at ELC’s discretion based on the reason and timing of the request.</li>
                  <li>Administrative or processing fees may be non-refundable where applicable.</li>
                  <li>
                    If a class has started and sessions have been attended, refunds may be reduced proportionally or not
                    issued depending on circumstances.
                  </li>
                  <li>
                    In cases of misconduct, repeated non-compliance, or abuse of staff/students, ELC may cancel
                    enrollment without refund.
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <RefreshCcw className="w-6 h-6 text-[#1F6F43] mt-1" />
              <div>
                <h2 className="font-serif text-xl font-bold text-[#2B2B2B] mb-2">3) Cancellations by ELC</h2>
                <p className="text-gray-600 leading-relaxed">
                  If ELC cancels a program (e.g., due to insufficient enrollment or operational reasons), you may be
                  offered either a reschedule/transfer option or a refund for the affected portion of the program.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CreditCard className="w-6 h-6 text-[#1F6F43] mt-1" />
              <div>
                <h2 className="font-serif text-xl font-bold text-[#2B2B2B] mb-2">4) Payment Method & Refund Method</h2>
                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                  <li>
                    <span className="font-semibold text-[#2B2B2B]">Card payments:</span> processed via Bank of Maldives.
                    Refunds (if approved) may be returned to the original card/account where possible.
                  </li>
                  <li>
                    <span className="font-semibold text-[#2B2B2B]">Manual transfer payments:</span> refunds (if approved)
                    may be returned via bank transfer to an account you provide.
                  </li>
                  <li>
                    Refund timing depends on verification and banking timelines. ELC cannot control bank processing
                    times.
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="w-6 h-6 text-[#1F6F43] mt-1" />
              <div>
                <h2 className="font-serif text-xl font-bold text-[#2B2B2B] mb-2">5) How to Request a Refund</h2>
                <p className="text-gray-600 leading-relaxed mb-3">
                  To request a refund/cancellation, contact ELC with:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                  <li>Student name</li>
                  <li>Course name</li>
                  <li>Payment reference (or receipt)</li>
                  <li>Reason for refund request</li>
                </ul>

                <div className="mt-4 bg-[#F4F6F8] rounded-lg p-4 text-sm text-gray-700">
                  <div className="font-semibold text-[#2B2B2B]">Contact</div>
                  <div>Email: <span className="font-mono">elc@everyones.com.mv</span></div>
                  <div>Location: Male&apos;, Maldives</div>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500 pt-4 border-t">
              This policy may be updated from time to time. Please review it periodically.
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
