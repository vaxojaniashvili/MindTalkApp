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
  locale?: string;
}) => apiClient.post<{ user: ApiUser; token: string }>(ENDPOINTS.register, data);

// ─── User ───
export const fetchMe = () => apiClient.get<{ data: ApiUser }>(ENDPOINTS.me);

export const updateProfile = (data: Partial<ApiProfile>) =>
  apiClient.patch<{ data: ApiProfile }>(ENDPOINTS.meProfile, data);

export const fetchNotifications = () =>
  apiClient.get<{ data: AppNotification[] }>(ENDPOINTS.meNotifications);

// ─── Psychologists ───
export const fetchPsychologists = (params?: Record<string, unknown>) =>
  apiClient.get<PaginatedResponse<PsychCard>>(ENDPOINTS.psychologists, { params });

export const fetchPsychologistDetail = (slug: string) =>
  apiClient.get<{ data: PsychDetail }>(ENDPOINTS.psychologistDetail(slug));

export const fetchPsychologistReviews = (slug: string, page = 1) =>
  apiClient.get<PaginatedResponse<Review>>(ENDPOINTS.psychologistReviews(slug), {
    params: { page },
  });

export const fetchSubscriptionPlans = (slug: string) =>
  apiClient.get<{ data: SubscriptionPlan[] }>(ENDPOINTS.psychologistPlans(slug));

// ─── Courses ───
export const fetchCourses = (params?: Record<string, unknown>) =>
  apiClient.get<PaginatedResponse<CourseCard>>(ENDPOINTS.courses, { params });

export const fetchCourseDetail = (slug: string) =>
  apiClient.get<{ data: CourseDetail }>(ENDPOINTS.courseDetail(slug));

// ─── Dashboard ───
export const fetchConsultations = () =>
  apiClient.get<{ data: ApiConsultation[] }>(ENDPOINTS.meConsultations);

export const fetchChatSessions = () =>
  apiClient.get<{ data: ChatSessionData[] }>(ENDPOINTS.meChatSessions);

export const fetchMyEnrollments = () =>
  apiClient.get<{ data: EnrollmentCard[] }>(ENDPOINTS.meCourses);

// ─── Shared ───
export const fetchSpecializations = () =>
  apiClient.get<{ data: Specialization[] }>(ENDPOINTS.specializations);

export const fetchCountries = () =>
  apiClient.get<{ data: Country[] }>(ENDPOINTS.countries);
