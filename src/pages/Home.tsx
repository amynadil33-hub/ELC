import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { IMAGES } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { Course } from '@/types';
import { SEED_COURSES, getFeaturedCourses } from '@/lib/seedData';
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
  Quote
} from 'lucide-react';

export default function Home() {
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedCourses();
  }, []);

  const fetchFeaturedCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .limit(6);
      
      if (error) throw error;
      
      // Use database data if available, otherwise use seed data
      if (data && data.length > 0) {
        setFeaturedCourses(data);
      } else {
        setFeaturedCourses(getFeaturedCourses());
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      // Fallback to seed data on error
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
      description: 'Our programs follow Cambridge standards, preparing students for academic excellence.',
    },
    {
      title: 'Experienced Educators',
      description: 'Learn from dedicated teachers with years of experience in English-medium education.',
    },
    {
      title: 'Small Class Sizes',
      description: 'Personalized attention ensures every student reaches their full potential.',
    },
    {
      title: 'Proven Track Record',
      description: 'Thousands of successful students who have excelled in O-Level examinations.',
    },
  ];

  const testimonials = [
    {
      name: 'Parent of Ahmed',
      role: 'Level 4 Student',
      content: 'ELC has transformed my son\'s English proficiency. The teachers are dedicated and the curriculum is excellent.',
      image: IMAGES.students[0],
    },
    {
      name: 'Parent of Aisha',
      role: 'O-Level Graduate',
      content: 'My daughter achieved an A* in her O-Level English exam thanks to ELC\'s comprehensive preparation program.',
      image: IMAGES.students[1],
    },
    {
      name: 'Parent of Mohamed',
      role: 'Level 3 Student',
      content: 'The enrichment programs have helped my child develop not just academically but also in confidence and creativity.',
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
                Building Academic
                <span className="text-[#C9A24D]"> Excellence</span>
              </h1>
              
              <p className="text-white/90 text-lg md:text-xl mb-8 leading-relaxed">
                Everyone's Learning Centre empowers students in the Maldives with quality English education and comprehensive academic programs. From ages 4 to 16, we prepare students for success.
              </p>
              
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
      <section className="py-20 bg-[#F4F6F8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#2B2B2B] mb-6">
                About <span className="text-[#1F6F43]">Everyone's Learning Centre</span>
              </h2>
              
              <div className="w-20 h-1 bg-[#C9A24D] mb-6" />
              
              <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                Founded in 2001 by <strong>Mariyam Shadiya</strong>, Everyone's Learning Centre has been at the forefront of English education in the Maldives for over two decades.
              </p>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Our mission is to strengthen English proficiency for students in English-medium schools and adult learners. We have reached tens of thousands of students across the Maldives, helping them achieve academic excellence.
              </p>
              
              <div className="space-y-4">
                {features.slice(0, 2).map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-[#1F6F43] mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-[#2B2B2B]">{feature.title}</h4>
                      <p className="text-gray-600 text-sm">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <Link
                to="/programs"
                className="inline-flex items-center mt-8 text-[#1F6F43] font-semibold hover:text-[#C9A24D] transition-colors"
              >
                Explore Our Programs
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <img
                src={IMAGES.students[2]}
                alt="Student learning"
                className="rounded-xl shadow-lg"
              />
              <img
                src={IMAGES.students[3]}
                alt="Classroom"
                className="rounded-xl shadow-lg mt-8"
              />
              <img
                src={IMAGES.olevel[0]}
                alt="O-Level preparation"
                className="rounded-xl shadow-lg"
              />
              <img
                src={IMAGES.graduation[1]}
                alt="Achievement"
                className="rounded-xl shadow-lg mt-8"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-[#1F6F43]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">
              Our Mission
            </h2>
            <div className="w-20 h-1 bg-[#C9A24D] mx-auto mb-6" />
            <p className="text-white/90 text-lg max-w-3xl mx-auto">
              To provide exceptional English education that empowers students to excel academically and develop the confidence to succeed in an increasingly global world.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-colors"
              >
                <div className="w-12 h-12 bg-[#C9A24D] rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-white text-lg mb-2">{feature.title}</h3>
                <p className="text-white/80 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Best Age Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <img
                src={IMAGES.students[0]}
                alt="Young learner"
                className="rounded-2xl shadow-xl"
              />
            </div>
            
            <div className="order-1 lg:order-2">
              <span className="text-[#C9A24D] font-semibold text-sm uppercase tracking-wider">
                Early Learning
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#2B2B2B] mt-2 mb-6">
                The Best Age to Start: <span className="text-[#1F6F43]">Around 4 Years</span>
              </h2>
              
              <div className="w-20 h-1 bg-[#C9A24D] mb-6" />
              
              <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                Research shows that children around age 4 are at the optimal stage for language acquisition. At ELC, our Pioneer program (Level 1) is specifically designed for this crucial developmental period.
              </p>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <Star className="w-5 h-5 text-[#C9A24D] mr-3 flex-shrink-0 mt-1" />
                  <span className="text-gray-600">Natural language absorption during critical development years</span>
                </li>
                <li className="flex items-start">
                  <Star className="w-5 h-5 text-[#C9A24D] mr-3 flex-shrink-0 mt-1" />
                  <span className="text-gray-600">Building strong foundations for future academic success</span>
                </li>
                <li className="flex items-start">
                  <Star className="w-5 h-5 text-[#C9A24D] mr-3 flex-shrink-0 mt-1" />
                  <span className="text-gray-600">Fun, engaging activities that make learning enjoyable</span>
                </li>
              </ul>
              
              <Link
                to="/programs"
                className="inline-flex items-center bg-[#1F6F43] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#185a36] transition-colors"
              >
                Explore Level 1 Program
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

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

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#2B2B2B] mb-4">
              What Parents Say
            </h2>
            <div className="w-20 h-1 bg-[#C9A24D] mx-auto mb-6" />
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Hear from parents whose children have thrived at Everyone's Learning Centre.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-[#F4F6F8] rounded-xl p-8 relative"
              >
                <Quote className="w-10 h-10 text-[#C9A24D]/30 absolute top-6 right-6" />
                <div className="flex items-center mb-6">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-14 h-14 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-[#2B2B2B]">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-600 italic">"{testimonial.content}"</p>
                <div className="flex mt-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-5 h-5 text-[#C9A24D] fill-current" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#1F6F43]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Your Child's Journey?
          </h2>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of students who have achieved academic excellence at Everyone's Learning Centre. Enroll today and give your child the gift of quality education.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/programs"
              className="inline-flex items-center justify-center bg-[#C9A24D] text-white px-8 py-4 rounded-lg font-semibold hover:bg-[#b8923f] transition-colors text-lg"
            >
              Browse Programs
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center bg-white text-[#1F6F43] px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-lg"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
