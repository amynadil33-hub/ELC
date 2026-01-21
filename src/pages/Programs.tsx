import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import CourseCard from '@/components/ui/CourseCard';
import { supabase } from '@/lib/supabase';
import { Course } from '@/types';
import { CATEGORIES } from '@/lib/constants';
import { SEED_COURSES } from '@/lib/seedData';
import { ChevronDown, ChevronUp, Search, Filter, BookOpen } from 'lucide-react';

export default function Programs() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(CATEGORIES);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('status', true)
        .order('category', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setCourses(data);
      } else {
        // Temporary fallback until all courses are in Supabase
        setCourses(SEED_COURSES);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses(SEED_COURSES);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.subjects?.some(s =>
        s.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesCategory =
      !selectedCategory || course.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const coursesByCategory = CATEGORIES.reduce((acc, category) => {
    acc[category] = filteredCourses.filter(
      course => course.category === category
    );
    return acc;
  }, {} as Record<string, Course[]>);

  const getCategoryIcon = () => (
    <BookOpen className="w-6 h-6 text-[#1F6F43]" />
  );

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-[#1F6F43] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">
            Our Programs
          </h1>
          <p className="text-white/90 text-lg max-w-2xl mx-auto">
            Comprehensive academic programs designed for students aged 4–16.
          </p>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="bg-white py-6 border-b sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-4">
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
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="pl-12 pr-8 py-3 border rounded-lg focus:ring-2 focus:ring-[#1F6F43]"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Programs List */}
      <section className="py-12 bg-[#F4F6F8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-16 text-gray-500">Loading programs…</div>
          ) : (
            <div className="space-y-8">
              {CATEGORIES.map(category => {
                const categoryCourses = coursesByCategory[category];
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
                          <h2 className="font-serif text-xl font-bold">
                            {category}
                          </h2>
                          <p className="text-sm text-gray-500">
                            {categoryCourses.length} program(s)
                          </p>
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
                        {categoryCourses.map(course => (
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
