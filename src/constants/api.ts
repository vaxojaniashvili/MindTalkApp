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
  // User
  me: '/me',
  meProfile: '/me/profile',
  meNotifications: '/me/notifications',
  meConsultations: '/me/consultations',
  meChatSessions: '/me/chat/sessions',
  meSubscriptions: '/me/subscriptions',
  meCourses: '/me/courses',
  // Public
  psychologists: '/psychologists',
  courses: '/courses',
  specializations: '/specializations',
  countries: '/countries',
  // Dynamic
  psychologistDetail: (slug: string) => `/psychologists/${slug}`,
  psychologistReviews: (slug: string) => `/psychologists/${slug}/reviews`,
  psychologistPlans: (slug: string) => `/psychologists/${slug}/subscription-plans`,
  courseDetail: (slug: string) => `/courses/${slug}`,
};
