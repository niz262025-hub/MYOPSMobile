import * as SecureStore from 'expo-secure-store';
import { Linking } from 'react-native';

import { AUTH_ENDPOINTS, MOBILE_CALLBACK, MOBILE_CLIENT_ID, mobileAuthorizationUrl } from './config';
import { isFreshPendingTransaction, validateMobileCallback } from './callback';
import { setMobileTokens } from './mobile-api';
import { createChallenge, createState, createVerifier } from './pkce';

const PENDING_KEY = 'myops.mobile.pkce.pending.v1';

type PendingLogin = {
  state: string;
  verifier: string;
  resolve: () => void;
  reject: (error: Error) => void;
  subscription: { remove: () => void };
};

let pending: PendingLogin | null = null;
let callbackInProgress = false;

async function exchangeAuthorizationCode(code: string, verifier: string) {
  const response = await fetch(AUTH_ENDPOINTS.token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: MOBILE_CLIENT_ID,
      redirect_uri: MOBILE_CALLBACK,
      code,
      code_verifier: verifier,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token exchange rejected (${response.status})`);
  }

  const payload = await response.json();
  await setMobileTokens(payload);
}

export function cancelMobileLogin() {
  if (!pending) return;
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
  await SecureStore.setItemAsync(
    PENDING_KEY,
    JSON.stringify({ state, verifier, createdAt: Date.now() }),
    { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY },
  );

  return new Promise<void>((resolve, reject) => {
    const subscription = Linking.addEventListener('url', ({ url: callback }) => { void handleMobileCallback(callback); });
    pending = { state, verifier, resolve, reject, subscription };

    const timeout = setTimeout(() => {
      if (pending?.state === state) cancelMobileLogin();
    }, 5 * 60 * 1000);
    pending.resolve = () => { clearTimeout(timeout); resolve(); };
    pending.reject = (error) => { clearTimeout(timeout); reject(error); };
    void Linking.openURL(mobileAuthorizationUrl(challenge, state)).catch(() => {
      if (pending?.state === state) cancelMobileLogin();
    });
  });
}

export async function handleMobileCallback(callback: string): Promise<void> {
  if (callbackInProgress) return;

  const parsed = validateMobileCallback(callback);
  if (!parsed) return;

  callbackInProgress = true;

  try {
    const current = pending;
    if (!current) {
      const saved = await SecureStore.getItemAsync(PENDING_KEY);
      if (!saved) return;

      try {
        const value = JSON.parse(saved);
        if (typeof value.state !== 'string' || typeof value.verifier !== 'string' || !isFreshPendingTransaction(value.createdAt)) {
          return;
        }
        pending = { ...value, resolve: () => undefined, reject: () => undefined, subscription: { remove: () => undefined } };
      } catch {
        return;
      }
    }

    const active = pending;
    if (!active) return;

    if (parsed.state !== active.state) return;

    pending = null;
    active.subscription.remove();
    await SecureStore.deleteItemAsync(PENDING_KEY);

    if (!parsed.code || !/^[A-Za-z0-9_-]{32,256}$/.test(parsed.code)) {
      active.reject(new Error('Missing authorization code'));
      return;
    }

    try {
      await exchangeAuthorizationCode(parsed.code, active.verifier);
      active.resolve();
    } catch (error) {
      active.reject(error instanceof Error ? error : new Error('Mobile login failed'));
    }
  } finally {
    callbackInProgress = false;
  }
}

