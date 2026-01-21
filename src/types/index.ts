// =====================
// Course
// =====================
export interface Course {
  id: string;
  title: string;
  category: string;

  age_range?: string;
  grades?: string;                 // course target grades

  description?: string;            // About This Program
  learning_outcomes?: string;      // What You'll Learn (rich text)

  schedule?: string;
  duration?: string;

  fee?: number;                    // legacy / fallback fee

  subjects?: string[];             // tags / labels (Programs page)

  created_at?: string;

  // UI-only (not DB columns)
  selected_price?: CoursePricing;  // chosen pricing option
}

// =====================
// Course Pricing
// =====================
export interface CoursePricing {
  id: string;
  course_id: string;

  label: string;                   // e.g. Monthly, Term, Annual
  amount: number;
  currency?: string;               // default: MVR
  billing_period?: string;         // monthly | term | annual | one-time

  sort_order?: number;
  is_active?: boolean;

  created_at?: string;
}

// =====================
// Application
// =====================
export interface Application {
  id?: string;
  user_id?: string;

  course_id: string;
  pricing_id?: string;             // 🔑 links to course_pricing

  full_name: string;
  age: number;
  english_level: string;

  email: string;
  phone: string;
  student_id_no: string;

  grade_at_school: string;         // student's current grade (NOT course grade)
  school: string;
  school_time: string;

  parent_name: string;
  parent_viber: string;

  status?: string;
  created_at?: string;
}

// =====================
// Payment
// =====================
export interface Payment {
  id?: string;
  user_id?: string;

  application_id?: string;
  course_id: string;
  pricing_id?: string;             // 🔑 exact price paid

  amount: number;
  currency?: string;

  status: 'pending' | 'paid' | 'failed';
  payment_reference?: string;
  payment_method: string;

  created_at?: string;
}

// =====================
// User
// =====================
export interface User {
  id: string;
  email: string;
}
