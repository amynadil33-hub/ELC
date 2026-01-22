import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { IMAGES } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { Course } from '@/types';
import { getFeaturedCourses } from '@/lib/seedData';
import CourseCard from '@/components/ui/CourseCard';
import {
  GraduationCap,
  BookOpen,
  Users,
  Award,
  Calendar,
  ArrowRight,
  CheckCircle,
  Star,
  Quote,
} from 'lucide-react';

export default function Home() {
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedCourses();
  }, []);

  const fetchFeaturedCourses = async () => {
    try {
      const { data, error } = await supabase.from('courses').select('*').limit(6);
      if (error) throw error;

      if (data && data.length > 0) {
        setFeaturedCourses(data);
      } else {
        setFeaturedCourses(getFeaturedCourses());
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setFeaturedCourses(getFeaturedCourses());
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { icon: Calendar, value: 'Since 2001', label: 'Years of Excellence' },
    { icon: Users, value: '10,000+', label: 'Students Taught' },
    { icon: GraduationCap, value: 'Cambridge', label: 'Focused Curriculum' },
    { icon: Award, value: 'O-Level', label: 'Exam Ready' },
  ];

  const features = [
    {
      title: 'Cambridge-Aligned Curriculum',
      description:
        'Our programs follow Cambridge standards, preparing students for academic excellence.',
    },
    {
      title: 'Experienced Educators',
      description:
        'Learn from dedicated teachers with years of experience in English-medium education.',
    },
    {
      title: 'Small Class Sizes',
      description:
        'Personalized attention ensures every student reaches their full potential.',
    },
    {
      title: 'Proven Track Record',
      description:
        'Thousands of successful students who have excelled in O-Level examinations.',
    },
  ];

  const testimonials = [
    {
      name: 'Parent of Ahmed',
      role: 'Level 4 Student',
      content:
        "ELC has transformed my son's English proficiency. The teachers are dedicated and the curriculum is excellent.",
      image: IMAGES.students[0],
    },
    {
      name: 'Parent of Aisha',
      role: 'O-Level Graduate',
      content:
        "My daughter achieved an A* in her O-Level English exam thanks to ELC's comprehensive preparation program.",
      image: IMAGES.students[1],
    },
    {
      name: 'Parent of Mohamed',
      role: 'Level 3 Student',
      content:
        'The enrichment programs have helped my child develop not just academically but also in confidence and creativity.',
      image: IMAGES.students[2],
    },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-[#1F6F43] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={IMAGES.hero}
            alt="Students learning"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1F6F43] via-[#1F6F43]/90 to-[#1F6F43]/70" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center bg-[#C9A24D]/20 text-[#C9A24D] px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Award className="w-4 h-4 mr-2" />
                Excellence in Education Since 2001
              </div>

              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Building Academic <span className="text-[#C9A24D]">Excellence</span>
              </h1>

              <p className="text-white/90 text-lg md:text-xl mb-8 leading-relaxed">
                Everyone&apos;s Learning Centre empowers students in the Maldives
                with quality English education and comprehensive academic programs.
                From ages 4 to 16, we prepare students for success.
              </p>

              {/* ✅ UPDATED CTA BUTTONS */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/programs"
                  className="inline-flex items-center justify-center bg-[#C9A24D] text-white px-8 py-4 rounded-lg font-semibold hover:bg-[#b8923f] transition-colors text-lg"
                >
                  View Programs
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>

                <Link
                  to="/programs"
                  className="inline-flex items-center justify-center bg-white text-[#1F6F43] px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-lg"
                >
                  Enroll / Apply
                </Link>

                {/* Student Portal */}
                <a
                  href="https://linktr.ee/everyonesonline"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center bg-[#1F6F43] border border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-[#185a36] transition-colors text-lg"
                >
                  Student Portal
                </a>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <img
                    src={IMAGES.students[0]}
                    alt="Student learning"
                    className="rounded-xl shadow-2xl"
                  />
                  <img
                    src={IMAGES.graduation[0]}
                    alt="Graduation"
                    className="rounded-xl shadow-2xl"
                  />
                </div>
                <div className="space-y-4 pt-8">
                  <img
                    src={IMAGES.students[1]}
                    alt="Student studying"
                    className="rounded-xl shadow-2xl"
                  />
                  <img
                    src={IMAGES.chess[0]}
                    alt="Chess program"
                    className="rounded-xl shadow-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* (REST OF FILE UNCHANGED) */}

      {/* Featured Courses */}
      <section className="py-20 bg-[#F4F6F8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#2B2B2B] mb-4">
              Featured Programs
            </h2>
            <div className="w-20 h-1 bg-[#C9A24D] mx-auto mb-6" />
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Discover our comprehensive range of programs designed to help students excel at every level.
            </p>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
                  <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              to="/programs"
              className="inline-flex items-center bg-[#1F6F43] text-white px-8 py-4 rounded-lg font-semibold hover:bg-[#185a36] transition-colors text-lg"
            >
              View All Programs
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
