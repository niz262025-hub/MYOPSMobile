import { Linking } from 'react-native';
import * as SecureStore from 'expo-secure-store';
const PENDING_KEY='myops.mobile.pkce.pending.v1';
const PKCE_TTL_MS = 120000;
import { AUTH_ENDPOINTS, MOBILE_CALLBACK } from './config';
import { createChallenge, createState, createVerifier } from './pkce';
import { setMobileTokens } from './mobile-api';

type PendingLogin = {
  state: string;
  verifier: string;
  createdAt: number;
  resolve: () => void;
  reject: (error: Error) => void;
  subscription: { remove: () => void };
};

let pending: PendingLogin | null = null;
let callbackInProgress = false;

function isValidPendingRecord(value: unknown): value is { state: string; verifier: string; createdAt: number } {
  return !!value && typeof value === 'object' && typeof (value as { state?: unknown }).state === 'string' && typeof (value as { verifier?: unknown }).verifier === 'string' && Number.isFinite((value as { createdAt?: unknown }).createdAt);
}

function restorePendingFromStore(): PendingLogin | null {
  const saved = SecureStore.getItemAsync(PENDING_KEY);
  if (!saved) return null;
  void saved.then(raw => {
    if (!raw) return;
    try {
      const value = JSON.parse(raw);
      if (!isValidPendingRecord(value)) return;
      if (Date.now() - value.createdAt > PKCE_TTL_MS) return;
      pending = { ...value, resolve: () => {}, reject: () => {}, subscription: { remove: () => {} } };
    } catch {
      // fail closed on malformed PKCE state
    }
  });
  return null;
}

export function cancelMobileLogin() {
 if(!pending) return;
 const current = pending;
 pending = null;
 current.subscription.remove();
 void SecureStore.deleteItemAsync(PENDING_KEY);
 current.reject(new Error('Login cancelled'));
}

export async function startMobileLogin(): Promise<void> {
 if (pending) throw new Error('Login already in progress');
 const verifier = createVerifier();
 const state = createState();
 const challenge = await createChallenge(verifier);
 const url = new URL(AUTH_ENDPOINTS.authorize);
 url.searchParams.set('response_type', 'code');
 url.searchParams.set('client_id', 'myopsmobile');
 url.searchParams.set('redirect_uri', MOBILE_CALLBACK);
 url.searchParams.set('code_challenge_method', 'S256');
 url.searchParams.set('code_challenge', challenge);
 url.searchParams.set('state', state);
 await SecureStore.setItemAsync(PENDING_KEY, JSON.stringify({ state, verifier, createdAt: Date.now() }), { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
 return new Promise<void>((resolve, reject) => {
  const subscription = Linking.addEventListener('url', ({ url: callback }) => { void handleMobileCallback(callback); });
  pending = { state, verifier, createdAt: Date.now(), resolve, reject, subscription };
  Linking.openURL(url.toString()).catch(error => {
   if (pending?.state === state) cancelMobileLogin();
   reject(error instanceof Error ? error : new Error('Unable to open login browser'));
  });
 });
}

export async function handleMobileCallback(callback: string): Promise<void> {
 if (callbackInProgress) return;
 let parsed: URL;
 try {
  parsed = new URL(callback);
 } catch {
  return;
 }
 if (parsed.protocol !== 'myops:' || parsed.hostname !== 'auth' || parsed.pathname !== '/callback') return;

 callbackInProgress = true;
 try {
  const current = pending;
  if (!current) {
   // Cold-start callback: restore the short-lived PKCE transaction from secure storage.
   const saved = await SecureStore.getItemAsync(PENDING_KEY);
   if (!saved) return;
   try {
    const value = JSON.parse(saved);
    if (!isValidPendingRecord(value) || Date.now() - value.createdAt > PKCE_TTL_MS) return;
    pending = { ...value, resolve: () => {}, reject: () => {}, subscription: { remove: () => {} } };
   } catch {
    return;
   }
  }

  const active = pending;
  if (!active) return;
  pending = null;
  active.subscription.remove();
  await SecureStore.deleteItemAsync(PENDING_KEY);

  const state = parsed.searchParams.get('state');
  if (!state || state !== active.state) {
   active.reject(new Error('Login state mismatch'));
   return;
  }

  const code = parsed.searchParams.get('code');
  if (!code || !/^[A-Za-z0-9_-]{32,256}$/.test(code)) {
   active.reject(new Error('Missing authorization code'));
   return;
  }

  try {
   const response = await fetch(AUTH_ENDPOINTS.token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: 'myopsmobile',
      redirect_uri: MOBILE_CALLBACK,
      code,
      code_verifier: active.verifier,
    }),
   });
   if (!response.ok) throw new Error('Token exchange rejected');
   await setMobileTokens(await response.json());
   active.resolve();
  } catch (error) {
   active.reject(error instanceof Error ? error : new Error('Mobile login failed'));
  }
 } finally {
  callbackInProgress = false;
 }
}

void restorePendingFromStore();
