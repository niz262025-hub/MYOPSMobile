# MYOPS Mobile

Independent React Native + Expo app for Android and iOS.

## Status
Foundation scaffold only. The dashboard is intentionally read-only; authentication and entitlements are not implemented yet. Do not publish to app stores or represent as production-ready.

## Run
```sh
npm install
npx expo start
npm run typecheck
```

## SSO next steps
- Inspect MYOPS Master identity provider and implement native Authorization Code + PKCE.
- Register an exact allowlisted native callback URI.
- Verify state and tokens, secure credential storage, refresh and global logout.
- Fetch role, tenant membership and subscriptions from a trusted backend; enforce authorization server-side.
- Verify production module URLs, test Android/iOS devices and sign builds.

Do not place secrets, session cookies or production tokens in this repository.
