import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

interface Enrollment {
  id: string;
  status: string;
  billing_period: string | null;
  expected_installments: number | null;
  started_at: string | null;
  terminated_at: string | null;
  termination_reason: string | null;
  courses?: { title: string };
  profiles?: { email: string };
}

interface Payment {
  id: string;
  tuition_amount: number | null;
  registration_fee: number | null;
  total_amount: number;
  payment_method: string;
  status: string;
  slip_url: string | null;
  created_at: string;
}

export default function AdminEnrollments() {
  const { user, loading: authLoading, isAdmin } = useAuth();

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [payments, setPayments] = useState<Record<string, Payment[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      fetchEnrollments();
    }
  }, [authLoading, user, isAdmin]);

  const fetchEnrollments = async () => {
    const { data } = await supabase
      .from("enrollments")
      .select(`
        id,
        status,
        billing_period,
        expected_installments,
        started_at,
        terminated_at,
        termination_reason,
        courses ( title ),
        profiles:user_id ( email )
      `)
      .order("created_at", { ascending: false });

    setEnrollments(data || []);
    setLoading(false);
  };

  const fetchPayments = async (enrollmentId: string) => {
    if (payments[enrollmentId]) return;

    const { data } = await supabase
      .from("payments")
      .select("*")
      .eq("enrollment_id", enrollmentId)
      .order("created_at", { ascending: false });

    setPayments(prev => ({
      ...prev,
      [enrollmentId]: data || []
    }));
  };

  const togglePayments = async (enrollmentId: string) => {
    if (expanded === enrollmentId) {
      setExpanded(null);
      return;
    }

    await fetchPayments(enrollmentId);
    setExpanded(enrollmentId);
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
    return <Layout><div className="py-20 text-center">Loading enrollments…</div></Layout>;
  }

  /* ---------------- UI ---------------- */

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-6">Admin — Enrollments</h1>

        {enrollments.map(e => (
          <div key={e.id} className="border rounded-lg mb-4">
            {/* Enrollment summary */}
            <div className="p-4 flex justify-between items-start">
              <div>
                <p className="font-medium">{e.courses?.title}</p>
                <p className="text-sm text-gray-500">{e.profiles?.email}</p>

                <p className="text-sm mt-1">
                  Billing: <strong>{e.billing_period ?? "N/A"}</strong>
                </p>

                {e.expected_installments && (
                  <p className="text-sm">
                    Expected installments: {e.expected_installments}
                  </p>
                )}

                <p
                  className={`text-sm font-semibold mt-1 ${
                    e.status === "active"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {e.status.toUpperCase()}
                </p>
              </div>

              <button
                onClick={() => togglePayments(e.id)}
                className="text-sm px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                {expanded === e.id ? "Hide payments" : "View payments"}
              </button>
            </div>

            {/* Payment history panel */}
            {expanded === e.id && (
              <div className="border-t bg-gray-50 p-4">
                {payments[e.id]?.length ? (
                  <div className="space-y-3">
                    {payments[e.id].map(p => (
                      <div
                        key={p.id}
                        className="bg-white border rounded p-3 flex justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {new Date(p.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {p.payment_method} • {p.status}
                          </p>

                          {p.slip_url && (
                            <a
                              href={p.slip_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-blue-600 underline"
                            >
                              View slip
                            </a>
                          )}
                        </div>

                        <div className="text-right">
                          {p.registration_fee && (
                            <p className="text-xs">
                              Reg: MVR {p.registration_fee}
                            </p>
                          )}
                          {p.tuition_amount && (
                            <p className="text-xs">
                              Tuition: MVR {p.tuition_amount}
                            </p>
                          )}
                          <p className="font-bold">
                            MVR {p.total_amount}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No payments found for this enrollment.
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </Layout>
  );
}
