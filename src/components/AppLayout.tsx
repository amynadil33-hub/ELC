import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Menu,
  X,
  GraduationCap,
  Users,
  Award,
  Calendar,
  ArrowRight,
  CheckCircle,
  MapPin,
  Phone,
  Mail,
  Clock,
} from "lucide-react";

// Types
interface Course {
  id: string;
  title: string;
  category: string;
  age_range: string;
  description: string;
  schedule: string;
  duration: string;
  fee: number;
  subjects: string[];
}

// Constants
const IMAGES = {
  hero: "https://d64gsuwffb70l.cloudfront.net/6960c785dbbe68a330bb6214_1767950468742_547e34df.jpg",
  students: [
    "https://d64gsuwffb70l.cloudfront.net/6960c785dbbe68a330bb6214_1767950492070_a174f995.png",
    "https://d64gsuwffb70l.cloudfront.net/6960c785dbbe68a330bb6214_1767950484948_31c4d46a.jpg",
    "https://d64gsuwffb70l.cloudfront.net/6960c785dbbe68a330bb6214_1767950486318_786bd4c9.jpg",
    "https://d64gsuwffb70l.cloudfront.net/6960c785dbbe68a330bb6214_1767950494612_50b024ce.png",
  ],
  chess: [
    "https://d64gsuwffb70l.cloudfront.net/6960c785dbbe68a330bb6214_1767950512839_a4125a0a.jpg",
  ],
  graduation: [
    "https://d64gsuwffb70l.cloudfront.net/6960c785dbbe68a330bb6214_1767950546969_34e2e0d5.jpg",
  ],
};

// Header Component
function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navLinks = [
    { name: "Home", href: "#home" },
    { name: "Programs", href: "#programs" },
    { name: "About", href: "#about" },
    { name: "Contact", href: "#contact" },
  ];

  return (
    <header className="bg-[#1F6F43] sticky top-0 z-50 shadow-lg">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <a href="#home" className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <span className="text-[#1F6F43] font-bold text-xl">ELC</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-white font-serif text-xl font-bold">
                Everyone&apos;s Learning Centre
              </h1>
              <p className="text-[#C9A24D] text-xs">Excellence in Education Since 2001</p>
            </div>
          </a>

          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-white hover:text-[#C9A24D] transition-colors font-medium"
              >
                {link.name}
              </a>
            ))}
            <a
              href="#programs"
              className="bg-[#C9A24D] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#b8923f] transition-colors"
            >
              Enroll Now
            </a>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white p-2"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden pb-4">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-white hover:text-[#C9A24D] py-2"
              >
                {link.name}
              </a>
            ))}
          </div>
        )}
      </nav>
    </header>
  );
}

// Course Card Component
function CourseCard({ course }: { course: Course }) {
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6">
      <span className="text-xs font-medium text-[#1F6F43] bg-[#1F6F43]/10 px-3 py-1 rounded-full">
        {course.category}
      </span>
      <h3 className="font-serif text-xl font-bold text-[#2B2B2B] mt-3 mb-2">{course.title}</h3>
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
      <div className="flex items-center text-sm text-gray-500 mb-4">
        <Users className="w-4 h-4 mr-1 text-[#C9A24D]" />
        <span>Ages {course.age_range}</span>
        <Clock className="w-4 h-4 ml-4 mr-1 text-[#C9A24D]" />
        <span>{course.duration}</span>
      </div>
      <div className="flex items-center justify-between pt-4 border-t">
        <span className="text-xl font-bold text-[#1F6F43]">MVR {course.fee?.toLocaleString()}</span>
        <a
          href="#contact"
          className="text-[#1F6F43] font-medium hover:text-[#C9A24D] flex items-center"
        >
          Enroll <ArrowRight className="w-4 h-4 ml-1" />
        </a>
      </div>
    </div>
  );
}

