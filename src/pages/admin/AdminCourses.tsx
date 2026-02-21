import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type CourseRow = {
  id: string;
  title: string | null;
  category: string | null;
  age_range: string | null;
  description: string | null;
  subjects: string[] | null;
  schedule: string | null;
  duration: string | null;
  fee: number | null; // legacy/display convenience
  image_url: string | null;
  status: boolean | null;
  sort_order: number | null;
  created_at: string | null;
  grades: string | null;
  learning_outcomes: string | null;
};

type CourseForm = {
  title: string;
  category: string;
  age_range: string;
  description: string;
  subjects_csv: string;
  schedule: string;
  duration: string;

  // ✅ NEW: three pricing fields
  fee_monthly: string;
  fee_term: string;
  fee_annual: string;

  image_url: string;
  status: boolean;
  sort_order: string;
  grades: string;
  learning_outcomes: string;
};

const emptyForm: CourseForm = {
  title: "",
  category: "",
  age_range: "",
  description: "",
  subjects_csv: "",
  schedule: "",
  duration: "",

  fee_monthly: "",
  fee_term: "",
  fee_annual: "",

  image_url: "",
  status: true,
  sort_order: "",
  grades: "",
  learning_outcomes: "",
};

function toSubjectsArray(csv: string): string[] | null {
  const arr = csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return arr.length ? arr : null;
}

function formFromRow(row: CourseRow): CourseForm {
  return {
    title: row.title ?? "",
    category: row.category ?? "",
    age_range: row.age_range ?? "",
    description: row.description ?? "",
    subjects_csv: (row.subjects ?? []).join(", "),
    schedule: row.schedule ?? "",
    duration: row.duration ?? "",

    // Default annual to courses.fee (fallback), real values loaded from course_pricing in startEdit()
    fee_monthly: "",
    fee_term: "",
    fee_annual:
      row.fee === null || row.fee === undefined ? "" : String(row.fee),

    image_url: row.image_url ?? "",
    status: row.status ?? true,
    sort_order:
      row.sort_order === null || row.sort_order === undefined
        ? ""
        : String(row.sort_order),
    grades: row.grades ?? "",
    learning_outcomes: row.learning_outcomes ?? "",
  };
}

type PricingRow = {
  id: string;
  billing_period: string | null;
  amount: number | null;
  is_active: boolean | null;
  created_at: string | null;
};

function isWholeNumberString(v: string) {
  return /^\d+$/.test(v);
}

