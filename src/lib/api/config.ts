// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_URL || '',
  VERSION: process.env.NEXT_PUBLIC_API_VERSION || 'v1',
  TIMEOUT: 30000, // 30 seconds - increased for better network resilience
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/users/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    VERIFY: '/auth/verify',
  },
  
  // Users
  USERS: {
    PROFILE: '/users/profile',
    UPDATE: '/users/update',
    CREATE: '/users/create',
    LIST: '/users',
    CONSORTIA: '/users/:userId/consortia',
    VERIFY_OTP: '/users/verify-otp',
    FORGOT_PASSWORD: '/users/forgot-password',
    UPDATE_PASSWORD: '/users/update-password',
  },

  // Consortia
  CONSORTIA: {
    CREATE: '/consortia/create',
    LIST: '/consortia',
    GET: '/consortia/:id',
    UPDATE: '/consortia/:id',
    DELETE: '/consortia/:id',
    ADD_ORGANIZATION: '/consortia/add-organization',
    REMOVE_ORGANIZATION: '/consortia/remove-organization',
  },

  // Meetings
  MEETINGS: {
    CREATE: '/meetings/create',
    LIST: '/meetings',
    GET: '/meetings/:id',
    UPDATE: '/meetings/:id',
    DELETE: '/meetings/:id',
    ATTENDEE: '/meetings/attendee/:userId',
  },

  // Action Items
  ACTIONITEMS: {
    CREATE: '/actionitem/create',
  },

  // Risks
  RISKS: {
    CREATE: '/risk/create',
  },

  // Dashboard
  DASHBOARD: {
    STATS: '/dashboard',
    FACILITATOR_STATS: '/dashboard/facilitator',
  },

  // Admin Dashboard
  ADMIN_DASHBOARD: {
    FULL: '/admin-dashboard/admin/:adminId',
    SUMMARY: '/admin-dashboard/admin/:adminId/summary',
  },

  // Facilitator Dashboard
  FACILITATOR_DASHBOARD: {
    FULL: '/facilitator-dashboard/facilitator/:facilitatorId',
    SUMMARY: '/facilitator-dashboard/facilitator/:facilitatorId/summary',
  },

  // Mitigation Tracking
  MITIGATION_TRACKING: {
    UPSERT: '/mitigation-tracking/upsert',
    BY_RISK: '/mitigation-tracking/risk/:riskId',
    BY_ORGANIZATION: '/mitigation-tracking/organization/:organizationId',
    STATS_CONSORTIUM: '/mitigation-tracking/stats/consortium/:consortiumId',
    STATS_CONSORTIA: '/mitigation-tracking/stats/consortia',
    ALL: '/mitigation-tracking',
  },

  // Organization User Dashboard
  ORGANIZATION_USER_DASHBOARD: {
    FULL: '/dashboard/organization-user/:organizationUserId',
    SUMMARY: '/dashboard/organization-user/:organizationUserId/summary',
  },

  // In-App Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: '/notifications/:id/read',
    MARK_ALL_READ: '/notifications/read-all',
    DELETE: '/notifications/:id',
  },
};

// Helper function to build full API URL
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}/api/${API_CONFIG.VERSION}${endpoint}`;
}; 