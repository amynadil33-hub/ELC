import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Home, BookOpen, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <Layout>
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-[#F4F6F8]">
        <div className="text-center p-8 max-w-lg mx-4">
          {/* 404 Icon */}
          <div className="w-24 h-24 bg-[#1F6F43]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-5xl font-bold text-[#1F6F43]">404</span>
          </div>
          
          <h1 className="font-serif text-3xl font-bold text-[#2B2B2B] mb-4">
            Page Not Found
          </h1>
          
          <p className="text-gray-600 mb-8">
            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center bg-[#1F6F43] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#185a36] transition-colors"
            >
              <Home className="w-5 h-5 mr-2" />
              Back to Home
            </Link>
            <Link
              to="/programs"
              className="inline-flex items-center justify-center bg-white border border-[#1F6F43] text-[#1F6F43] px-6 py-3 rounded-lg font-semibold hover:bg-[#1F6F43]/5 transition-colors"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              View Programs
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
