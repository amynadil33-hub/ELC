import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/AuthContext";
import { ApplicationProvider } from "@/context/ApplicationContext";

/* Public pages */
import Index from "./pages/Index";
import Programs from "./pages/Programs";
import CourseDetail from "./pages/CourseDetail";
import Gallery from "./pages/Gallery";
import Contact from "./pages/Contact";

/* ✅ NEW Policy pages */
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import RefundPolicy from "./pages/RefundPolicy";

/* Application & payment */
import Apply from "./pages/Apply";
import MakePayment from "./pages/MakePayment";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";

/* Auth */
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import AuthCallback from "./pages/AuthCallback";

/* Admin */
import AdminPayments from "./pages/admin/AdminPayments";
import AdminEnrollments from "./pages/admin/AdminEnrollments";
import AdminCourses from "./pages/admin/AdminCourses";

/* Fallback */
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="light">
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ApplicationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />

            {/* 🚨 ROUTES ONLY — Router is in main.tsx */}
            <Routes>
              {/* Public */}
              <Route path="/" element={<Index />} />
              <Route path="/programs" element={<Programs />} />
              <Route path="/course/:id" element={<CourseDetail />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/contact" element={<Contact />} />

              {/* ✅ Policies (BML required) */}
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsAndConditions />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />

              {/* Application & payment flow */}
              <Route path="/apply/:courseId" element={<Apply />} />
              <Route path="/make-payment" element={<MakePayment />} />
              <Route path="/checkout" element={<Checkout />} />

              {/* ✅ MUST match BML redirect */}
              <Route path="/payment/success" element={<PaymentSuccess />} />

              {/* Auth */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* Admin */}
              <Route path="/admin/payments" element={<AdminPayments />} />
              <Route path="/admin/enrollments" element={<AdminEnrollments />} />
              <Route path="/admin/courses" element={<AdminCourses />} />

              {/* Fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </ApplicationProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
