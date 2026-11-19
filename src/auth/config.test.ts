import test from 'node:test';
import assert from 'node:assert/strict';

const loadConfig = async () => import(`./config.ts?ts=${Date.now()}-${Math.random().toString(16).slice(2)}`);
const loadCallback = async () => import(`./callback.ts?ts=${Date.now()}-${Math.random().toString(16).slice(2)}`);
const { createChallenge, createState, createVerifier } = await import('./pkce-logic.ts');

test('normalizeAuthBaseUrl accepts a valid staging HTTPS origin', async () => {
  process.env.EXPO_PUBLIC_MYOPS_AUTH_BASE_URL = 'https://staging.myops.example.com/';
  const { normalizeAuthBaseUrl } = await loadConfig();
  assert.equal(normalizeAuthBaseUrl('https://staging.myops.example.com/'), 'https://staging.myops.example.com');
});

test('normalizeAuthBaseUrl rejects ambiguous or credentialed values', async () => {
  process.env.EXPO_PUBLIC_MYOPS_AUTH_BASE_URL = 'https://staging.myops.example.com';
  const { normalizeAuthBaseUrl } = await loadConfig();
  assert.throws(() => normalizeAuthBaseUrl('https://user:pass@staging.myops.example.com'), /credentials/i);
  assert.throws(() => normalizeAuthBaseUrl('ftp://staging.myops.example.com'), /HTTPS or localhost/i);
});

test('PKCE verifier and challenge are valid and deterministic enough for the contract', async () => {
  const verifier = createVerifier();
  assert.match(verifier, /^[A-Za-z0-9_-]+$/);
  assert.ok(verifier.length >= 32);

  const challenge = await createChallenge(verifier);
  assert.match(challenge, /^[A-Za-z0-9_-]+$/);
  assert.ok(challenge.length > 32);
  assert.notEqual(challenge, verifier);
});

test('state values are generated as secure random tokens', () => {
  const first = createState();
  const second = createState();
  assert.match(first, /^[A-Za-z0-9_-]+$/);
  assert.match(second, /^[A-Za-z0-9_-]+$/);
  assert.notEqual(first, second);
});

test('validateMobileCallback accepts the exact MYOPS mobile callback contract', async () => {
  const { validateMobileCallback } = await loadCallback();
  const state = createState();
  const code = 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz';
  const callback = `myops://auth/callback?state=${state}&code=${code}`;

  assert.deepEqual(validateMobileCallback(callback), { state, code });
});

test('validateMobileCallback rejects malformed URLs, wrong route, and inconsistent state', async () => {
  const { validateMobileCallback } = await loadCallback();
  const state = createState();
  const code = 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz';

  assert.equal(validateMobileCallback('https://example.test/callback?state=test&code=abc'), null);
  assert.equal(validateMobileCallback('myops://wrong/callback?state=test&code=abc'), null);
  assert.equal(validateMobileCallback(`myops://auth/callback?code=${code}`), null);
  assert.equal(validateMobileCallback(`myops://auth/callback?state=${state}`), null);
  assert.equal(validateMobileCallback(`myops://auth/callback?state=other&code=${code}`), null);
  assert.equal(validateMobileCallback(`myops://auth/callback?state=${state}&code=bad`), null);
  assert.equal(validateMobileCallback(`myops://auth/callback?state=wrong&code=${code}`, state), null);
});
