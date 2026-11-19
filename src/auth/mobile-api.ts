import { AUTH_ENDPOINTS, MOBILE_CLIENT_ID } from './config';
import { clearRefreshToken, getRefreshToken, getSessionMetadata, saveRefreshToken } from './session';

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: 'Bearer';
};

export function computeAccessExpiry(expiresIn: number, now = Date.now()): number {
  if (!Number.isFinite(expiresIn) || expiresIn <= 0) throw new Error('Invalid token expiry');
  return now + Math.max(0, expiresIn - 30) * 1000;
}

export function parseTokenResponse(payload: unknown): TokenResponse {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Malformed token response');
  }

  const candidate = payload as Record<string, unknown>;
  const accessToken = candidate.access_token;
  const refreshToken = candidate.refresh_token;
  const expiresIn = candidate.expires_in;
  const tokenType = candidate.token_type;

  if (typeof accessToken !== 'string' || accessToken.length === 0) {
    throw new Error('Malformed token response');
  }
  if (typeof refreshToken !== 'string' || refreshToken.length === 0) {
    throw new Error('Malformed token response');
  }
  if (!Number.isFinite(expiresIn) || Number(expiresIn) <= 0) {
    throw new Error('Malformed token response');
  }
  if (tokenType !== 'Bearer') {
    throw new Error('Malformed token response');
  }

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: Number(expiresIn),
    token_type: 'Bearer',
  };
}

let accessToken: string | null = null;
let accessExpiresAt = 0;
let refreshInFlight: Promise<string | null> | null = null;

const post = async (url: string, body: object, authorization?: string, method = 'POST') => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authorization) headers.Authorization = `Bearer ${authorization}`;
  return fetch(url, {
    method,
    headers,
    body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
  });
};

async function validateSessionWithServer(token: string): Promise<boolean> {
  if (!token) return false;

  try {
    const response = await post(AUTH_ENDPOINTS.me, {}, token, 'POST');
    if (!response.ok) return false;
    const payload = await response.json();
    return !!payload && typeof payload === 'object' && !Array.isArray(payload);
  } catch {
    return false;
  }
}

export function setMobileTokens(tokens: TokenResponse | unknown): Promise<string> {
  const parsed = parseTokenResponse(tokens);
  accessToken = parsed.access_token;
  accessExpiresAt = computeAccessExpiry(parsed.expires_in);
  return saveRefreshToken(parsed.refresh_token, accessExpiresAt).then(() => accessToken as string);
}

async function performRefresh(): Promise<string | null> {
  const saved = await getRefreshToken();
  if (!saved) return null;

  try {
    const response = await post(AUTH_ENDPOINTS.refresh, { client_id: MOBILE_CLIENT_ID, refresh_token: saved });
    if (!response.ok) {
      await clearMobileSession();
      return null;
    }

    const payload = parseTokenResponse(await response.json());
    await setMobileTokens(payload);
    return accessToken;
  } catch {
    await clearMobileSession();
    return null;
  }
}

export function refreshMobileSession(): Promise<string | null> {
  if (accessToken && Date.now() < accessExpiresAt) {
    return Promise.resolve(accessToken);
  }

  if (!refreshInFlight) {
    const attempt = performRefresh();
    refreshInFlight = attempt;
    void attempt.finally(() => {
      if (refreshInFlight === attempt) refreshInFlight = null;
    });
  }

  return refreshInFlight;
}

export async function bootstrapMobileSession(): Promise<boolean> {
  const session = await getSessionMetadata();
  if (!session?.refreshToken) return false;

  if (accessToken && Date.now() < accessExpiresAt) {
    const valid = await validateSessionWithServer(accessToken);
    if (valid) return true;
  }

  const refreshed = await refreshMobileSession();
  if (!refreshed) {
    await clearMobileSession();
    return false;
  }

  const valid = await validateSessionWithServer(refreshed);
  if (!valid) {
    await clearMobileSession();
    return false;
  }

  return true;
}

export async function getMobileAccessToken(): Promise<string | null> {
  if (accessToken && Date.now() < accessExpiresAt) return accessToken;
  return refreshMobileSession();
}

export async function logoutMobileSession(): Promise<void> {
  const saved = await getRefreshToken();
  try {
    if (accessToken) {
      await post(AUTH_ENDPOINTS.revoke, {}, accessToken);
      return;
    }
    if (saved) {
      await post(AUTH_ENDPOINTS.revoke, { client_id: MOBILE_CLIENT_ID, refresh_token: saved });
    }
  } finally {
    await clearMobileSession();
  }
}

export async function clearMobileSession() {
  accessToken = null;
  accessExpiresAt = 0;
  refreshInFlight = null;
  await clearRefreshToken();
}
