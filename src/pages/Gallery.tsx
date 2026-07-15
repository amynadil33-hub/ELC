import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { GALLERY_IMAGES } from '@/lib/constants';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface GalleryImage {
  url: string;
  category: string;
  title: string;
}

export default function Gallery() {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = [
    'All',
    'Classroom',
    'Chess',
    'Graduations',
    'Achievements',
  ];

  // ✅ Gallery images mapped from constants
  const galleryImages: GalleryImage[] = [
    ...GALLERY_IMAGES.classroom.map(url => ({
      url,
      category: 'Classroom',
      title: 'Classroom Activity',
    })),

    ...GALLERY_IMAGES.chess.map(url => ({
      url,
      category: 'Chess',
      title: 'Chess Program',
    })),

    ...GALLERY_IMAGES.graduation.map(url => ({
      url,
      category: 'Graduations',
      title: 'Graduation Ceremony',
    })),

    ...GALLERY_IMAGES.achievements.map(url => ({
      url,
      category: 'Achievements',
      title: 'Student Achievement',
    })),
  ];

  const filteredImages =
    activeCategory === 'All'
      ? galleryImages
      : galleryImages.filter(img => img.category === activeCategory);

  const currentIndex = selectedImage
    ? filteredImages.findIndex(img => img.url === selectedImage.url)
    : -1;

  const handlePrev = () => {
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
      {/* Hero */}
      <section className="bg-[#1F6F43] py-16">
        <div className="text-center text-white">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            Our Gallery
          </h1>
          <p className="text-white/90">
            Moments from classrooms, events, achievements, and celebrations.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-white py-6 border-b sticky top-20 z-40">
        <div className="flex flex-wrap justify-center gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 rounded-full font-medium ${
                activeCategory === cat
                  ? 'bg-[#1F6F43] text-white'
                  : 'bg-[#F4F6F8] text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Grid */}
      <section className="py-12 bg-[#F4F6F8]">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
          {filteredImages.map((img, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedImage(img)}
              className="cursor-pointer overflow-hidden rounded-xl aspect-square"
            >
              <img
                src={img.url}
                alt={img.title}
                className="w-full h-full object-cover hover:scale-110 transition-transform"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Lightbox */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white"
          >
            <X className="w-8 h-8" />
          </button>

          {currentIndex > 0 && (
            <button onClick={handlePrev} className="absolute left-4 text-white">
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          <img
            src={selectedImage.url}
            alt={selectedImage.title}
            className="max-h-[80vh] rounded-lg"
          />

          {currentIndex < filteredImages.length - 1 && (
            <button onClick={handleNext} className="absolute right-4 text-white">
              <ChevronRight className="w-8 h-8" />
            </button>
          )}
        </div>
      )}
    </Layout>
  );
}
