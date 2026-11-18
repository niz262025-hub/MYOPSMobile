export const CENTRAL_ORIGIN = 'https://www.myops.com.my';
export const MOBILE_CALLBACK = 'myops://auth/callback';
export const AUTH_ENDPOINTS = {
  authorize: CENTRAL_ORIGIN + '/api/mobile-auth/authorize',
  token: CENTRAL_ORIGIN + '/api/mobile-auth/token',
  revoke: CENTRAL_ORIGIN + '/api/mobile-auth/logout',
  refresh: CENTRAL_ORIGIN + '/api/mobile-auth/refresh',
  me: CENTRAL_ORIGIN + '/api/mobile-auth/me',
} as const;
// Backend endpoints are in a draft PR; not yet deployed or approved for production.
