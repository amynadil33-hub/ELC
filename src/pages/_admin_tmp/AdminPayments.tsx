import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

interface Payment {
  id: string;
  enrollment_id: string;
  tuition_amount: number | null;
  registration_fee: number | null;
  total_amount: number;
  payment_method: string;
  status: "pending" | "paid" | "rejected";
  slip_url: string | null;
  created_at: string;
  courses?: { title: string };
  profiles?: { email: string };
}

export default function AdminPayments() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      fetchPayments();
    }
  }, [authLoading, user, isAdmin]);

  const fetchPayments = async () => {
    const { data, error } = await supabase
      .from("payments")
      .select(`
        *,
        enrollments (
          courses ( title )
        ),
        profiles:user_id ( email )
      `)
      .order("created_at", { ascending: false });

    if (!error) setPayments(data || []);
    setLoading(false);
  };

  const updateStatus = async (
    paymentId: string,
    status: "paid" | "rejected"
  ) => {
    if (!user) return;

    setUpdatingId(paymentId);

    await supabase
      .from("payments")
      .update({
        status,
        approved_at: status === "paid" ? new Date().toISOString() : null,
        approved_by: status === "paid" ? user.id : null
      })
      .eq("id", paymentId);

    await fetchPayments();
    setUpdatingId(null);
  };

  /* ---------------- GUARDS ---------------- */

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

  /* ---------------- UI ---------------- */

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-6">Admin — Payments</h1>

        {payments.length === 0 ? (
          <p>No payments found.</p>
        ) : (
          <div className="space-y-4">
            {payments.map(p => (
              <div
                key={p.id}
                className="border rounded-lg p-4 flex justify-between items-start"
              >
                <div>
                  <p className="font-medium">
                    {p.enrollments?.courses?.title}
                  </p>
                  <p className="text-sm text-gray-500">
                    {p.profiles?.email}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(p.created_at).toLocaleString()}
                  </p>

                  <p className="text-sm capitalize mt-1">
                    {p.payment_method}
                  </p>

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
