import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

interface Payment {
  id: string;
  user_id: string;
  course_id: string;
  total_amount: number;
  created_at: string;
  status: "paid";
}

interface Course {
  id: string;
  title: string;
}

interface Profile {
  id: string;
  email: string;
}

export default function AdminEnrollments() {
  const { user, loading: authLoading, isAdmin } = useAuth();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [courses, setCourses] = useState<Record<string, Course>>({});
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  /* ---------------- FETCH PAID PAYMENTS (NOT ENROLLED) ---------------- */

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      fetchPayments();
    }
  }, [authLoading, user, isAdmin]);

  const fetchPayments = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("payments")
      .select(`
        id,
        user_id,
        course_id,
        total_amount,
        created_at,
        status
      `)
      .eq("status", "paid")
      .is("enrollment_id", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Payments fetch error:", error);
      setLoading(false);
      return;
    }

    setPayments(data || []);

    // fetch related data separately
    await Promise.all([
      fetchCourses(data || []),
      fetchProfiles(data || [])
    ]);

    setLoading(false);
  };

  /* ---------------- FETCH COURSES ---------------- */

  const fetchCourses = async (payments: Payment[]) => {
    const courseIds = [...new Set(payments.map(p => p.course_id))];

    if (courseIds.length === 0) return;

    const { data } = await supabase
      .from("courses")
      .select("id, title")
      .in("id", courseIds);

    const map: Record<string, Course> = {};
    data?.forEach(c => (map[c.id] = c));
    setCourses(map);
  };

  /* ---------------- FETCH PROFILES ---------------- */

  const fetchProfiles = async (payments: Payment[]) => {
    const userIds = [...new Set(payments.map(p => p.user_id))];

    if (userIds.length === 0) return;

    const { data } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", userIds);

    const map: Record<string, Profile> = {};
    data?.forEach(p => (map[p.id] = p));
    setProfiles(map);
  };

  /* ---------------- ENROLL STUDENT ---------------- */

  const enrollStudent = async (payment: Payment) => {
    if (!user) return;

    setEnrollingId(payment.id);

    // 1️⃣ create enrollment
    const { data: enrollment, error: enrollError } = await supabase
      .from("enrollments")
      .insert({
        user_id: payment.user_id,
        course_id: payment.course_id,
        payment_id: payment.id,
        status: "active",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (enrollError) {
      console.error("Enrollment failed:", enrollError);
      setEnrollingId(null);
      return;
    }

    // 2️⃣ link payment to enrollment
    await supabase
      .from("payments")
      .update({ enrollment_id: enrollment.id })
      .eq("id", payment.id);

    await fetchPayments();
    setEnrollingId(null);
  };

  /* ---------------- GUARDS ---------------- */

  if (authLoading) {
    return <Layout><div className="py-20 text-center">Checking permissions…</div></Layout>;
  }

  if (!user || !isAdmin) {
    return (
      <Layout>
        <div className="py-20 text-center text-red-600 font-semibold">
          Access denied — Admins only
        </div>
      </Layout>
    );
  }

  if (loading) {
    return <Layout><div className="py-20 text-center">Loading…</div></Layout>;
  }

  /* ---------------- UI ---------------- */

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-6">Admin — Enrollments</h1>

        {payments.length === 0 ? (
          <p>No paid students awaiting enrollment.</p>
        ) : (
          <div className="space-y-4">
            {payments.map(p => (
              <div
                key={p.id}
                className="border rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">
                    {courses[p.course_id]?.title ?? "Course"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {profiles[p.user_id]?.email ?? "Student"}
                  </p>
                  <p className="text-xs text-gray-400">
                    Paid on {new Date(p.created_at).toLocaleString()}
                  </p>
                  <p className="font-semibold mt-1">
                    MVR {p.total_amount}
                  </p>
                </div>

                <button
                  disabled={enrollingId === p.id}
                  onClick={() => enrollStudent(p)}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Enroll student
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
