# sponsor-outreach

HackPSU Sponsor Outreach: an internal dashboard for HackPSU organizers. This is
not the external sponsor portal.

Built with Next.js 16 (App Router, TypeScript, Tailwind CSS) and
[`@hackpsu/react-sdk`](https://github.com/Hack-PSU/apiv3/tree/main/packages/react-sdk)
for HackPSU SSO. Every page requires the `TEAM` role, the same as the admin app.

## Requirements

- Node.js 24 LTS (see `.nvmrc`; `nvm use` picks it up). `package.json` requires `>=24`.
- npm (ships with Node).

## Local setup

```bash
nvm use
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

Open http://localhost:3000.

### Package registry

HackPSU packages are published to Google Artifact Registry, not npmjs.org. The
committed `.npmrc` routes the `@hackpsu` scope there:

```
@hackpsu:registry=https://us-east4-npm.pkg.dev/hackpsu-408118/npm/
```

The registry allows public reads, so no login or token is needed. Do not add an
`always-auth` line; that would force authentication on install.

`npm install` may warn that `@firebase/util` and `protobufjs` have install
scripts that were not run. Neither is needed for this app.

### Environment variables

Put these in `.env.local`. It is git-ignored; never commit real values. Get them
from the HackPSU tech team.

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | yes | Firebase web config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | yes | |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | yes | |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | yes | |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | yes | |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | yes | |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | no | |
| `NEXT_PUBLIC_BASE_URL_V3` | yes | HackPSU API v3 base URL, passed to the SDK as `apiBaseUrl` |
| `NEXT_PUBLIC_AUTH_SERVICE_URL` | no | SSO service, defaults to `https://auth.hackpsu.org` |

`NEXT_PUBLIC_*` values are inlined into the browser bundle at build time, so
they are public by design. Restart `npm run dev` after changing them, and rebuild
for production.

If a required value is missing or a URL is malformed, the app shows a
"Configuration required" screen instead of loading the SDK. In development it
lists the variable names.

### Testing sign-in

Real SSO testing needs the team's Firebase configuration, and the auth service
must accept your local origin (for example `http://localhost:3000`) as a
`returnTo` URL. Ask the tech team to allow it if sign-in redirects fail. There is
no development auth bypass.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generates Next.js route types, then runs `tsc --noEmit` |

CI (`.github/workflows/ci.yml`) runs `npm ci`, lint, typecheck and build on
pushes to `main` and on pull requests. It needs no secrets.

## How auth is wired

- `src/lib/hackpsu-config.ts` reads each environment variable explicitly and
  builds the SDK config: `minimumRole: Role.TEAM` and `posthog: false` (SDK
  analytics off). The SDK never reads `process.env` itself.
- `src/components/auth-provider.tsx` renders `HackPSUProvider` with
  `guard={false}` and an explicit `<AuthGuard minimumRole={Role.TEAM}>`, so the
  app is guarded once. The SDK handles the SSO redirect, Firebase sign-in,
  loading screen and "Access Denied" screen.
- `src/app/layout.tsx` wraps every page in that provider, so new pages inherit
  the guard.
- The SDK mounts only in the browser. It initializes Firebase during render,
  which Next.js Cache Components rejects during prerendering, and the session is
  browser-only anyway.

Use `useFirebase()` from `@hackpsu/react-sdk` in client components for the
current user, `getIdToken()` and `logout()`. The SDK also exports typed API
hooks such as `useHackathonGetActive`.

## Adding dashboard features

- Pages go in `src/app/` (for example `src/app/sponsors/page.tsx`). The root
  layout already guards them.
- Shared components go in `src/components/`, helpers in `src/lib/`.
- `src/app/page.tsx` is the placeholder dashboard home. Replace its content.

## Security model

`AuthGuard` is client-side UI protection only. It decides what the browser
renders; it does not stop anyone from calling your server or reading what the
server sends.

- Future API routes, route handlers and server actions must verify the caller's
  Firebase ID token and role on the server before doing anything. Do not trust a
  role or user ID sent by the client.
- Do not fetch private data in a Server Component under this guard. Server
  Components passed as children are serialized into the page's RSC payload, so
  the data reaches the browser even when the guard renders "Access Denied".
- Prefer fetching private data from the HackPSU API in client components with
  the SDK hooks. They send the user's Firebase ID token, and the API enforces
  authorization.
- Keep secrets in server-only environment variables (no `NEXT_PUBLIC_` prefix).
