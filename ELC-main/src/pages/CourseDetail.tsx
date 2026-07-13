import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/lib/supabase';
import { Course } from '@/types';
import { useApplication } from '@/context/ApplicationContext';
import {
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

interface CoursePricing {
  id: string;
  course_id: string;
  label: string;
  billing_period: string;
  amount: number | null;
  sort_order: number;
  is_active: boolean;
}

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setSelectedCourse } = useApplication();

  const [course, setCourse] = useState<Course | null>(null);
  const [pricing, setPricing] = useState<CoursePricing[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<CoursePricing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchCourse(id);
  }, [id]);

  const fetchCourse = async (courseId: string) => {
    try {
      setLoading(true);

      /* ---------- COURSE ---------- */
      const { data: courseData, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (error) throw error;
      setCourse(courseData);

      /* ---------- PRICING ---------- */
      const { data: pricingData } = await supabase
        .from('course_pricing')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_active', true)
        .not('amount', 'is', null)
        .order('sort_order', { ascending: true });

      const availablePricing = pricingData || [];
      setPricing(availablePricing);

      // ✅ FIX: auto-select when only one option exists
      if (availablePricing.length === 1) {
        setSelectedPrice(availablePricing[0]);
      } else {
        setSelectedPrice(availablePricing[0] ?? null);
      }
    } catch (err) {
      console.error('Error loading course:', err);
      setCourse(null);
      setPricing([]);
      setSelectedPrice(null);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!course || !selectedPrice) {
      alert('No pricing option selected. Please select a fee option.');
      return;
    }

    setSelectedCourse({
      ...course,
      selected_price: selectedPrice
    } as any);

    navigate(`/apply/${course.id}`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-16 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="h-12 bg-gray-200 rounded w-3/4 mb-8" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
          <Link
            to="/programs"
            className="inline-flex items-center bg-[#1F6F43] text-white px-6 py-3 rounded-lg font-semibold"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Programs
          </Link>
        </div>
      </Layout>
    );
  }

  const displayAmount = selectedPrice?.amount ?? null;

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="bg-[#F4F6F8] py-4">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center space-x-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-[#1F6F43]">Home</Link>
            <span>/</span>
            <Link to="/programs" className="text-gray-500 hover:text-[#1F6F43]">Programs</Link>
            <span>/</span>
            <span className="text-[#1F6F43] font-medium">{course.title}</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-[#1F6F43] py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row justify-between gap-8">
          <div>
            <span className="inline-block bg-[#C9A24D]/20 text-[#C9A24D] px-4 py-1 rounded-full text-sm font-medium mb-4">
              {course.category}
            </span>

            <h1 className="font-serif text-4xl font-bold text-white mb-4">
              {course.title}
            </h1>

            <p className="text-white/90 text-lg max-w-2xl whitespace-pre-line">
              {course.description}
            </p>
          </div>

          {/* Pricing Card */}
          <div className="bg-white rounded-xl p-6 shadow-xl min-w-[300px]">
            <div className="text-center mb-4">
              <span className="text-sm text-gray-500">Course Fee</span>
              <div className="text-4xl font-bold text-[#1F6F43]">
                {displayAmount ? `MVR ${displayAmount.toLocaleString()}` : 'TBD'}
              </div>
            </div>

            {/* Pricing selector (only if more than one option) */}
            {pricing.length > 1 && (
              <div className="space-y-2 mb-4">
                {pricing.map(option => (
                  <label
                    key={option.id}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer ${
                      selectedPrice?.id === option.id
                        ? 'border-[#1F6F43] bg-[#1F6F43]/5'
                        : 'border-gray-200'
                    }`}
                  >
                    <span className="font-medium capitalize">
                      {option.billing_period}
                    </span>
                    <input
                      type="radio"
                      checked={selectedPrice?.id === option.id}
                      onChange={() => setSelectedPrice(option)}
                    />
                  </label>
                ))}
              </div>
            )}

            {/* Registration fee info */}
            <div className="text-sm text-gray-600 bg-[#F4F6F8] rounded-lg p-4 mb-6">
              <p className="font-medium text-[#2B2B2B] mb-1">
                Registration Fee
              </p>
              <p>
                A one-time registration fee of <strong>MVR 500</strong> applies
                to new students only. This fee is waived for existing students
                and included in annual program fees.
              </p>
            </div>

            <button
              onClick={handleApply}
              className="w-full bg-[#1F6F43] text-white py-3 rounded-lg font-semibold hover:bg-[#185a36]"
            >
              Apply & Make Payment
              <ArrowRight className="w-5 h-5 ml-2 inline" />
            </button>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-3 gap-8">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="font-serif text-2xl font-bold mb-4">
                About This Program
              </h2>
              <p className="text-gray-600 whitespace-pre-line">
                {course.description}
              </p>
            </div>

            {course.learning_outcomes && course.learning_outcomes.trim() !== '' && (
              <div className="bg-[#F4F6F8] rounded-xl p-6">
                <h3 className="font-serif text-xl font-bold mb-4">
                  What You’ll Learn
                </h3>
                <p className="text-gray-700 whitespace-pre-line">
                  {course.learning_outcomes}
                </p>
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <div>
            <div className="bg-[#F4F6F8] rounded-xl p-6 sticky top-28">
              <h3 className="font-serif text-xl font-bold mb-6">
                Program Details
              </h3>

              <div className="space-y-4">
                {course.age_range && <Detail label="Age Range" value={`${course.age_range} years`} />}
                {course.grades && <Detail label="Grades" value={course.grades} />}
                {course.duration && <Detail label="Duration" value={course.duration} />}
                {course.schedule && <Detail label="Schedule" value={course.schedule} />}
                <Detail
                  label="Fee"
                  value={displayAmount ? `MVR ${displayAmount.toLocaleString()}` : 'TBD'}
                />
                <Detail
                  label="Registration Fee"
                  value="MVR 500 (One-time for new students)"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-sm text-gray-500">{label}</span>
      <p className="font-medium">{value}</p>
    </div>
  );
}
