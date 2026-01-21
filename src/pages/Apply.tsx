import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useApplication } from '@/context/ApplicationContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { ENGLISH_LEVELS, SCHOOL_TIMES, GRADES } from '@/lib/constants';
import { Application, Course } from '@/types';
import {
  ArrowLeft,
  ArrowRight,
  User,
  Mail,
  Phone,
  School,
  BookOpen,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

type CoursePricing = {
  id: string;
  course_id: string;
  label: string;
  billing_period: string;
  sort_order: number;
  amount: number | null;
};

export default function Apply() {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const { selectedCourse, setSelectedCourse, setApplicationData } = useApplication();
  const { user } = useAuth();

  const [course, setCourse] = useState<Course | null>(selectedCourse);
  const [selectedPricing, setSelectedPricing] = useState<CoursePricing | null>(
    (selectedCourse as any)?.selected_price ?? null
  );
  const [loading, setLoading] = useState(!selectedCourse);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<Partial<Application>>({
    full_name: '',
    age: undefined,
    english_level: '',
    email: '',
    phone: '',
    student_id_no: '',
    grade_at_school: '',
    school: '',
    school_time: '',
    parent_name: '',
    parent_viber: ''
  });

  /* -------------------- LOAD COURSE -------------------- */
  useEffect(() => {
    if (!courseId) {
      navigate('/programs');
      return;
    }

    if (selectedCourse) {
      setCourse(selectedCourse);
      setLoading(false);
      return;
    }

    fetchCourse(courseId);
  }, [courseId]);

  const fetchCourse = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setCourse(data);
      setSelectedCourse(data);
    } catch {
      navigate('/programs');
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- DEFAULT PRICING (SINGLE FEE FIX) -------------------- */
  useEffect(() => {
    if (!course?.id || selectedPricing) return;

    supabase
      .from('course_pricing')
      .select('*')
      .eq('course_id', course.id)
      .eq('is_active', true)
      .not('amount', 'is', null)
      .order('sort_order', { ascending: true })
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]) setSelectedPricing(data[0]);
      });
  }, [course?.id]);

  /* -------------------- FORM -------------------- */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'age' ? Number(value) || undefined : value
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!formData.full_name) e.full_name = 'Required';
    if (!formData.age) e.age = 'Required';
    if (!formData.english_level) e.english_level = 'Required';
    if (!formData.email) e.email = 'Required';
    if (!formData.phone) e.phone = 'Required';
    if (!formData.student_id_no) e.student_id_no = 'Required';
    if (!formData.grade_at_school) e.grade_at_school = 'Required';
    if (!formData.school) e.school = 'Required';
    if (!formData.school_time) e.school_time = 'Required';
    if (!formData.parent_name) e.parent_name = 'Required';
    if (!formData.parent_viber) e.parent_viber = 'Required';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* -------------------- PAYMENT FLOW -------------------- */
  const goToPayment = () => {
    if (!course || !selectedPricing) {
      toast.error('Pricing option missing');
      return;
    }

    localStorage.setItem(
      'pendingPayment',
      JSON.stringify({
        courseId: course.id,
        pricingId: selectedPricing.id
      })
    );

    localStorage.setItem(
      'pendingApplication',
      JSON.stringify({
        ...formData,
        course_id: course.id,
        pricing_id: selectedPricing.id
      })
    );

    setApplicationData({
      ...(formData as Application),
      course_id: course.id
    } as Application);

    if (!user) {
      toast.info('Please sign up to continue');

      // ✅ CRITICAL FIX
      localStorage.setItem('postAuthRedirect', '/make-payment');

      navigate('/signup');
      return;
    }

    navigate('/make-payment');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fill all required fields');
      return;
    }
    goToPayment();
  };

  if (loading || !course) return null;

  const displayAmount = selectedPricing?.amount ?? null;

  return (
    <Layout>
      <section className="bg-[#1F6F43] py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Link to={`/course/${course.id}`} className="text-white/80 flex items-center mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Course
          </Link>
          <h1 className="text-3xl font-serif font-bold text-white">
            Student Application Form
          </h1>
        </div>
      </section>

      <section className="py-12 bg-[#F4F6F8]">
        <div className="max-w-4xl mx-auto px-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-8 space-y-8">
            {/* (form content unchanged for brevity – your existing JSX is correct) */}

            <div className="bg-[#F4F6F8] rounded-lg p-6">
              <h3 className="font-bold mb-2">{course.title}</h3>
              <p className="text-xl font-bold text-[#1F6F43]">
                {displayAmount ? `MVR ${displayAmount.toLocaleString()}` : 'TBD'}
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#1F6F43] text-white py-4 rounded-lg font-semibold"
            >
              Proceed to Payment <ArrowRight className="inline ml-2 w-5 h-5" />
            </button>
          </form>
        </div>
      </section>
    </Layout>
  );
}
