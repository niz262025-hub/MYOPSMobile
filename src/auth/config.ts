// Mobile SSO is staging-only until production authorization is approved.
// Never silently fall back to production when a staging endpoint is unavailable.
const DEFAULT_CENTRAL_ORIGIN = 'https://southerndotcom-website-git-feat-mobile-authorization-code.vercel.app';

function resolveCentralOrigin(): string {
  const candidate = (process.env.EXPO_PUBLIC_MYOPS_CENTRAL_ORIGIN ?? process.env.MYOPS_CENTRAL_ORIGIN ?? DEFAULT_CENTRAL_ORIGIN).trim();
  if (!candidate) throw new Error('MYOPS central origin is required for mobile login');

  try {
    const url = new URL(candidate);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Unsupported protocol for MYOPS central origin');
    }
    return url.origin.replace(/\/+$/, '');
  } catch {
    throw new Error('Invalid MYOPS central origin configuration');
  }
}

export const CENTRAL_ORIGIN = resolveCentralOrigin();
export const MOBILE_CALLBACK = 'myops://auth/callback';
export const AUTH_ENDPOINTS = {
  authorize: CENTRAL_ORIGIN + '/api/mobile-auth/authorize',
  token: CENTRAL_ORIGIN + '/api/mobile-auth/token',
  revoke: CENTRAL_ORIGIN + '/api/mobile-auth/logout',
  refresh: CENTRAL_ORIGIN + '/api/mobile-auth/refresh',
  me: CENTRAL_ORIGIN + '/api/mobile-auth/me',
} as const;
