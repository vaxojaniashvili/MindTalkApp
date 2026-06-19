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
  ChatSessions: undefined;
  Settings: undefined;
  // Dashboard screens
  Wallet: undefined;
  WalletTopup: undefined;
  Subscriptions: undefined;
  Consultations: undefined;
  MyCourses: undefined;
  CoursePlayer: { slug: string };
  Notifications: undefined;
  // Booking
  BookPsychologist: { slug: string };
  // Info
  About: undefined;
  FAQ: undefined;
  // Payment
  PaymentSuccess: { orderId?: string };
  PaymentFailed: undefined;
  // Psychologist-specific
  PsychologistEditor: undefined;
  AvailabilityEditor: undefined;
  PsychCourses: undefined;
  Withdrawals: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Psychologists: undefined;
  Courses: undefined;
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
  availability_rules?: AvailabilityRule[];
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

export interface ChatBookingInfo {
  consultation_base_price: number;
  consultation_price: number;
  currency: string | null;
  psychologist_google_connected: boolean;
  psychologist_responded_at: string | null;
  closed_at: string | null;
}

export interface ChatSessionData {
  id: string;
  type: 'live_30' | 'live_60' | 'async_7d' | 'booking';
  status: 'pending' | 'active' | 'expired' | 'refunded';
  booking?: ChatBookingInfo | null;
  starts_at: string | null;
  ends_at: string | null;
  live_started_at: string | null;
  base_price: number;
  total_paid: number;
  currency: string;
  crisis_flags?: unknown[] | null;
  created_at: string;
  counterpart: {
    slug: string | null;
    first_name: string | null;
    last_name: string | null;
    display_name?: string | null;
    avatar_url: string | null;
    role: 'client' | 'psychologist';
  };
  last_message?: ChatMessageData | null;
  unread_count?: number;
}

export type ChatMessageType = 'text' | 'slot_offer' | 'slot_booked' | 'system';

export interface OfferedSlot {
  id: string;
  start_utc: string;
  duration_min: number;
  status: 'open' | 'booked';
}

export interface ChatMessageMeta {
  slots?: OfferedSlot[];
  consultation_id?: string;
  scheduled_at?: string | null;
  duration_min?: number;
  meeting_url?: string | null;
}

export interface ChatMessageData {
  id: number;
  session_id: string;
  sender_id: string;
  sender_name: string;
  type?: ChatMessageType;
  body: string | null;
  meta?: ChatMessageMeta | null;
  attachment_url: string | null;
  attachment_mime: string | null;
  attachment_size: number | null;
  flags: { crisis_keywords?: string[] } | null;
  read_at: string | null;
  created_at: string;
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
  order_id?: string | null;
  certificate_serial?: string | null;
  revoked_at?: string | null;
}

// ─── Wallet Types ───
export interface WalletTransaction {
  id: string;
  kind: 'topup' | 'course_purchase' | 'refund_credit' | 'withdrawal_hold' | 'withdrawal_paid' | 'withdrawal_reversed' | 'manual_adjust';
  amount: number;
  balance_after: number;
  currency: string;
  created_at: string;
}

export interface WalletData {
  balance: number;
  held_for_withdrawal: number;
  available: number;
  currency: string;
  recent_transactions: WalletTransaction[];
}

