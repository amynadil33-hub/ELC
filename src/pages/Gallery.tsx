import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { IMAGES } from '@/lib/constants';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface GalleryImage {
  url: string;
  category: string;
  title: string;
}

export default function Gallery() {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', 'Classroom', 'Events', 'Achievements', 'Chess', 'Graduations'];

  const galleryImages: GalleryImage[] = [
    { url: IMAGES.students[0], category: 'Classroom', title: 'Young learner in class' },
    { url: IMAGES.students[1], category: 'Classroom', title: 'Student studying' },
    { url: IMAGES.students[2], category: 'Classroom', title: 'Interactive learning' },
    { url: IMAGES.students[3], category: 'Classroom', title: 'Reading session' },
    { url: IMAGES.chess[0], category: 'Chess', title: 'Chess tournament' },
    { url: IMAGES.chess[1], category: 'Chess', title: 'Chess practice' },
    { url: IMAGES.graduation[0], category: 'Graduations', title: 'Graduation ceremony' },
    { url: IMAGES.graduation[1], category: 'Graduations', title: 'Graduate celebration' },
    { url: IMAGES.graduation[2], category: 'Achievements', title: 'Award ceremony' },
    { url: IMAGES.olevel[0], category: 'Achievements', title: 'O-Level preparation' },
    { url: IMAGES.olevel[1], category: 'Achievements', title: 'Exam success' },
    { url: IMAGES.hero, category: 'Events', title: 'ELC classroom environment' },
  ];

  const filteredImages = activeCategory === 'All'
    ? galleryImages
    : galleryImages.filter(img => img.category === activeCategory);

  const currentIndex = selectedImage
    ? filteredImages.findIndex(img => img.url === selectedImage.url)
    : -1;

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setSelectedImage(filteredImages[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentIndex < filteredImages.length - 1) {
      setSelectedImage(filteredImages[currentIndex + 1]);
    }
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-[#1F6F43] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">
              Our Gallery
            </h1>
            <p className="text-white/90 text-lg max-w-2xl mx-auto">
              Explore moments from our classrooms, events, achievements, and celebrations at Everyone's Learning Centre.
            </p>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="bg-white py-6 border-b sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-6 py-2 rounded-full font-medium transition-colors ${
                  activeCategory === category
                    ? 'bg-[#1F6F43] text-white'
                    : 'bg-[#F4F6F8] text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-12 bg-[#F4F6F8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredImages.map((image, index) => (
              <div
                key={index}
                onClick={() => setSelectedImage(image)}
                className="relative group cursor-pointer overflow-hidden rounded-xl aspect-square"
              >
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white font-medium">{image.title}</p>
                    <p className="text-white/70 text-sm">{image.category}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredImages.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">No images found in this category.</p>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          {/* Close Button */}
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Previous Button */}
          {currentIndex > 0 && (
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors bg-black/50 p-2 rounded-full"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          {/* Image */}
          <div className="max-w-4xl max-h-[80vh] mx-4">
            <img
              src={selectedImage.url}
              alt={selectedImage.title}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            <div className="text-center mt-4">
              <p className="text-white font-medium text-lg">{selectedImage.title}</p>
              <p className="text-white/70">{selectedImage.category}</p>
            </div>
          </div>

          {/* Next Button */}
          {currentIndex < filteredImages.length - 1 && (
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors bg-black/50 p-2 rounded-full"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}

          {/* Image Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
            {currentIndex + 1} / {filteredImages.length}
          </div>
        </div>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-[#1F6F43]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl font-bold text-white mb-4">
            Want to Be Part of Our Story?
          </h2>
          <p className="text-white/90 mb-8">
            Join thousands of students who have made lasting memories at ELC.
          </p>
          <a
            href="/programs"
            className="inline-block bg-[#C9A24D] text-white px-8 py-4 rounded-lg font-semibold hover:bg-[#b8923f] transition-colors"
          >
            Explore Our Programs
          </a>
        </div>
      </section>
    </Layout>
  );
}
