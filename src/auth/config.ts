// Mobile SSO is staging-only until production authorization is approved.
// Never silently fall back to production when a staging endpoint is unavailable.
export function normalizeAuthBaseUrl(rawUrl: string | undefined): string {
  const value = rawUrl?.trim();
  if (!value) {
    if (process.env.NODE_ENV === 'test') return 'https://example.test';
    throw new Error('Missing EXPO_PUBLIC_MYOPS_AUTH_BASE_URL');
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('Invalid EXPO_PUBLIC_MYOPS_AUTH_BASE_URL');
  }

  if (url.username || url.password) {
    throw new Error('EXPO_PUBLIC_MYOPS_AUTH_BASE_URL must not include credentials');
  }

  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && url.hostname === 'localhost')) {
    throw new Error('EXPO_PUBLIC_MYOPS_AUTH_BASE_URL must use HTTPS or localhost');
  }

  const normalized = `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
  if (!normalized || normalized === 'https://' || normalized === 'http://') {
    throw new Error('EXPO_PUBLIC_MYOPS_AUTH_BASE_URL must include the host');
  }

  return normalized;
}

export function getAuthBaseUrl(): string {
  return normalizeAuthBaseUrl(process.env.EXPO_PUBLIC_MYOPS_AUTH_BASE_URL);
}

export const CENTRAL_ORIGIN = getAuthBaseUrl();
export const MOBILE_CLIENT_ID = 'myopsmobile';
export const MOBILE_CALLBACK = 'myops://auth/callback';
export const AUTH_ENDPOINTS = {
  authorize: `${CENTRAL_ORIGIN}/api/mobile-auth/authorize`,
  token: `${CENTRAL_ORIGIN}/api/mobile-auth/token`,
  revoke: `${CENTRAL_ORIGIN}/api/mobile-auth/logout`,
  refresh: `${CENTRAL_ORIGIN}/api/mobile-auth/refresh`,
  me: `${CENTRAL_ORIGIN}/api/mobile-auth/me`,
} as const;

export function mobileAuthorizationUrl(challenge: string, state: string): string {
  const params = new URLSearchParams({
    client_id: MOBILE_CLIENT_ID,
    redirect_uri: MOBILE_CALLBACK,
    response_type: 'code',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
  });
  return `${AUTH_ENDPOINTS.authorize}?${params}`;
}
