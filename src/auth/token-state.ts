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

export function isServerSessionPayload(payload: unknown): boolean {
  return !!payload && typeof payload === 'object' && !Array.isArray(payload);
}

export function shouldRefreshAccessToken(accessExpiresAt: number, now = Date.now()): boolean {
  return !Number.isFinite(accessExpiresAt) || now >= accessExpiresAt - 30_000;
}
