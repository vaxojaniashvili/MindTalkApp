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
} from '../types';

// ─── Auth ───
export const loginApi = (email: string, password: string) =>
  apiClient.post<{ user: ApiUser; token: string }>(ENDPOINTS.login, { email, password });

export const registerApi = (data: {
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
  apiClient.get<PaginatedResponse<Review>>(ENDPOINTS.psychologistReviews(slug), {
    params: { page },
  });

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

// ─── Shared ───
export const fetchSpecializations = () =>
  apiClient.get<{ specializations: Specialization[] }>(ENDPOINTS.specializations);

export const fetchCountries = () =>
  apiClient.get<{ countries: Country[] }>(ENDPOINTS.countries);
