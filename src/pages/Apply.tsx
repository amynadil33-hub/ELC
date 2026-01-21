import React, { useEffect, useState } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useApplication } from "@/context/ApplicationContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { ENGLISH_LEVELS, SCHOOL_TIMES, GRADES } from "@/lib/constants";
import { Application, Course } from "@/types";
import {
  ArrowLeft,
  ArrowRight,
  User,
  Mail,
  Phone,
  School,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

type CoursePricing = {
  id: string;
  course_id: string;
  label: string;
  billing_period: string;
  sort_order: number;
  amount: number | null;
  is_active?: boolean;
};

export default function Apply() {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const { selectedCourse, setSelectedCourse } = useApplication();
  const { user } = useAuth();

  const [course, setCourse] = useState<Course | null>(selectedCourse ?? null);
  const [loading, setLoading] = useState(!selectedCourse);

  // Pricing selected in CourseDetail (stored in context as selected_price)
  const [selectedPricing, setSelectedPricing] = useState<CoursePricing | null>(
    (selectedCourse as any)?.selected_price ?? null
  );

  const [formData, setFormData] = useState<Partial<Application>>({
    full_name: "",
    age: undefined,
    english_level: "",
    email: "",
    phone: "",
    student_id_no: "",
    grade_at_school: "",
    school: "",
    school_time: "",
    parent_name: "",
    parent_viber: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  /* -------------------- LOAD COURSE -------------------- */
  useEffect(() => {
    if (!courseId) {
      navigate("/programs");
      return;
    }

    // If user refreshed Apply page, selectedCourse may be empty.
    // Always fetch course from DB.
    fetchCourse(courseId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const fetchCourse = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setCourse(data);
      setSelectedCourse(data);

      // If we don't have selected pricing yet, get a default active pricing
      const existingSelected = (selectedCourse as any)?.selected_price ?? null;
      if (existingSelected?.id) {
        setSelectedPricing(existingSelected);
      } else {
        await fetchDefaultPricing(id);
      }
    } catch (err) {
      console.error("Error fetching course:", err);
      navigate("/programs");
    } finally {
      setLoading(false);
    }
  };

  const fetchDefaultPricing = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("course_pricing")
        .select("*")
        .eq("course_id", id)
        .eq("is_active", true)
        .not("amount", "is", null)
        .order("sort_order", { ascending: true })
        .limit(1);

      if (error) throw error;

      const first = data?.[0] ?? null;
      setSelectedPricing(first);
    } catch (err) {
      console.error("Error fetching default pricing:", err);
      setSelectedPricing(null);
    }
  };

  /* -------------------- FORM HELPERS -------------------- */
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name?.trim()) newErrors.full_name = "Full name is required";
    if (!formData.age || formData.age < 1) newErrors.age = "Valid age is required";
    if (!formData.english_level) newErrors.english_level = "English level is required";
    if (!formData.email?.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email format";
    if (!formData.phone?.trim()) newErrors.phone = "Phone number is required";
    if (!formData.student_id_no?.trim()) newErrors.student_id_no = "Student ID is required";
    if (!formData.grade_at_school) newErrors.grade_at_school = "Grade is required";
    if (!formData.school?.trim()) newErrors.school = "School name is required";
    if (!formData.school_time) newErrors.school_time = "School time is required";
    if (!formData.parent_name?.trim()) newErrors.parent_name = "Parent name is required";
    if (!formData.parent_viber?.trim()) newErrors.parent_viber = "Parent Viber number is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "age" ? parseInt(value) || undefined : value,
    }));

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  /* -------------------- SUBMIT -> GO TO PAYMENT -------------------- */
  const goToPayment = () => {
    if (!course) return;

    // If there is only one pricing option, selectedPricing should be auto-selected.
    // But if pricing table missing, we still allow flow using course.fee (no pricingId).
    // If your MakePayment requires pricingId, keep this strict.
    if (!selectedPricing?.id) {
      toast.error("No pricing option selected. Please go back and select a fee option.");
      return;
    }

    // Save payment context for MakePayment page
    localStorage.setItem(
      "pendingPayment",
      JSON.stringify({
        courseId: course.id,
        pricingId: selectedPricing.id,
      })
    );

    // Save application form (so user does NOT refill after auth)
    localStorage.setItem(
      "pendingApplication",
      JSON.stringify({
        ...formData,
        course_id: course.id,
        pricing_id: selectedPricing.id,
      })
    );

    // If not logged in -> login and come back
    if (!user) {
      toast.info("Please sign in to continue to payment");
      navigate("/login?redirect=/make-payment");
      return;
    }

    navigate("/make-payment");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    setSubmitting(true);
    try {
      goToPayment();
    } finally {
      setSubmitting(false);
    }
  };

  /* -------------------- UI STATES -------------------- */
  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
            <div className="h-12 bg-gray-200 rounded w-3/4 mb-8" />
            <div className="h-64 bg-gray-200 rounded mb-8" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!course) return null;

  const displayAmount = selectedPricing?.amount ?? (course.fee ?? null);
  const displayLabel =
    selectedPricing?.label ||
    (selectedPricing?.billing_period ? `${selectedPricing.billing_period} Fee` : "Course Fee");

  /* -------------------- PAGE -------------------- */
  return (
    <Layout>
      {/* Header */}
      <section className="bg-[#1F6F43] py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to={`/course/${course.id}`}
            className="inline-flex items-center text-white/80 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Course
          </Link>

          <h1 className="font-serif text-3xl font-bold text-white">Student Application Form</h1>
          <p className="text-white/80 mt-2">
            Applying for:{" "}
            <span className="text-[#C9A24D] font-medium">{course.title}</span>
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="py-12 bg-[#F4F6F8]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Student Information */}
              <div>
                <h2 className="font-serif text-xl font-bold text-[#2B2B2B] mb-6 flex items-center">
                  <User className="w-5 h-5 mr-2 text-[#C9A24D]" />
                  Student Information
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#1F6F43] focus:border-transparent outline-none ${
                        errors.full_name ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter student's full name"
                    />
                    {errors.full_name && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.full_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age || ""}
                      onChange={handleChange}
                      min="1"
                      max="99"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#1F6F43] focus:border-transparent outline-none ${
                        errors.age ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter age"
                    />
                    {errors.age && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.age}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Level of English <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="english_level"
                      value={formData.english_level}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#1F6F43] focus:border-transparent outline-none ${
                        errors.english_level ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">Select level</option>
                      {ENGLISH_LEVELS.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                    {errors.english_level && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.english_level}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Student's ID No <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="student_id_no"
                      value={formData.student_id_no}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#1F6F43] focus:border-transparent outline-none ${
                        errors.student_id_no ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter student ID number"
                    />
                    {errors.student_id_no && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.student_id_no}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h2 className="font-serif text-xl font-bold text-[#2B2B2B] mb-6 flex items-center">
                  <Mail className="w-5 h-5 mr-2 text-[#C9A24D]" />
                  Contact Information
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#1F6F43] focus:border-transparent outline-none ${
                        errors.email ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter email address"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#1F6F43] focus:border-transparent outline-none ${
                        errors.phone ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter phone number"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* School Information */}
              <div>
                <h2 className="font-serif text-xl font-bold text-[#2B2B2B] mb-6 flex items-center">
                  <School className="w-5 h-5 mr-2 text-[#C9A24D]" />
                  School Information
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grade at School <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="grade_at_school"
                      value={formData.grade_at_school}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#1F6F43] focus:border-transparent outline-none ${
                        errors.grade_at_school ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">Select grade</option>
                      {GRADES.map((grade) => (
                        <option key={grade} value={grade}>
                          {grade}
                        </option>
                      ))}
                    </select>
                    {errors.grade_at_school && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.grade_at_school}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      School <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="school"
                      value={formData.school}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#1F6F43] focus:border-transparent outline-none ${
                        errors.school ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter school name"
                    />
                    {errors.school && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.school}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      School Time <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="school_time"
                      value={formData.school_time}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#1F6F43] focus:border-transparent outline-none ${
                        errors.school_time ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">Select school time</option>
                      {SCHOOL_TIMES.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                    {errors.school_time && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.school_time}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Parent/Guardian Information */}
              <div>
                <h2 className="font-serif text-xl font-bold text-[#2B2B2B] mb-6 flex items-center">
                  <Phone className="w-5 h-5 mr-2 text-[#C9A24D]" />
                  Parent/Guardian Information
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Parent's Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="parent_name"
                      value={formData.parent_name}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#1F6F43] focus:border-transparent outline-none ${
                        errors.parent_name ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter parent's name"
                    />
                    {errors.parent_name && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.parent_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Parent's Viber Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="parent_viber"
                      value={formData.parent_viber}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#1F6F43] focus:border-transparent outline-none ${
                        errors.parent_viber ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter Viber number"
                    />
                    {errors.parent_viber && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.parent_viber}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Selected Course Summary */}
              <div className="bg-[#F4F6F8] rounded-lg p-6">
                <h3 className="font-serif text-lg font-bold text-[#2B2B2B] mb-4 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-[#C9A24D]" />
                  Selected Course
                </h3>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#2B2B2B]">{course.title}</p>
                    <p className="text-sm text-gray-500">
                      {course.category} • Ages {course.age_range}
                    </p>
                    <p className="text-sm text-gray-500">
                      Payment Option:{" "}
                      <span className="font-medium">{displayLabel}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#1F6F43]">
                      {displayAmount ? `MVR ${displayAmount.toLocaleString()}` : "TBD"}
                    </p>
                  </div>
                </div>

                {!selectedPricing?.id && (
                  <p className="text-sm text-red-600 mt-3">
                    No pricing option selected. Please go back and select a fee option.
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  to={`/course/${course.id}`}
                  className="flex-1 px-6 py-4 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-center"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#1F6F43] text-white px-6 py-4 rounded-lg font-semibold hover:bg-[#185a36] transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    "Submitting..."
                  ) : (
                    <>
                      Proceed to Payment
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
}
