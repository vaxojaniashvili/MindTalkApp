import apiClient from './client';
import { ENDPOINTS } from '../constants/api';
import type {
  ApiUser,
  PsychCard,
  PsychDetail,
  CourseCard,
  CourseDetail,
  ApiConsultation,
  ChatSessionData,
  ChatMessageData,
  SubscriptionPlan,
  Review,
  AppNotification,
  Specialization,
  Country,
  PaginatedResponse,
  EnrollmentCard,
  ApiProfile,
  WalletData,
  SubscriptionData,
  AvailableSlotsResponse,
  CancelPreview,
  WithdrawalData,
  EnrollmentPlayerData,
  TopupResponse,
  ApiPsychologist,
  VerificationStatusData,
  AiGreetingResponse,
  AiMatch,
  ClientAiProfile,
  AiBioPayload,
  ApiReviewList,
  RefundEligibility,
} from '../types';

// ─── Auth ───
export const loginApi = (email: string, password: string) =>
  apiClient.post<{ user: ApiUser; token: string }>(ENDPOINTS.login, { email, password });

export const registerApi = (data: {
  phone: string;
  otp_code: string;
  email: string;
  password: string;
  password_confirmation: string;
  first_name: string;
  last_name: string;
  role: 'client' | 'psychologist';
  locale?: string;
}) => apiClient.post<{ user: ApiUser; token: string }>(ENDPOINTS.register, data);

// ─── User ───
export const fetchMe = () => apiClient.get<{ user: ApiUser }>(ENDPOINTS.me);

export const updateProfile = (data: Partial<ApiProfile>) =>
  apiClient.patch<{ profile: ApiProfile }>(ENDPOINTS.meProfile, data);

export const fetchNotifications = () =>
  apiClient.get<{ notifications: AppNotification[] }>(ENDPOINTS.meNotifications);

// ─── Psychologists ───
export const fetchPsychologists = (params?: Record<string, unknown>) =>
  apiClient.get<PaginatedResponse<PsychCard>>(ENDPOINTS.psychologists, { params });

export const fetchPsychologistDetail = (slug: string) =>
  apiClient.get<{ psychologist: PsychDetail }>(ENDPOINTS.psychologistDetail(slug));

export const fetchPsychologistReviews = (slug: string, page = 1) =>
  apiClient.get<ApiReviewList>(ENDPOINTS.psychologistReviews(slug), {
    params: { page },
  });

export const fetchReviewEligibility = (slug: string) =>
  apiClient.get<{ eligible: boolean }>(ENDPOINTS.psychologistReviewEligibility(slug));

export const submitReview = (
  slug: string,
  data: { rating: number; title: string | null; body: string },
) => apiClient.post(ENDPOINTS.psychologistReviews(slug), data);

export const replyToReview = (id: string, body: string) =>
  apiClient.post(ENDPOINTS.reviewReply(id), { body });

export const fetchSubscriptionPlans = (slug: string) =>
  apiClient.get<{ plans: SubscriptionPlan[] }>(ENDPOINTS.psychologistPlans(slug));

// ─── Courses ───
export const fetchCourses = (params?: Record<string, unknown>) =>
  apiClient.get<PaginatedResponse<CourseCard>>(ENDPOINTS.courses, { params });

export const fetchCourseDetail = (slug: string) =>
  apiClient.get<{ course: CourseDetail }>(ENDPOINTS.courseDetail(slug));

// ─── Dashboard ───
export const fetchConsultations = () =>
  apiClient.get<{ consultations: ApiConsultation[] }>(ENDPOINTS.meConsultations);

export const fetchChatSessions = () =>
  apiClient.get<{ sessions: ChatSessionData[] }>(ENDPOINTS.meChatSessions);

export const fetchChatMessages = (sessionId: string) =>
  apiClient.get<{ messages: ChatMessageData[] }>(
    `/me/chat/sessions/${sessionId}/messages?limit=100`,
  );

export const sendChatMessage = (sessionId: string, body: string) =>
  apiClient.post<{ message: ChatMessageData }>(
    `/me/chat/sessions/${sessionId}/messages`,
    { body },
  );

export const startLiveSession = (sessionId: string) =>
  apiClient.post<{ session: ChatSessionData }>(
    `/me/chat/sessions/${sessionId}/start-live`,
  );

export const fetchMyEnrollments = () =>
  apiClient.get<{ enrollments: EnrollmentCard[] }>(ENDPOINTS.meCourses);

// ─── Wallet ───
export const fetchWallet = () =>
  apiClient.get<{ wallet: WalletData }>(ENDPOINTS.meWallet);

export const topupWallet = (amount: number, provider = 'bog') =>
  apiClient.post<{ topup: TopupResponse }>(ENDPOINTS.meWalletTopup, { amount, provider });

// ─── Subscriptions ───
export const fetchSubscriptions = () =>
  apiClient.get<{ subscriptions: SubscriptionData[] }>(ENDPOINTS.meSubscriptions);

// ─── Booking ───
export const fetchPsychologistSlots = (slug: string, params?: Record<string, unknown>) =>
  apiClient.get<AvailableSlotsResponse>(ENDPOINTS.psychologistSlots(slug), { params });

export const createBooking = (data: {
  psychologist_slug: string;
  slot_start_utc: string;
  notes?: string;
}) => apiClient.post<{ redirect_url: string }>(ENDPOINTS.bookings, data);