// Main AppLayout Component (Footer REMOVED)
export default function AppLayout() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data } = await supabase.from("courses").select("*").limit(6);
        setCourses(data || []);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const stats = [
    { icon: Calendar, value: "Since 2001", label: "Years of Excellence" },
    { icon: Users, value: "10,000+", label: "Students Taught" },
    { icon: GraduationCap, value: "Cambridge", label: "Focused Curriculum" },
    { icon: Award, value: "O-Level", label: "Exam Ready" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F8]">
      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <section id="home" className="relative bg-[#1F6F43] overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={IMAGES.hero}
              alt="Students"
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1F6F43] via-[#1F6F43]/90 to-[#1F6F43]/70" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center bg-[#C9A24D]/20 text-[#C9A24D] px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <Award className="w-4 h-4 mr-2" />Excellence in Education Since 2001
                </div>

                <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                  Building Academic<span className="text-[#C9A24D]"> Excellence</span>
                </h1>

                <p className="text-white/90 text-lg md:text-xl mb-8">
                  Everyone&apos;s Learning Centre empowers students in the Maldives with quality English education.
                  From ages 4 to 16, we prepare students for success.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href="#programs"
                    className="inline-flex items-center justify-center bg-[#C9A24D] text-white px-8 py-4 rounded-lg font-semibold hover:bg-[#b8923f] transition-colors text-lg"
                  >
                    View Programs <ArrowRight className="w-5 h-5 ml-2" />
                  </a>
                  <a
                    href="#contact"
                    className="inline-flex items-center justify-center bg-white text-[#1F6F43] px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-lg"
                  >
                    Enroll / Apply
                  </a>
                </div>
              </div>

              <div className="hidden lg:grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <img src={IMAGES.students[0]} alt="Student" className="rounded-xl shadow-2xl" />
                  <img
                    src={IMAGES.graduation[0]}
                    alt="Graduation"
                    className="rounded-xl shadow-2xl"
                  />
                </div>
                <div className="space-y-4 pt-8">
                  <img src={IMAGES.students[1]} alt="Student" className="rounded-xl shadow-2xl" />
                  <img src={IMAGES.chess[0]} alt="Chess" className="rounded-xl shadow-2xl" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-white py-12 -mt-8 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-[#1F6F43]/10 rounded-full mb-4">
                      <stat.icon className="w-7 h-7 text-[#1F6F43]" />
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-[#1F6F43] mb-1">
                      {stat.value}
                    </div>
                    <div className="text-gray-600 text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-20 bg-[#F4F6F8]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#2B2B2B] mb-6">
                  About <span className="text-[#1F6F43]">Everyone&apos;s Learning Centre</span>
                </h2>

                <div className="w-20 h-1 bg-[#C9A24D] mb-6" />

                <p className="text-gray-600 text-lg mb-6">
                  Founded in 2001 by <strong>Mariyam Shadiya</strong>, Everyone&apos;s Learning Centre has been at the
                  forefront of English education in the Maldives for over two decades.
                </p>

                <p className="text-gray-600 mb-6">
                  Our mission is to strengthen English proficiency for students in English-medium schools and adult
                  learners. We have reached tens of thousands of students across the Maldives.
                </p>

                <div className="space-y-4">
                  {["Cambridge-Aligned Curriculum", "Experienced Educators", "Small Class Sizes"].map((item) => (
                    <div key={item} className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-[#1F6F43] mr-3" />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <img src={IMAGES.students[2]} alt="Student" className="rounded-xl shadow-lg" />
                <img
                  src={IMAGES.students[3]}
                  alt="Classroom"
                  className="rounded-xl shadow-lg mt-8"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Programs Section */}
        <section id="programs" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#2B2B2B] mb-4">
                Our Programs
              </h2>
              <div className="w-20 h-1 bg-[#C9A24D] mx-auto mb-6" />
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Comprehensive academic programs designed for students aged 4-16.
              </p>
            </div>

            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-gray-100 rounded-xl p-6 animate-pulse h-64" />
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-20 bg-[#1F6F43]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Start Your Child&apos;s Journey?
            </h2>
            <p className="text-white/90 text-lg mb-8">
              Join thousands of students who have achieved academic excellence at ELC. Contact us today!
            </p>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 max-w-md mx-auto">
              <div className="space-y-4 text-white text-left">
                <p className="flex items-center">
                  <Phone className="w-5 h-5 mr-3 text-[#C9A24D]" />
                  +960 XXX XXXX
                </p>
                <p className="flex items-center">
                  <Mail className="w-5 h-5 mr-3 text-[#C9A24D]" />
                  info@elc.mv
                </p>
                <p className="flex items-center">
                  <MapPin className="w-5 h-5 mr-3 text-[#C9A24D]" />
                  Male&apos;, Maldives
                </p>
                <p className="flex items-center">
                  <Clock className="w-5 h-5 mr-3 text-[#C9A24D]" />
                  Sat-Thu: 9AM-9PM
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ✅ Footer intentionally removed from AppLayout (Home.tsx footer will be used) */}
    </div>
  );
}
