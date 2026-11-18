# MYOPS Mobile Central SSO — implementation contract

## Verified existing architecture
MYOPS Master uses a same-origin /api/auth backend-for-frontend and HttpOnly cookie sessions.
The existing web callback relies on a browser-bound PKCE verifier cookie. Mobile cannot
safely reuse that callback or extract its session cookie into the native application.

## Native design (NOT YET ACTIVE)
- Register a public native client for MYOPS Mobile.
- Implement Authorization Code + PKCE S256 on the central backend.
- Authorization endpoint must require exact client_id and redirect_uri, short-lived
  single-use code, state binding, PKCE challenge and trusted authenticated user.
- Open system browser authentication session (not WebView).
- Redirect URI: myops://auth/callback; prefer verified HTTPS app links for production.
- Exchange code over TLS with verifier; no client secret in mobile application.
- Rotate refresh tokens, detect reuse, revoke on logout and enforce expiry.
- Store refresh token in OS secure storage, access token in memory only.
- Validate session and app grants via server endpoints before showing any module.
- Fail closed on missing configuration, callback mismatch, expiry or offline access.
- Never include access/refresh tokens in deep links, logs, analytics or GitHub.
- Cross-app logout must be validated against the central session and all participating
  applications, not assumed from mobile local token deletion.

## Backend endpoints proposed
GET /api/mobile-auth/authorize
POST /api/mobile-auth/token
POST /api/mobile-auth/revoke
GET /api/mobile-auth/me

These paths are NOT confirmed deployed. Do not wire live login until implemented
with rate limits, CSRF/state protections, authorization checks and automated tests.

## Release gates
1. Central backend implementation and staging review.
2. Redirect registration, Android App Links and iOS Universal Links verification.
3. Real admin and normal-user login, tenant and subscription tests.
4. Refresh, revocation, logout, wrong state, expired code, replay and cross-tenant denial.
5. Android and iOS physical-device UAT.
