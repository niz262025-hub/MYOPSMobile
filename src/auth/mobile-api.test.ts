import test from 'node:test';
import assert from 'node:assert/strict';

import { validateMobileCallback } from './callback.ts';
import { computeAccessExpiry, isServerSessionPayload, parseTokenResponse, shouldRefreshAccessToken } from './token-state.ts';

test('response schema validation rejects malformed token payloads', () => {
  assert.throws(() => parseTokenResponse({ access_token: 'abc' }), /Malformed token response/);
  assert.throws(() => parseTokenResponse({ access_token: 'abc', refresh_token: 'refresh', expires_in: 0, token_type: 'Bearer' }), /Malformed token response/);
  assert.throws(() => parseTokenResponse({ access_token: 'abc', refresh_token: 'refresh', expires_in: 120, token_type: 'Basic' }), /Malformed token response/);
});

test('valid token payloads parse and carry expiry metadata', () => {
  const parsed = parseTokenResponse({ access_token: 'access-token', refresh_token: 'refresh-token', expires_in: 300, token_type: 'Bearer' });
  assert.deepEqual(parsed, { access_token: 'access-token', refresh_token: 'refresh-token', expires_in: 300, token_type: 'Bearer' });
  assert.equal(computeAccessExpiry(300, 1_700_000_000_000), 1_700_000_000_000 + 270_000);
});

test('server session payload validation rejects arrays and accepts objects', () => {
  assert.equal(isServerSessionPayload({ user: { id: 'u-1' } }), true);
  assert.equal(isServerSessionPayload([]), false);
  assert.equal(isServerSessionPayload(null), false);
});

test('token refresh gate watches expiry windows rather than trusting stale sessions', () => {
  assert.equal(shouldRefreshAccessToken(1_700_000_000_000, 1_700_000_000_000), true);
  assert.equal(shouldRefreshAccessToken(1_700_000_000_000 + 120_000, 1_700_000_000_000), false);
  assert.equal(shouldRefreshAccessToken(1_700_000_000_000, 1_700_000_000_000 - 30_000), true);
  assert.equal(shouldRefreshAccessToken(1_700_000_000_000, 1_700_000_000_000 - 31_000), false);
});

test('callback validation rejects malformed or mismatched deep-links', () => {
  const state = 'state-token';
  const code = 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz';

  assert.deepEqual(validateMobileCallback(`myops://auth/callback?state=${state}&code=${code}`), { state, code });
  assert.equal(validateMobileCallback('https://example.test/callback?state=test&code=abc'), null);
  assert.equal(validateMobileCallback('myops://wrong/callback?state=test&code=abc'), null);
  assert.equal(validateMobileCallback(`myops://auth/callback?code=${code}`), null);
  assert.equal(validateMobileCallback(`myops://auth/callback?state=${state}`), null);
  assert.equal(validateMobileCallback(`myops://auth/callback?state=other&code=${code}`), null);
  assert.equal(validateMobileCallback(`myops://auth/callback?state=${state}&code=bad`), null);
});
