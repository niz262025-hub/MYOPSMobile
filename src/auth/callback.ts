export function validateMobileCallback(callback: string, expectedState?: string): { code: string; state: string } | null {
  let parsed: URL;
  try {
    parsed = new URL(callback);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'myops:' || parsed.hostname !== 'auth' || parsed.pathname !== '/callback') {
    return null;
  }

  const state = parsed.searchParams.get('state');
  const code = parsed.searchParams.get('code');

  if (!state || !code || !/^[A-Za-z0-9_-]{8,256}$/.test(state) || !/^[A-Za-z0-9_-]{32,256}$/.test(code)) {
    return null;
  }

  if (expectedState && state !== expectedState) {
    return null;
  }

  return { code, state };
}

export function isFreshPendingTransaction(createdAt: number, now = Date.now(), maxAgeMs = 300000): boolean {
  return Number.isFinite(createdAt) && Number.isFinite(now) && now >= createdAt && now - createdAt <= maxAgeMs;
}