// ─── Subscription Types ───
export interface SubscriptionData {
  id: string;
  status: 'trialing' | 'active' | 'past_due' | 'paused' | 'cancelled';
  plan: {
    name: Record<string, string>;
    base_price: number;
    currency: string;
    interval: 'month' | 'quarter' | 'year';
  };
  psychologist: {
    slug: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
  current_period_end: string;
  cancel_at_period_end: boolean;
}

// ─── Booking Types ───
export interface BookingSlot {
  start_utc: string;
  duration_min: number;
}

export interface AvailableSlotsResponse {
  slots: BookingSlot[];
  timezone: string;
}

// ─── Cancel Preview ───
export interface CancelPreview {
  refund_rate: number;
  refund_amount: number;
  currency: string;
}

// ─── Withdrawal Types ───
export interface WithdrawalData {
  id: string;
  amount: number;
  currency: string;
  iban: string;
  account_holder: string;
  bank: string;
  status: 'requested' | 'approved' | 'paid' | 'rejected';
  created_at: string;
  processed_at: string | null;
}

// ─── Course Player Types ───
export interface PlayerLessonData {
  id: number;
  title: Record<string, string>;
  type: 'video' | 'text' | 'quiz' | 'pdf';
  duration_sec: number;
  is_preview: boolean;
  sort_order?: number;
  completed: boolean;
  watched_seconds: number;
  video_url: string | null;
  video_mime: string | null;
  content_path: string | null;
  meta: Record<string, unknown> | null;
}

export interface PlayerModuleData {
  id: number;
  title: Record<string, string>;
  lessons: PlayerLessonData[];
  sort_order?: number;
}

export interface EnrollmentPlayerData {
  enrollment: EnrollmentCard;
  course: {
    id: string;
    slug: string;
    title: Record<string, string>;
    modules: PlayerModuleData[];
  };
}

// ─── Psychologist Profile (editable) ───
export interface ApiPsychologist {
  id: string;
  slug: string;
  headline: Record<string, string> | null;
  bio: Record<string, string> | null;
  specializations: Array<{ id: number; slug: string; name: Record<string, string> }>;
  languages: string[];
  years_of_experience: number | null;
  consultation_base_price: number;
  currency: string;
  city: string | null;
  timezone: string;
  intro_video_url: string | null;
  avatar_url: string | null;
  verification_level: 'L0' | 'L1' | 'L2' | 'L3';
}

// ─── Verification ───
export interface VerificationStatusData {
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  diploma_uploaded: boolean;
  certificates_count: number;
}

// ─── Topup Response ───
export interface TopupResponse {
  order_id: string;
  redirect_url: string;
}

// ─── Invoice ───
export interface InvoiceData {
  number: string;
  amount: number;
  currency: string;
  pdf_url: string | null;
}

// ─── AI / Mira ───
export interface AiPersona {
  name: string;
  is_custom: boolean;
}

export interface AiGreetingResponse {
  greeting: string;
  persona: AiPersona;
}

export interface AiMatch {
  id: string;
  rank: number;
  score: number;
  reasoning: string;
  first_session_questions: string[];
  expires_at: string;
  psychologist: {
    id: string;
    slug: string;
    display_name: string;
    avatar_url: string | null;
    headline: Record<string, string> | null;
    rating_avg: number;
    rating_count: number;
    consultation_base_price: number;
    currency: string | null;
    specializations: Array<{ slug: string; name: Record<string, string> | string }>;
    languages: string[];
  } | null;
}

export interface ClientAiProfile {
  bio_text: string;
  bio_language: string;
  tags: string[];
  age_group: string | null;
  self_gender: string | null;
  preferred_psych_gender: string | null;
  preferred_session_lang: string | null;
  crisis_active: boolean;
  updated_at: string;
}

export interface AiBioPayload {
  bio_text?: string;
  tags: string[];
  age_group?: string | null;
  self_gender?: string | null;
  preferred_psych_gender?: string | null;
  preferred_session_lang?: string | null;
  consent: boolean;
}

// ─── Reviews (list with rating meta) ───
export interface ReviewListMeta {
  total: number;
  page: number;
  last_page: number;
  per_page: number;
  rating_avg: number | null;
  rating_count: number;
}

export interface ApiReviewList {
  data: Review[];
  meta: ReviewListMeta;
}

// ─── Refunds ───
export interface RefundEligibility {
  eligible: boolean;
  watched_seconds?: number;
  max_watch_seconds?: number;
  amount?: number;
  currency?: string;
  reason?: string;
}
