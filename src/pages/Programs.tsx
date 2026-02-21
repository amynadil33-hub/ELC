import React, { useEffect, useMemo, useState } from "react";
import Layout from "@/components/layout/Layout";
import CourseCard from "@/components/ui/CourseCard";
import { supabase } from "@/lib/supabase";
import { Course } from "@/types";
import { SEED_COURSES } from "@/lib/seedData";
import { ChevronDown, ChevronUp, Search, Filter, BookOpen } from "lucide-react";

type PricingRow = {
  course_id: string;
  billing_period: string | null;
  amount: number | null;
  currency: string | null;
  is_active: boolean | null;
  sort_order: number | null;
  created_at: string | null;
};

function normPeriod(p: string | null) {
  return (p ?? "").trim().toLowerCase();
}

// Prefer monthly -> term -> annual
function pickPreferredAmount(rows: PricingRow[]): number | null {
  const active = rows.filter((r) => r.is_active === true && r.amount !== null);

  const byPeriod = (period: "monthly" | "term" | "annual") =>
    active
      .filter((r) => normPeriod(r.billing_period) === period)
      .sort((a, b) => {
        // stable choice: lower sort_order first, then newest
        const as = a.sort_order ?? 9999;
        const bs = b.sort_order ?? 9999;
        if (as !== bs) return as - bs;
        const ad = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bd = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bd - ad;
      })[0]?.amount ?? null;

  return byPeriod("monthly") ?? byPeriod("term") ?? byPeriod("annual") ?? null;
}

export default function Programs() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    setExpandedCategories(categories);
  }, [categories]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      // 1) fetch courses
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("status", true)
        .order("category", { ascending: true })
        .order("sort_order", { ascending: true });

      if (error) throw error;

      const sourceCourses: Course[] =
        data && data.length > 0 ? (data as Course[]) : (SEED_COURSES as any);

      // 2) fetch pricing for those courses (only if we have real DB courses)
      let mergedCourses: Course[] = sourceCourses;

      const hasDbCourses = Array.isArray(data) && data.length > 0;
      if (hasDbCourses) {
        const courseIds = (data as any[]).map((c) => c.id).filter(Boolean);

        const { data: pricingData, error: pricingError } = await supabase
          .from("course_pricing")
          .select("course_id,billing_period,amount,currency,is_active,sort_order,created_at")
          .in("course_id", courseIds)
          .eq("is_active", true);

        if (pricingError) {
          // If pricing fetch fails, we still show courses, just fallback to course.fee
          console.error("Pricing fetch failed:", pricingError);
        } else {
          const rows = (pricingData ?? []) as PricingRow[];

          // Group rows per course_id and only keep monthly/term/annual
          const byCourse = new Map<string, PricingRow[]>();
          for (const r of rows) {
            const p = normPeriod(r.billing_period);
            if (!["monthly", "term", "annual"].includes(p)) continue; // ignore "Standard Fee" and others
            if (!byCourse.has(r.course_id)) byCourse.set(r.course_id, []);
            byCourse.get(r.course_id)!.push(r);
          }

          // Overwrite course.fee ONLY for display in Programs
          mergedCourses = (data as any[]).map((c) => {
            const preferred = pickPreferredAmount(byCourse.get(c.id) ?? []);
            return {
              ...c,
              fee: preferred ?? c.fee ?? null,
            } as Course;
          });
        }
      }

      setCourses(mergedCourses);

      // 3) dynamic categories from current course list
      const uniqueCategories = [
        ...new Set(
          mergedCourses.map((c: any) => c.category).filter(Boolean)
        ),
      ] as string[];
      setCategories(uniqueCategories);
    } catch (e) {
      console.error("Error fetching courses:", e);
      setCourses(SEED_COURSES as any);

      const fallbackCategories = [
        ...new Set((SEED_COURSES as any[]).map((c) => c.category).filter(Boolean)),
      ] as string[];
      setCategories(fallbackCategories);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const filteredCourses = useMemo(() => {
    return courses.filter((course: any) => {
      const matchesSearch =
        course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.subjects?.some((s: string) => s.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = !selectedCategory || course.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [courses, searchTerm, selectedCategory]);

  const coursesByCategory = useMemo(() => {
    return categories.reduce((acc, category) => {
      acc[category] = filteredCourses.filter((course: any) => course.category === category);
      return acc;
    }, {} as Record<string, Course[]>);
  }, [categories, filteredCourses]);

  const getCategoryIcon = () => <BookOpen className="w-6 h-6 text-[#1F6F43]" />;

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-[#1F6F43] py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">Our Programs</h1>
          <p className="text-white/90 text-lg max-w-2xl mx-auto">
            Comprehensive academic programs designed for students aged 4–16.
          </p>
        </div>
      </section>

      {/* Search + Filter */}
      <section className="bg-white py-6 border-b sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search programs, subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#1F6F43]"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={selectedCategory || ""}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="pl-12 pr-8 py-3 border rounded-lg focus:ring-2 focus:ring-[#1F6F43]"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="py-12 bg-[#F4F6F8]">
        <div className="max-w-7xl mx-auto px-4">
          {loading ? (
            <div className="text-center py-16 text-gray-500">Loading programs…</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-16 text-gray-500">No programs available.</div>
          ) : (
            <div className="space-y-8">
              {categories.map((category) => {
                const categoryCourses = coursesByCategory[category] || [];
                if (!categoryCourses.length) return null;

                const isExpanded = expandedCategories.includes(category);

                return (
                  <div key={category} className="bg-white rounded-xl shadow">
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full flex justify-between items-center p-6"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-[#1F6F43]/10 rounded-lg flex items-center justify-center mr-4">
                          {getCategoryIcon()}
                        </div>
                        <div className="text-left">
                          <h2 className="font-serif text-xl font-bold">{category}</h2>
                          <p className="text-sm text-gray-500">{categoryCourses.length} program(s)</p>
                        </div>
                      </div>

                      {isExpanded ? (
                        <ChevronUp className="w-6 h-6 text-[#1F6F43]" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-[#1F6F43]" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="px-6 pb-6 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {categoryCourses.map((course: any) => (
                          <CourseCard key={course.id} course={course} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}