import * as SecureStore from 'expo-secure-store';
const KEY = 'myops.mobile.refresh.v1';
export type MobileIdentity = { userId: string; tenantId: string; roles: string[]; apps: string[] };
export async function saveRefreshToken(token: string) {
  if (!token || token.length > 8192) throw new Error('Invalid refresh token');
  await SecureStore.setItemAsync(KEY, token, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
}
export async function getRefreshToken() { return SecureStore.getItemAsync(KEY); }
export async function clearRefreshToken() { await SecureStore.deleteItemAsync(KEY); }
export function canOpenApp(identity: MobileIdentity | null, appId: string): boolean {
  return !!identity && identity.apps.includes(appId);
}
// Server must validate identity, active tenant, roles, entitlements and revocation.
// Client-side checks are only presentation controls, never authorization.
