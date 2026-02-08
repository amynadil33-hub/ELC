import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Youtube } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#2B2B2B] text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand / About */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-[#1F6F43] rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">ELC</span>
              </div>
              <div>
                <h3 className="font-serif font-bold">Everyone&apos;s Learning Centre</h3>
              </div>
            </div>

            <p className="text-gray-400 text-sm mb-4">
              Building academic excellence since 2001. Empowering students in the Maldives with quality English
              education and comprehensive academic programs.
            </p>

            {/* Socials */}
            <div className="flex space-x-4 mb-4">
              <a href="#" className="text-gray-400 hover:text-[#C9A24D] transition-colors" aria-label="Facebook">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-[#C9A24D] transition-colors" aria-label="Instagram">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-[#C9A24D] transition-colors" aria-label="YouTube">
                <Youtube className="w-5 h-5" />
              </a>
            </div>

            {/* BML-required merchant info */}
            <div className="text-xs text-gray-500 leading-relaxed">
              <div>Merchant Outlet Country: Maldives</div>
              <div>Transaction Currency: MVR (Maldivian Rufiyaa)</div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif font-bold text-lg mb-4 text-[#C9A24D]">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/programs" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Programs & Courses
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Gallery
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Student Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Programs */}
          <div>
            <h4 className="font-serif font-bold text-lg mb-4 text-[#C9A24D]">Our Programs</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/programs" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Cambridge English Programs
                </Link>
              </li>
              <li>
                <Link to="/programs" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Enrichment Programs
                </Link>
              </li>
              <li>
                <Link to="/programs" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Individual Subjects
                </Link>
              </li>
              <li>
                <Link to="/programs" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Fast Track O-Levels
                </Link>
              </li>
              <li>
                <Link to="/programs" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Chess Program
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies + Secure Payments */}
          <div>
            <h4 className="font-serif font-bold text-lg mb-4 text-[#C9A24D]">Policies & Secure Payments</h4>

            <ul className="space-y-2 mb-5">
              <li>
                <Link to="/privacy-policy" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Refund & Cancellation Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Terms & Conditions
                </Link>
              </li>
            </ul>

            <p className="text-gray-400 text-sm mb-3">
              Card payments are securely processed by{" "}
              <span className="text-white font-semibold">Bank of Maldives</span>.
              <br />
              We do not store card information.
            </p>

            {/* Card logos (BML required) */}
            <div className="inline-flex bg-white rounded-md px-3 py-2">
              <img
                src="/bml/cards.png"
                alt="Accepted cards: AMEX, Visa, Mastercard, Maestro"
                className="h-7 object-contain"
              />
            </div>
          </div>
        </div>

        {/* Contact row (optional, keep your existing contact block here if you prefer) */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-[#C9A24D] flex-shrink-0 mt-0.5" />
              <span className="text-gray-400 text-sm">Male&apos;, Maldives</span>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-[#C9A24D] flex-shrink-0" />
              <span className="text-gray-400 text-sm">+960 799 6772</span>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-[#C9A24D] flex-shrink-0" />
              <span className="text-gray-400 text-sm">elc@everyones.com.mv</span>
            </div>
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-[#C9A24D] flex-shrink-0 mt-0.5" />
              <span className="text-gray-400 text-sm">
                Sat - Thu: 9:00 AM - 9:00 PM
                <br />
                Friday: Closed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Everyone&apos;s Learning Centre. All rights reserved.
            </p>

            <div className="flex space-x-6">
              <Link to="/privacy-policy" className="text-gray-400 hover:text-white transition-colors text-sm">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-400 hover:text-white transition-colors text-sm">
                Terms & Conditions
              </Link>
              <Link to="/refund-policy" className="text-gray-400 hover:text-white transition-colors text-sm">
                Refund Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
