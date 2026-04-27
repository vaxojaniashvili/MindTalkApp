// ─── Navigation Types ───
export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  Register: undefined;
  PsychologistDetail: { slug: string };
  CourseDetail: { slug: string };
  ChatRoom: { id: string };
  ConsultationDetail: { id: string };
  EditProfile: undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Psychologists: undefined;
  Courses: undefined;
  Dashboard: undefined;
  Profile: undefined;
};

// ─── API Types — exact match with website /lib/api.ts ───

export type Translatable = Record<string, string>;

export interface ApiUser {
  id: string;
  email: string;
  phone: string | null;
  locale: 'ka' | 'en' | 'ru';
  timezone: string;
  email_verified_at: string | null;
  two_factor_enabled?: boolean;
  roles: string[];
  permissions: string[];
  profile?: ApiProfile | null;
}

export interface ApiProfile {
  user_id?: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  gender: 'male' | 'female' | 'other' | 'prefer_not' | null;
  date_of_birth: string | null;
  avatar_url: string | null;
  country: { id: number; code: string; name: Record<string, string> } | null;
  city: string | null;
  preferred_language: 'ka' | 'en' | 'ru' | null;
  marketing_consent: boolean;
}

export interface Specialization {
  id: number;
  slug: string;
  name: Record<string, string>;
  icon: string | null;
  sort_order?: number;
}

export interface PsychCard {
  id: string;
  slug: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  headline: Record<string, string> | null;
  years_of_experience: number | null;
  languages: string[];
  consultation_base_price: number;
  displayed_price: number;
  currency: string;
  rating_avg: number | null;
  rating_count: number;
  is_featured: boolean;
  city: string | null;
  specializations: Array<{
    slug: string;
    name: Record<string, string>;
    icon: string | null;
  }>;
  verification_level: 'L0' | 'L1' | 'L2' | 'L3';
}

export interface AvailabilityRule {
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_min: number;
}

export interface PsychDetail extends PsychCard {
  bio: Record<string, string> | null;
  intro_video_url: string | null;
  total_sessions: number;
  timezone: string;
  verified_since: string | null;
  availability_rules: AvailabilityRule[];
}

export interface CourseCard {
  id: string;
  slug: string;
  title: Record<string, string>;
  tagline: Record<string, string> | null;
  thumbnail_url: string | null;
  language: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration_minutes: number;
  base_price: number;
  displayed_price: number;
  currency: string;
  rating_avg: number | null;
  rating_count: number;
  enrollments_count: number;
  psychologist: {
    slug: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface CourseLessonData {
  id: number;
  title: Record<string, string>;
  type: 'video' | 'text' | 'quiz' | 'pdf';
  duration_sec: number;
  is_preview: boolean;
  sort_order?: number;
}

export interface CourseModuleData {
  id: number;
  title: Record<string, string>;
  lessons: CourseLessonData[];
  sort_order?: number;
}

export interface CourseDetail {
  id: string;
  slug: string;
  title: Record<string, string>;
  tagline: Record<string, string> | null;
  description: Record<string, string> | null;
  thumbnail_url: string | null;
  language: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration_minutes: number;
  base_price: number;
  displayed_price: number;
  currency: string;
  rating_avg: number | null;
  rating_count: number;
  enrollments_count: number;
  preview_video_url: string | null;
  modules: CourseModuleData[];
  psychologist: {
    slug: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface Review {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  status: 'visible' | 'hidden' | 'flagged';
  psych_reply_body: string | null;
  psych_reply_at: string | null;
  helpful_count: number;
  created_at: string;
  editable: boolean;
  author: {
    display_name: string;
    avatar_url: string | null;
  };
}

export interface ApiConsultation {
  id: string;
  scheduled_at: string;
  duration_min: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show_client' | 'no_show_psych' | 'tech_issue';
  base_price: number;
  commission_amount: number;
  total_paid: number;
  currency: string;
  jitsi_room: string | null;
  jitsi_password: string | null;
  client_notes: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  invoice: { number: string; pdf_url: string | null } | null;
  psychologist: {
    slug: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    headline: Record<string, string> | null;
    timezone: string;
  } | null;
}

export interface ChatSessionData {
  id: string;
  type: 'live_30' | 'live_60' | 'async_7d';
  status: 'pending' | 'active' | 'expired' | 'refunded';
  starts_at: string | null;
  ends_at: string | null;
  live_started_at: string | null;
  base_price: number;
  total_paid: number;
  currency: string;
  created_at: string;
  counterpart: {
    slug: string | null;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    role: 'client' | 'psychologist';
  };
}

export interface SubscriptionPlan {
  id: string;
  name: Record<string, string>;
  interval: 'month' | 'quarter' | 'year';
  days_per_period: number;
  base_price: number;
  displayed_price: number;
  currency: string;
  perks: Record<string, string[]> | null;
  is_active: boolean;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export interface Country {
  id: number;
  code: string;
  dial_code: string | null;
  name: Record<string, string>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface EnrollmentCard {
  id: string;
  course: {
    id: string;
    slug: string;
    title: Record<string, string>;
    tagline: Record<string, string> | null;
    thumbnail_url: string | null;
    language: string;
    level: string;
    duration_minutes: number;
  };
  psychologist: {
    slug: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
  granted_at: string;
  progress_percent: number;
  completed_at: string | null;
  source: 'purchase' | 'subscription' | 'admin_grant';
}
