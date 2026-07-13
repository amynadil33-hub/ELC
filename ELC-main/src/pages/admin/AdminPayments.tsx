import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

type PaymentStatus = "pending" | "paid" | "rejected";

interface PaymentRow {
  id: string;
  status: PaymentStatus;
  payment_method: string;
  slip_url: string | null;
  total_amount: number;
  registration_fee: number | null;
  tuition_amount: number | null;
  created_at: string;
  enrollment_id: string;
}

interface PaymentUI extends PaymentRow {
  course_title?: string;
  user_email?: string;
}

export default function AdminPayments() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [payments, setPayments] = useState<PaymentUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user && isAdmin) fetchPayments();
  }, [authLoading, user, isAdmin]);

  const fetchPayments = async () => {
    setLoading(true);

    // 1) Get payments (no joins -> no 400)
    const { data: payData, error: payError } = await supabase
      .from("payments")
      .select(
        "id,status,payment_method,slip_url,total_amount,registration_fee,tuition_amount,created_at,enrollment_id"
      )
      .order("created_at", { ascending: false });

    console.log("PAYMENTS:", { payData, payError });

    if (payError || !payData) {
      setPayments([]);
      setLoading(false);
      return;
    }

    // 2) Get related enrollments (to find course_id + user_id)
    const enrollmentIds = [...new Set(payData.map((p) => p.enrollment_id).filter(Boolean))];

    let enrollmentMap = new Map<
      string,
      { course_id?: string | null; user_id?: string | null }
    >();

    if (enrollmentIds.length > 0) {
      const { data: enrData, error: enrError } = await supabase
        .from("enrollments")
        .select("id, course_id, user_id")
        .in("id", enrollmentIds);

      console.log("ENROLLMENTS:", { enrData, enrError });

      if (!enrError && enrData) {
        enrData.forEach((e: any) => {
          enrollmentMap.set(e.id, { course_id: e.course_id, user_id: e.user_id });
        });
      }
    }

    // 3) Get courses titles
    const courseIds = [
      ...new Set(
        Array.from(enrollmentMap.values())
          .map((v) => v.course_id)
          .filter(Boolean)
      ),
    ] as string[];

    let courseTitleMap = new Map<string, string>();

    if (courseIds.length > 0) {
      const { data: cData, error: cError } = await supabase
        .from("courses")
        .select("id, title")
        .in("id", courseIds);

      console.log("COURSES:", { cData, cError });

      if (!cError && cData) {
        cData.forEach((c: any) => courseTitleMap.set(c.id, c.title));
      }
    }

    // 4) Get user emails
    const userIds = [
      ...new Set(
        Array.from(enrollmentMap.values())
          .map((v) => v.user_id)
          .filter(Boolean)
      ),
    ] as string[];

    let emailMap = new Map<string, string>();

    if (userIds.length > 0) {
      const { data: pData, error: pError } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", userIds);

      console.log("PROFILES:", { pData, pError });

      if (!pError && pData) {
        pData.forEach((pr: any) => emailMap.set(pr.id, pr.email));
      }
    }

    // 5) Merge into UI rows
    const merged: PaymentUI[] = (payData as PaymentRow[]).map((p) => {
      const enr = enrollmentMap.get(p.enrollment_id);
      const courseTitle = enr?.course_id ? courseTitleMap.get(enr.course_id) : undefined;
      const email = enr?.user_id ? emailMap.get(enr.user_id) : undefined;

      return {
        ...p,
        course_title: courseTitle ?? "—",
        user_email: email ?? "—",
      };
    });

    setPayments(merged);
    setLoading(false);
  };

  const updateStatus = async (paymentId: string, status: "paid" | "rejected") => {
    if (!user) return;

    setUpdatingId(paymentId);

    const { error } = await supabase
      .from("payments")
      .update({
        status,
        approved_at: status === "paid" ? new Date().toISOString() : null,
        approved_by: status === "paid" ? user.id : null,
      })
      .eq("id", paymentId);

    if (error) console.error("Update failed:", error);

    await fetchPayments();
    setUpdatingId(null);
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="py-20 text-center">Checking permissions…</div>
      </Layout>
    );
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
    return (
      <Layout>
        <div className="py-20 text-center">Loading payments…</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-6">Admin — Payments</h1>

        {payments.length === 0 ? (
          <p>No payments found.</p>
        ) : (
          <div className="space-y-4">
            {payments.map((p) => (
              <div
                key={p.id}
                className="border rounded-lg p-4 flex justify-between items-start"
              >
                <div>
                  <p className="font-medium">{p.course_title}</p>
                  <p className="text-sm text-gray-500">{p.user_email}</p>

                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(p.created_at).toLocaleString()}
                  </p>

                  <p className="text-sm capitalize mt-1">{p.payment_method}</p>

                  {p.slip_url && (
                    <a
                      href={p.slip_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-blue-600 underline"
                    >
                      View slip
                    </a>
                  )}
                </div>

                <div className="text-right">
                  {p.registration_fee != null && (
                    <p className="text-xs">Reg: MVR {p.registration_fee}</p>
                  )}
                  {p.tuition_amount != null && (
                    <p className="text-xs">Tuition: MVR {p.tuition_amount}</p>
                  )}
                  <p className="font-bold">MVR {p.total_amount}</p>

                  <p
                    className={`text-sm font-semibold mt-1 ${
                      p.status === "paid"
                        ? "text-green-600"
                        : p.status === "rejected"
                        ? "text-red-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {p.status.toUpperCase()}
                  </p>

                  {p.status === "pending" && (
                    <div className="flex gap-2 mt-2 justify-end">
                      <button
                        disabled={updatingId === p.id}
                        onClick={() => updateStatus(p.id, "paid")}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        disabled={updatingId === p.id}
                        onClick={() => updateStatus(p.id, "rejected")}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
