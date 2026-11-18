export const CENTRAL_ORIGIN = 'https://www.myops.com.my';
export const MOBILE_CALLBACK = 'myops://auth/callback';
export const AUTH_ENDPOINTS = {
  authorize: CENTRAL_ORIGIN + '/api/mobile-auth/authorize',
  token: CENTRAL_ORIGIN + '/api/mobile-auth/token',
  revoke: CENTRAL_ORIGIN + '/api/mobile-auth/revoke',
  me: CENTRAL_ORIGIN + '/api/mobile-auth/me',
} as const;
// These endpoints are a proposed contract, NOT existing production endpoints.
// Do not enable sign-in until the central backend implements and tests them.
