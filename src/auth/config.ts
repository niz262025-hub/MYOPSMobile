// Mobile SSO is staging-only until production authorization is approved.
// Never silently fall back to production when a staging endpoint is unavailable.
export const CENTRAL_ORIGIN = 'https://southerndotcom-website-git-feat-mobi-f66adf-mohd-syaiful-nizam1.vercel.app';
export const MOBILE_CALLBACK = 'myops://auth/callback';
export const AUTH_ENDPOINTS = {
  authorize: CENTRAL_ORIGIN + '/api/mobile-auth/authorize',
  token: CENTRAL_ORIGIN + '/api/mobile-auth/token',
  revoke: CENTRAL_ORIGIN + '/api/mobile-auth/logout',
  refresh: CENTRAL_ORIGIN + '/api/mobile-auth/refresh',
  me: CENTRAL_ORIGIN + '/api/mobile-auth/me',
} as const;
