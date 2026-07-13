import React from 'react';
import { Link } from 'react-router-dom';
import { Course } from '@/types';
import { Clock, Users, BookOpen, ArrowRight, Tag } from 'lucide-react';

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group">
      <div className="p-6">
        {/* Category Badge */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-[#1F6F43] bg-[#1F6F43]/10 px-3 py-1 rounded-full">
            {course.category}
          </span>
          {course.subjects && course.subjects.length > 0 && (
            <span className="text-xs text-[#C9A24D] font-medium">
              {course.subjects.length} Subject{course.subjects.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-serif text-xl font-bold text-[#2B2B2B] mb-2 group-hover:text-[#1F6F43] transition-colors">
          {course.title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {course.description}
        </p>

        {/* Meta Info */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <Users className="w-4 h-4 mr-1 text-[#C9A24D]" />
            <span>Ages {course.age_range}</span>
          </div>

          {/* Grades (NEW) */}
          {course.grades && (
            <div className="flex items-center text-sm text-gray-500">
              <Tag className="w-4 h-4 mr-1 text-[#C9A24D]" />
              <span>{course.grades}</span>
            </div>
          )}

          <div className="flex items-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-1 text-[#C9A24D]" />
            <span>{course.duration}</span>
          </div>
        </div>

        {/* Schedule */}
        {course.schedule && (
          <div className="flex items-start text-sm text-gray-500 mb-4">
            <BookOpen className="w-4 h-4 mr-1 text-[#C9A24D] flex-shrink-0 mt-0.5" />
            <span className="line-clamp-1">{course.schedule}</span>
          </div>
        )}

        {/* Subjects Tags */}
        {course.subjects && course.subjects.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {course.subjects.slice(0, 4).map((subject, index) => (
              <span
                key={index}
                className="text-xs bg-[#F4F6F8] text-gray-600 px-2 py-1 rounded"
              >
                {subject}
              </span>
            ))}
            {course.subjects.length > 4 && (
              <span className="text-xs bg-[#F4F6F8] text-gray-600 px-2 py-1 rounded">
                +{course.subjects.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Price & CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div>
            <span className="text-2xl font-bold text-[#1F6F43]">
              MVR {course.fee?.toLocaleString() || 'TBD'}
            </span>
            <span className="text-sm text-gray-500 ml-1">/ course</span>
          </div>
          <Link
            to={`/course/${course.id}`}
            className="flex items-center text-[#1F6F43] font-medium hover:text-[#C9A24D] transition-colors group/link"
          >
            View Details
            <ArrowRight className="w-4 h-4 ml-1 group-hover/link:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