export default function AdminCourses() {
  const { user, loading: authLoading, isAdmin } = useAuth();

  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CourseForm>(emptyForm);

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return courses;

    return courses.filter((c) => {
      const title = (c.title ?? "").toLowerCase();
      const category = (c.category ?? "").toLowerCase();
      const age = (c.age_range ?? "").toLowerCase();
      return title.includes(q) || category.includes(q) || age.includes(q);
    });
  }, [courses, search]);

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      fetchCourses();
    } else if (!authLoading) {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, isAdmin]);

  const fetchCourses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("courses")
      .select(
        "id,title,category,age_range,description,subjects,schedule,duration,fee,image_url,status,sort_order,created_at,grades,learning_outcomes"
      )
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Failed to load courses");
      setCourses([]);
    } else {
      setCourses((data ?? []) as CourseRow[]);
    }
    setLoading(false);
  };

  const startAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ✅ Load pricing rows and fill monthly/term/annual fields
  const loadPricingIntoForm = async (courseId: string) => {
    const { data, error } = await supabase
      .from("course_pricing")
      .select("id,billing_period,amount,is_active,created_at")
      .eq("course_id", courseId);

    if (error) {
      console.error(error);
      toast.error("Failed to load course pricing");
      return;
    }

    const rows = (data ?? []) as PricingRow[];

    // Prefer active rows; otherwise fallback to newest
    const pick = (period: "monthly" | "term" | "annual") => {
      const active = rows.find(
        (r) =>
          (r.billing_period ?? "").toLowerCase() === period &&
          r.is_active === true &&
          r.amount !== null
      );
      if (active) return active.amount;

      const any = rows
        .filter((r) => (r.billing_period ?? "").toLowerCase() === period)
        .sort((a, b) => {
          const ad = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bd = b.created_at ? new Date(b.created_at).getTime() : 0;
          return bd - ad;
        })[0];

      return any?.amount ?? null;
    };

    const monthly = pick("monthly");
    const term = pick("term");
    const annual = pick("annual");

    setForm((prev) => ({
      ...prev,
      fee_monthly: monthly === null ? prev.fee_monthly : String(monthly),
      fee_term: term === null ? prev.fee_term : String(term),
      fee_annual: annual === null ? prev.fee_annual : String(annual),
    }));
  };

  const startEdit = async (row: CourseRow) => {
    setEditingId(row.id);
    setForm(formFromRow(row));
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Load pricing into the three fee fields
    await loadPricingIntoForm(row.id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const onChange =
    (key: keyof CourseForm) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value =
        e.target.type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : e.target.value;

      setForm((prev) => ({ ...prev, [key]: value as any }));
    };

  const validate = (): string | null => {
    if (!form.title.trim()) return "Title is required";
    if (!form.category.trim()) return "Category is required";

    const m = form.fee_monthly.trim();
    const t = form.fee_term.trim();
    const a = form.fee_annual.trim();

    if (!m && !t && !a) return "Please enter at least one fee (Monthly, Term, or Annual)";

    if (m && !isWholeNumberString(m)) return "Monthly fee must be a whole number (e.g. 1200)";
    if (t && !isWholeNumberString(t)) return "Term fee must be a whole number (e.g. 1200)";
    if (a && !isWholeNumberString(a)) return "Annual fee must be a whole number (e.g. 1200)";

    return null;
  };

  // Robust helper: get 1 row id for a specific period (prefer active, then latest)
  const getPriceRowIdByPeriod = async (
    courseId: string,
    period: "monthly" | "term" | "annual"
  ) => {
    const { data, error } = await supabase
      .from("course_pricing")
      .select("id,is_active,created_at")
      .eq("course_id", courseId)
      .eq("billing_period", period)
      .order("is_active", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) throw error;
    return (data?.[0] as { id: string } | undefined)?.id ?? null;
  };

  const upsertPricing = async (args: {
    courseId: string;
    period: "monthly" | "term" | "annual";
    amount: number | null;
    sortOrder: number;
  }) => {
    const { courseId, period, amount, sortOrder } = args;
    const existingId = await getPriceRowIdByPeriod(courseId, period);

    const label =
      period === "monthly" ? "Monthly Fee" : period === "term" ? "Term Fee" : "Annual Fee";

    if (amount !== null) {
      if (existingId) {
        const { error } = await supabase
          .from("course_pricing")
          .update({
            label,
            amount,
            currency: "MVR",
            billing_period: period,
            sort_order: sortOrder,
            is_active: true,
          })
          .eq("id", existingId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("course_pricing").insert({
          course_id: courseId,
          label,
          amount,
          currency: "MVR",
          billing_period: period,
          sort_order: sortOrder,
          is_active: true,
        });

        if (error) throw error;
      }
    } else {
      // cleared -> deactivate existing row if it exists
      if (existingId) {
        const { error } = await supabase
          .from("course_pricing")
          .update({ is_active: false })
          .eq("id", existingId);

        if (error) throw error;
      }
    }
  };

  const save = async () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    setSaving(true);

    const monthlyRaw = form.fee_monthly.trim();
    const termRaw = form.fee_term.trim();
    const annualRaw = form.fee_annual.trim();

    const monthlyAmt = monthlyRaw ? Number(monthlyRaw) : null;
    const termAmt = termRaw ? Number(termRaw) : null;
    const annualAmt = annualRaw ? Number(annualRaw) : null;

    // Keep courses.fee populated for legacy display:
    // prefer annual -> term -> monthly
    const legacyFee =
      annualAmt !== null ? annualAmt : termAmt !== null ? termAmt : monthlyAmt;

    const payload = {
      title: form.title.trim(),
      category: form.category.trim(),
      age_range: form.age_range.trim() || null,
      description: form.description.trim() || null,
      subjects: toSubjectsArray(form.subjects_csv),
      schedule: form.schedule.trim() || null,
      duration: form.duration.trim() || null,
      fee: legacyFee ?? null, // ✅ keep legacy column in sync
      image_url: form.image_url.trim() || null,
      status: form.status,
      sort_order: form.sort_order.trim() ? Number(form.sort_order) : null,
      grades: form.grades.trim() || null,
      learning_outcomes: form.learning_outcomes.trim() || null,
    };

    try {
      if (editingId) {
        // 1) Update course row
        const { error } = await supabase
          .from("courses")
          .update(payload)
          .eq("id", editingId);

        if (error) throw error;

        // 2) Upsert pricing rows
        await upsertPricing({ courseId: editingId, period: "monthly", amount: monthlyAmt, sortOrder: 1 });
        await upsertPricing({ courseId: editingId, period: "term", amount: termAmt, sortOrder: 2 });
        await upsertPricing({ courseId: editingId, period: "annual", amount: annualAmt, sortOrder: 3 });

        toast.success("Course updated");
      } else {
        // 1) Create course row (get id)
        const { data: insertedCourse, error } = await supabase
          .from("courses")
          .insert(payload)
          .select("id")
          .single();

        if (error) throw error;

        // 2) Create pricing rows (only for those provided)
        await upsertPricing({ courseId: insertedCourse.id, period: "monthly", amount: monthlyAmt, sortOrder: 1 });
        await upsertPricing({ courseId: insertedCourse.id, period: "term", amount: termAmt, sortOrder: 2 });
        await upsertPricing({ courseId: insertedCourse.id, period: "annual", amount: annualAmt, sortOrder: 3 });

        toast.success("Course created");
      }

      await fetchCourses();
      cancelEdit();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    const ok = confirm("Delete this course? This cannot be undone.");
    if (!ok) return;

    setDeletingId(id);
    try {
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;

      toast.success("Course deleted");
      await fetchCourses();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Delete failed");
    } finally {
      setDeletingId(null);
    }
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
        <div className="py-20 text-center">Loading courses…</div>
      </Layout>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">Admin — Courses</h1>

          <div className="flex gap-2">
            <button
              onClick={fetchCourses}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Refresh
            </button>

            <button
              onClick={startAdd}
              className="px-4 py-2 bg-[#1F6F43] text-white rounded-lg hover:bg-[#185a36]"
            >
              + Add Course
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="border rounded-xl p-5 bg-white shadow-sm mb-8">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="font-semibold">
              {editingId ? "Edit Course" : "Create New Course"}
            </h2>

            {editingId && (
              <button
                onClick={cancelEdit}
                className="text-sm px-3 py-1 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <input
                value={form.title}
                onChange={onChange("title")}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
                placeholder="Course title"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Category *</label>
              <input
                value={form.category}
                onChange={onChange("category")}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
                placeholder="e.g. Cambridge English Programs"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Age Range</label>
              <input
                value={form.age_range}
                onChange={onChange("age_range")}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
                placeholder="e.g. 6–10"
              />
            </div>

            {/* ✅ NEW: 3 fee fields */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Fees (MVR)</label>
              <div className="grid md:grid-cols-3 gap-3 mt-1">
                <input
                  type="number"
                  value={form.fee_monthly}
                  onChange={onChange("fee_monthly")}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Monthly"
                />
                <input
                  type="number"
                  value={form.fee_term}
                  onChange={onChange("fee_term")}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Term"
                />
                <input
                  type="number"
                  value={form.fee_annual}
                  onChange={onChange("fee_annual")}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Annual"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Enter any combination (e.g. only Annual). These values are saved into <code>course_pricing</code>.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Schedule</label>
              <input
                value={form.schedule}
                onChange={onChange("schedule")}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
                placeholder="e.g. Sun–Thu 4–5 PM"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Duration</label>
              <input
                value={form.duration}
                onChange={onChange("duration")}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
                placeholder="e.g. 3 months"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Grades</label>
              <input
                value={form.grades}
                onChange={onChange("grades")}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
                placeholder="e.g. Grade 4–6"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Sort Order</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={onChange("sort_order")}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
                placeholder="e.g. 10"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium">
                Subjects (comma separated)
              </label>
              <input
                value={form.subjects_csv}
                onChange={onChange("subjects_csv")}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
                placeholder="English, Writing, Grammar..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium">Image URL</label>
              <input
                value={form.image_url}
                onChange={onChange("image_url")}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
                placeholder="optional"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={form.description}
                onChange={onChange("description")}
                className="w-full mt-1 px-3 py-2 border rounded-lg min-h-[110px]"
                placeholder="Course description"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium">Learning Outcomes</label>
              <textarea
                value={form.learning_outcomes}
                onChange={onChange("learning_outcomes")}
                className="w-full mt-1 px-3 py-2 border rounded-lg min-h-[110px]"
                placeholder="What students will achieve"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="status"
                type="checkbox"
                checked={form.status}
                onChange={onChange("status")}
              />
              <label htmlFor="status" className="text-sm font-medium">
                Active (shows on Programs)
              </label>
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-[#C9A24D] text-white font-semibold hover:bg-[#b8923f] disabled:opacity-50"
            >
              {saving ? "Saving…" : editingId ? "Save Changes" : "Create Course"}
            </button>

            <button
              onClick={cancelEdit}
              className="px-5 py-2 rounded-lg border hover:bg-gray-50"
            >
              Clear
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-3">
            Note: Fees are stored in <code>course_pricing</code> under billing periods
            <code> monthly</code>, <code> term</code>, <code> annual</code>.
          </p>
        </div>

        {/* List */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-80 px-3 py-2 border rounded-lg"
            placeholder="Search title / category / age range…"
          />
          <div className="text-sm text-gray-600">
            {filtered.length} course{filtered.length === 1 ? "" : "s"}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-gray-600">No courses found.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => (
              <div key={c.id} className="border rounded-xl p-4 bg-white">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{c.title ?? "Untitled"}</p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          c.status
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {c.status ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600">
                      {c.category ?? "—"} • Ages {c.age_range ?? "—"}
                    </p>

                    <p className="text-sm text-gray-600 mt-1">
                      Fee (legacy):{" "}
                      <span className="font-medium">
                        {c.fee !== null && c.fee !== undefined
                          ? `MVR ${c.fee}`
                          : "—"}
                      </span>
                    </p>

                    <p className="text-xs text-gray-400 mt-1 break-all">
                      ID: {c.id}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(c)}
                      className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => remove(c.id)}
                      disabled={deletingId === c.id}
                      className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      {deletingId === c.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}