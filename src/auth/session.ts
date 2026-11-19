import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'myops.mobile.session.v1';
const LEGACY_REFRESH_KEY = 'myops.mobile.refresh.v1';

export type MobileIdentity = { userId: string; tenantId: string; roles: string[]; apps: string[] };
export type MobileSessionRecord = { refreshToken: string; accessExpiresAt: number };

function isValidSessionRecord(value: unknown): value is MobileSessionRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return typeof record.refreshToken === 'string' && record.refreshToken.length > 0 && Number.isFinite(record.accessExpiresAt);
}

export async function saveSessionMetadata(record: MobileSessionRecord): Promise<void> {
  if (!isValidSessionRecord(record)) throw new Error('Invalid session metadata');
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(record), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function getSessionMetadata(): Promise<MobileSessionRecord | null> {
  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!isValidSessionRecord(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveRefreshToken(token: string, accessExpiresAt = 0) {
  if (!token || token.length > 8192) throw new Error('Invalid refresh token');

  await Promise.all([
    SecureStore.setItemAsync(SESSION_KEY, JSON.stringify({ refreshToken: token, accessExpiresAt }), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    }),
    SecureStore.setItemAsync(LEGACY_REFRESH_KEY, token, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    }),
  ]);
}

export async function getRefreshToken() {
  const metadata = await getSessionMetadata();
  if (metadata?.refreshToken) return metadata.refreshToken;
  return SecureStore.getItemAsync(LEGACY_REFRESH_KEY);
}

export async function clearRefreshToken() {
  await Promise.all([
    SecureStore.deleteItemAsync(SESSION_KEY),
    SecureStore.deleteItemAsync(LEGACY_REFRESH_KEY),
  ]);
}

export function canOpenApp(identity: MobileIdentity | null, appId: string): boolean {
  return !!identity && identity.apps.includes(appId);
}

// Server must validate identity, active tenant, roles, entitlements and revocation.
// Client-side checks are only presentation controls, never authorization.
