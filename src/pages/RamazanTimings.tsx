import React from "react";
import Layout from "@/components/layout/Layout";

export default function RamazanTimings() {
  const images = [
    {
      src: "/ramazan/ramazan-english-online.jpg",
      alt: "Timings During Ramadan - English Language Classes (Online)",
      title: "English Language Classes (Online)",
    },
    {
      src: "/ramazan/ramazan-enrichment-online.jpg",
      alt: "Enrichment Classes (Online)",
      title: "Enrichment Classes (Online)",
    },
    {
      src: "/ramazan/ramazan-grades-9-10.jpg",
      alt: "Enrichment Grades 9 & 10 - Enrichment Classes (Online)",
      title: "Enrichment Grades 9 & 10 (Online)",
    },
  ];

  return (
    <Layout>
      <section className="bg-[#1F6F43] py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-white">
            Ramazan Timings
          </h1>
          <p className="text-white/80 mt-2 max-w-3xl">
            Temporary schedule during Ramazan (Online classes). Please refer to the tables below.
          </p>
        </div>
      </section>

      <section className="py-10 bg-[#F4F6F8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8">
            {images.map((img) => (
              <div key={img.src} className="bg-white rounded-2xl shadow-lg p-4 md:p-6">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h2 className="font-serif text-lg md:text-xl font-bold text-[#2B2B2B]">
                    {img.title}
                  </h2>

                  <a
                    href={img.src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-[#1F6F43] hover:text-[#C9A24D] transition-colors"
                  >
                    Open image →
                  </a>
                </div>

                <div className="overflow-hidden rounded-xl border">
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-auto object-contain"
                    loading="lazy"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center text-sm text-gray-600">
            If you have questions, please contact ELC.
          </div>
        </div>
      </section>
    </Layout>
  );
}