// ─── Consultations ───
export const fetchCancelPreview = (id: string) =>
  apiClient.get<{ preview: CancelPreview }>(ENDPOINTS.consultationCancelPreview(id));

export const cancelConsultation = (id: string) =>
  apiClient.post<{ consultation: ApiConsultation }>(ENDPOINTS.consultationCancel(id));

// ─── Course Player ───
export const fetchEnrollmentPlayer = (slug: string) =>
  apiClient.get<EnrollmentPlayerData>(ENDPOINTS.enrollmentPlayer(slug));

export const trackLessonProgress = (slug: string, lessonId: number, watchedSeconds: number) =>
  apiClient.post(ENDPOINTS.enrollmentLessonProgress(slug, lessonId), {
    watched_seconds: watchedSeconds,
  });

export const fetchCertificate = (slug: string) =>
  apiClient.get<{ pdf_url: string; serial: string }>(ENDPOINTS.enrollmentCertificate(slug));

// ─── Auth (OTP) ───
export const sendOtp = (phone: string) =>
  apiClient.post<{ _dev_code?: string }>(ENDPOINTS.sendOtp, { phone });

export const submitAiBio = (data: AiBioPayload) =>
  apiClient.post(ENDPOINTS.meAiBio, data);

// ─── AI / Mira ───
export const fetchAiGreeting = () =>
  apiClient.get<AiGreetingResponse>(ENDPOINTS.meAiGreeting);

export const fetchAiMatches = () =>
  apiClient.get<{ matches: AiMatch[] }>(ENDPOINTS.meAiMatches);

export const fetchAiBio = () =>
  apiClient.get<{ profile: ClientAiProfile | null }>(ENDPOINTS.meAiBio);

export const updateAiPersona = (name: string | null) =>
  apiClient.patch<{ persona: { name: string } }>(ENDPOINTS.meAiPersona, { name });

// ─── Profile / Avatar ───
export const uploadAvatar = (formData: FormData) =>
  apiClient.post<{ avatar_url: string }>(ENDPOINTS.meAvatar, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// ─── Refunds ───
export const fetchRefundEligibility = (orderId: string) =>
  apiClient.get<RefundEligibility>(ENDPOINTS.refundEligibility(orderId));

export const requestRefund = (orderId: string, reason: string) =>
  apiClient.post(ENDPOINTS.meRefunds, { order_id: orderId, reason });

// ─── Chat (extended) ───
export const fetchChatSessionDetail = (id: string) =>
  apiClient.get<{ session: ChatSessionData }>(ENDPOINTS.chatSessionDetail(id));

export const pingChatPresence = (id: string) =>
  apiClient.post(ENDPOINTS.chatPresence(id));

export const sendSlotOffer = (
  id: string,
  slots: { start_utc: string; duration_min: number }[],
) =>
  apiClient.post<{ message: ChatMessageData }>(ENDPOINTS.chatSlotOffer(id), { slots });

export const bookSlot = (bookingChatId: string, slotStartUtc: string) =>
  apiClient.post<{ redirect_url: string }>(ENDPOINTS.bookings, {
    booking_chat_id: bookingChatId,
    slot_start_utc: slotStartUtc,
  });

// ─── Psychologist Self-Service ───
export const fetchMyPsychProfile = () =>
  apiClient.get<{ psychologist: ApiPsychologist }>(ENDPOINTS.mePsychologist);

export const updateMyPsychProfile = (data: Partial<ApiPsychologist>) =>
  apiClient.patch<{ psychologist: ApiPsychologist }>(ENDPOINTS.mePsychologist, data);

export const uploadDiploma = (formData: FormData) =>
  apiClient.post(ENDPOINTS.mePsychologistDiploma, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const uploadCertificates = (formData: FormData) =>
  apiClient.post(ENDPOINTS.mePsychologistCertificates, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const fetchMyAvailability = () =>
  apiClient.get<{ rules: import('../types').AvailabilityRule[] }>(ENDPOINTS.mePsychologistAvailability);

export const updateMyAvailability = (rules: import('../types').AvailabilityRule[]) =>
  apiClient.put(ENDPOINTS.mePsychologistAvailability, { rules });

export const fetchMyPsychCourses = (params?: Record<string, unknown>) =>
  apiClient.get<PaginatedResponse<CourseCard>>(ENDPOINTS.mePsychologistCourses, { params });

export const fetchWithdrawals = () =>
  apiClient.get<{ withdrawals: WithdrawalData[] }>(ENDPOINTS.mePsychologistWithdrawals);

export const requestWithdrawal = (data: {
  amount: number;
  iban: string;
  account_holder: string;
  bank: string;
}) => apiClient.post<{ withdrawal: WithdrawalData }>(ENDPOINTS.mePsychologistWithdrawals, data);

export const fetchVerificationStatus = () =>
  apiClient.get<{ verification: VerificationStatusData }>(ENDPOINTS.mePsychologistVerification);

// ─── Shared ───
export const fetchSpecializations = () =>
  apiClient.get<{ specializations: Specialization[] }>(ENDPOINTS.specializations);

export const fetchCountries = () =>
  apiClient.get<{ countries: Country[] }>(ENDPOINTS.countries);
