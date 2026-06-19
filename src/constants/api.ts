import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const API_BASE_URL: string = extra.apiUrl || 'https://admin.mindtalk.ge/api/v1';

export const PUSHER_CONFIG = {
  appKey: extra.reverbAppKey || '',
  host: extra.reverbHost || '',
  port: Number(extra.reverbPort) || 443,
  scheme: (extra.reverbScheme || 'https') as 'http' | 'https',
};

export const ENDPOINTS = {
  // Auth
  login: '/auth/login',
  register: '/auth/register',
  sendOtp: '/auth/phone/send-otp',
  // User
  me: '/me',
  meProfile: '/me/profile',
  meNotifications: '/me/notifications',
  meConsultations: '/me/consultations',
  meChatSessions: '/me/chat/sessions',
  meSubscriptions: '/me/subscriptions',
  meCourses: '/me/courses',
  meWallet: '/me/wallet',
  meWalletTopup: '/me/wallet/topup',
  meAvatar: '/me/avatar',
  meEnrollments: '/me/enrollments',
  // AI / Mira
  meAiBio: '/me/ai-bio',
  meAiGreeting: '/me/ai-greeting',
  meAiMatches: '/me/ai-matches',
  meAiPersona: '/me/ai-persona',
  // Notifications actions
  meNotificationsUnreadCount: '/me/notifications/unread-count',
  meNotificationsReadAll: '/me/notifications/read-all',
  // Refunds
  meRefunds: '/me/refunds',
  // Chat unread
  meChatUnreadCount: '/me/chat/unread-count',
  // Psychologist self-service
  mePsychologist: '/me/psychologist',
  mePsychologistDiploma: '/me/psychologist/diploma',
  mePsychologistCertificates: '/me/psychologist/certificates',
  mePsychologistAvailability: '/me/psychologist/availability',
  mePsychologistCourses: '/me/psychologist/courses',
  mePsychologistWithdrawals: '/me/psychologist/withdrawals',
  mePsychologistVerification: '/me/psychologist/verification',
  // Public
  psychologists: '/psychologists',
  courses: '/courses',
  specializations: '/specializations',
  countries: '/countries',
  bookings: '/bookings',
  // Dynamic
  psychologistDetail: (slug: string) => `/psychologists/${slug}`,
  psychologistReviews: (slug: string) => `/psychologists/${slug}/reviews`,
  psychologistPlans: (slug: string) => `/psychologists/${slug}/subscription-plans`,
  psychologistSlots: (slug: string) => `/psychologists/${slug}/slots`,
  psychologistReviewEligibility: (slug: string) =>
    `/psychologists/${slug}/review-eligibility`,
  reviewReply: (id: string) => `/reviews/${id}/reply`,
  notificationRead: (id: string) => `/me/notifications/${id}/read`,
  notificationDelete: (id: string) => `/me/notifications/${id}`,
  refundEligibility: (orderId: string) => `/me/refunds/eligibility/${orderId}`,
  chatSessionDetail: (id: string) => `/me/chat/sessions/${id}`,
  chatPresence: (id: string) => `/me/chat/sessions/${id}/presence`,
  chatSlotOffer: (id: string) => `/me/chat/sessions/${id}/slot-offer`,
  courseDetail: (slug: string) => `/courses/${slug}`,
  consultationCancelPreview: (id: string) => `/consultations/${id}/cancel-preview`,
  consultationCancel: (id: string) => `/consultations/${id}/cancel`,
  enrollmentPlayer: (slug: string) => `/me/enrollments/${slug}`,
  enrollmentLessonProgress: (slug: string, lessonId: number) =>
    `/me/enrollments/${slug}/lessons/${lessonId}/progress`,
  enrollmentCertificate: (slug: string) => `/me/enrollments/${slug}/certificate`,
};
