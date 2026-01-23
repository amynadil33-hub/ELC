import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/lib/supabase';

interface Pricing {
  id: string;
  billing_period: string;
  amount: number;
}

export default function MakePayment() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [course, setCourse] = useState<any>(null);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [agree, setAgree] = useState(false);

  const [tuitionFee, setTuitionFee] = useState(0);
  const [registrationFee, setRegistrationFee] = useState(0);

  /* -------------------- INIT -------------------- */
  useEffect(() => {
    const init = async () => {
      const pending = localStorage.getItem('pendingPayment');
      if (!pending) {
        navigate('/programs');
        return;
      }

      const { courseId, pricingId } = JSON.parse(pending);

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        navigate('/login?redirect=/make-payment');
        return;
      }

      // Fetch course
      const { data: courseData } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      // Fetch pricing
      const { data: pricingData } = await supabase
        .from('course_pricing')
        .select('*')
        .eq('id', pricingId)
        .single();

      // Check registration status
      const { data: regData } = await supabase
        .from('v_student_registration_status')
        .select('is_registered')
        .single();

      if (!courseData || !pricingData) {
        navigate('/programs');
        return;
      }

      setCourse(courseData);
      setPricing(pricingData);
      setIsRegistered(Boolean(regData?.is_registered));

      const tuition = pricingData.amount;
      let regFee = 0;

      if (!regData?.is_registered && pricingData.billing_period !== 'annual') {
        regFee = 500;
      }

      setTuitionFee(tuition);
      setRegistrationFee(regFee);

      setLoading(false);
    };

    init();
  }, [navigate]);

  /* -------------------- SUBMIT -------------------- */
  const handleSubmit = async () => {
    if (!file || !pricing || !course) return;

    try {
      setSubmitting(true);

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) return;

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('payment_slips')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('payment_slips')
        .getPublicUrl(filePath);

      const totalAmount = tuitionFee + registrationFee;

      await supabase.from('payments').insert({
        user_id: user.id,
        course_id: course.id,
        pricing_id: pricing.id,
        tuition_amount: tuitionFee,
        registration_fee: registrationFee,
        total_amount: totalAmount,
        amount: totalAmount,
        payment_method: 'bank_transfer',
        status: 'pending',
        slip_url: urlData.publicUrl
      });

      localStorage.removeItem('pendingPayment');

      alert(
        'Payment submitted successfully.\nOur team will verify your payment and contact you shortly.'
      );

      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /* -------------------- UI -------------------- */
  if (loading) {
    return (
      <Layout>
        <div className="py-20 text-center">Loading payment details…</div>
      </Layout>
    );
  }

  const total = tuitionFee + registrationFee;

  return (
    <Layout>
      <div className="max-w-md mx-auto px-4 py-12">
        <h1 className="text-xl font-semibold text-center mb-6">
          Complete Your Payment
        </h1>

        {/* Course Summary */}
        <div className="border rounded-xl p-4 mb-6 bg-white">
          <p className="font-medium">{course.title}</p>
          <p className="text-sm text-gray-500 capitalize">
            {pricing.billing_period} fee
          </p>
        </div>

        {/* Fee Breakdown */}
        <div className="border rounded-xl p-4 mb-6 bg-white text-sm space-y-2">
          <div className="flex justify-between">
            <span>Tuition Fee</span>
            <span>MVR {tuitionFee.toLocaleString()}</span>
          </div>

          <div className="flex justify-between">
            <span>Registration Fee</span>
            <span>
              {registrationFee === 0 ? 'Included' : `MVR ${registrationFee}`}
            </span>
          </div>

          <div className="border-t pt-2 font-semibold flex justify-between">
            <span>Total Payable</span>
            <span>MVR {total.toLocaleString()}</span>
          </div>
        </div>

        {/* Bank Details */}
        <div className="border rounded-xl p-5 mb-6 bg-white">
          <h3 className="font-semibold mb-3">💰 Bank Transfer Details</h3>
          <p><strong>Bank:</strong> Bank of Maldives</p>
          <p><strong>Account Name:</strong> Everyone's Learning Center</p>
          <p><strong>Account Number:</strong> 7730000226678</p>
        </div>

        {/* Upload */}
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="mb-4"
        />

        {/* Terms */}
        <label className="flex items-start gap-2 text-sm mb-4">
          <input
            type="checkbox"
            checked={agree}
            onChange={() => setAgree(!agree)}
          />
          <span>
            I agree to the Terms & Conditions and Refund Policy.
          </span>
        </label>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!file || !agree || submitting}
          className="w-full bg-gradient-to-r from-purple-600 to-teal-500 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : `Pay MVR ${total}`}
        </button>

        {/* BML Placeholder */}
        <button
          disabled
          className="w-full mt-4 bg-gray-300 text-gray-600 py-3 rounded-lg font-semibold"
        >
          Pay via BML Gateway (Coming Soon)
        </button>
      </div>
    </Layout>
  );
}
