import React from "react";
import Layout from "@/components/layout/Layout";
import { Shield, Lock, Mail, FileText } from "lucide-react";

export default function PrivacyPolicy() {
  const updated = "8 Feb 2026";

  return (
    <Layout>
      <section className="bg-[#1F6F43] py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center bg-white/10 text-white px-4 py-2 rounded-full text-sm mb-4">
            <Shield className="w-4 h-4 mr-2 text-[#C9A24D]" />
            Privacy Policy
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-white">
            ELC Privacy Policy
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
              <Lock className="w-6 h-6 text-[#1F6F43] mt-1" />
              <div>
                <h2 className="font-serif text-xl font-bold text-[#2B2B2B] mb-2">
                  1) Overview
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  Everyone&apos;s Learning Centre (“ELC”, “we”, “our”, “us”) respects your privacy. This
                  Privacy Policy explains how we collect, use, share, and protect your personal information
                  when you use our website and services (including course applications and payments).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="w-6 h-6 text-[#1F6F43] mt-1" />
              <div>
                <h2 className="font-serif text-xl font-bold text-[#2B2B2B] mb-2">
                  2) Information We Collect
                </h2>
                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                  <li>
                    <span className="font-semibold text-[#2B2B2B]">Application details:</span> student name, age,
                    school, grade, English level, parent/guardian contact details, and related information you enter.
                  </li>
                  <li>
                    <span className="font-semibold text-[#2B2B2B]">Account information:</span> email address and login
                    details (handled through our authentication provider).
                  </li>
                  <li>
                    <span className="font-semibold text-[#2B2B2B]">Payment information:</span> payment status, amount,
                    course/pricing reference.{" "}
                    <span className="font-semibold">We do not store card details</span> on our servers.
                  </li>
                  <li>
                    <span className="font-semibold text-[#2B2B2B]">Manual transfer slips:</span> if you upload a bank
                    transfer slip, we store the file to verify your payment.
                  </li>
                  <li>
                    <span className="font-semibold text-[#2B2B2B]">Technical data:</span> basic analytics such as device
                    type, pages visited, and logs necessary for security and performance.
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-[#1F6F43] mt-1" />
              <div>
                <h2 className="font-serif text-xl font-bold text-[#2B2B2B] mb-2">
                  3) How We Use Your Information
                </h2>
                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                  <li>To process applications and enrollments.</li>
                  <li>To confirm payments and issue receipts/confirmations where applicable.</li>
                  <li>To contact you about schedules, course updates, and important notices.</li>
                  <li>To improve our services and keep the site secure.</li>
                  <li>To comply with legal and regulatory requirements.</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Lock className="w-6 h-6 text-[#1F6F43] mt-1" />
              <div>
                <h2 className="font-serif text-xl font-bold text-[#2B2B2B] mb-2">
                  4) Payments & Card Security (BML)
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  Card payments are processed securely by <span className="font-semibold">Bank of Maldives</span> (BML)
                  through their payment gateway. ELC does not store your card number, CVV, or full card details.
                  We may store transaction references, payment status, and amounts for reconciliation and recordkeeping.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="w-6 h-6 text-[#1F6F43] mt-1" />
              <div>
                <h2 className="font-serif text-xl font-bold text-[#2B2B2B] mb-2">
                  5) Sharing of Information
                </h2>
                <p className="text-gray-600 leading-relaxed mb-3">
                  We only share personal information when necessary:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                  <li>With service providers that help run our platform (hosting, database, storage, email).</li>
                  <li>With payment processors/banks for card payments and reconciliation.</li>
                  <li>If required by law, court order, or to protect our rights and safety.</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Lock className="w-6 h-6 text-[#1F6F43] mt-1" />
              <div>
                <h2 className="font-serif text-xl font-bold text-[#2B2B2B] mb-2">
                  6) Data Retention
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  We retain information only as long as needed for enrollment, academic administration, payment
                  verification, and legal compliance. Transfer slip uploads are retained for verification and audit
                  purposes and may be removed when no longer required.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-[#1F6F43] mt-1" />
              <div>
                <h2 className="font-serif text-xl font-bold text-[#2B2B2B] mb-2">
                  7) Your Rights
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  You may request access, correction, or deletion of your personal information (subject to legal
                  obligations). To do so, contact us using the details below.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-6 h-6 text-[#1F6F43] mt-1" />
              <div>
                <h2 className="font-serif text-xl font-bold text-[#2B2B2B] mb-2">
                  8) Contact Us
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  If you have questions about this Privacy Policy, please contact:
                </p>
                <div className="mt-3 bg-[#F4F6F8] rounded-lg p-4 text-sm text-gray-700">
                  <div className="font-semibold text-[#2B2B2B]">Everyone&apos;s Learning Centre (ELC)</div>
                  <div>Email: <span className="font-mono">elc@everyones.com.mv</span></div>
                  <div>Location: Male&apos;, Maldives</div>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500 pt-4 border-t">
              This document is provided for general informational purposes and may be updated from time to time.
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
