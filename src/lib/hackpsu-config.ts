import { DEFAULT_AUTH_SERVICE_URL, Role, type HackPSUConfig } from "@hackpsu/react-sdk";

/**
 * Builds the @hackpsu/react-sdk config from NEXT_PUBLIC_* environment values.
 *
 * Each variable is read with a literal `process.env.NAME` expression so Next.js
 * can inline it into the client bundle. Dynamic lookups such as
 * `process.env[name]` are not inlined and would be undefined in the browser.
 *
 * The SDK never reads the environment itself, so the app must pass these in.
 */

/** Minimum role for the whole dashboard. Matches the internal admin app. */
export const REQUIRED_ROLE = Role.TEAM;

const env = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  NEXT_PUBLIC_FIREBASE_DATABASE_URL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  NEXT_PUBLIC_BASE_URL_V3: process.env.NEXT_PUBLIC_BASE_URL_V3,
  NEXT_PUBLIC_AUTH_SERVICE_URL: process.env.NEXT_PUBLIC_AUTH_SERVICE_URL,
} as const;

type EnvName = keyof typeof env;

const REQUIRED: readonly EnvName[] = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "NEXT_PUBLIC_BASE_URL_V3",
];

/** Values that, when set, must be absolute http(s) URLs. */
const URL_VALUES: readonly EnvName[] = [
  "NEXT_PUBLIC_BASE_URL_V3",
  "NEXT_PUBLIC_AUTH_SERVICE_URL",
  "NEXT_PUBLIC_FIREBASE_DATABASE_URL",
];

function read(name: EnvName): string | undefined {
  const value = env[name]?.trim();
  return value ? value : undefined;
}

function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

export type HackPSUConfigResult =
  | { ok: true; config: HackPSUConfig }
  | { ok: false; missing: EnvName[]; invalid: EnvName[] };

function buildConfig(): HackPSUConfigResult {
  const missing = REQUIRED.filter((name) => !read(name));
  const invalid = URL_VALUES.filter((name) => {
    const value = read(name);
    return value !== undefined && !isHttpUrl(value);
  });

  if (missing.length > 0 || invalid.length > 0) {
    return { ok: false, missing, invalid };
  }

  return {
    ok: true,
    config: {
      firebase: {
        apiKey: read("NEXT_PUBLIC_FIREBASE_API_KEY")!,
        authDomain: read("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN")!,
        projectId: read("NEXT_PUBLIC_FIREBASE_PROJECT_ID")!,
        storageBucket: read("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET")!,
        messagingSenderId: read("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID")!,
        appId: read("NEXT_PUBLIC_FIREBASE_APP_ID")!,
        databaseURL: read("NEXT_PUBLIC_FIREBASE_DATABASE_URL"),
      },
      apiBaseUrl: read("NEXT_PUBLIC_BASE_URL_V3")!,
      authServiceUrl: read("NEXT_PUBLIC_AUTH_SERVICE_URL") ?? DEFAULT_AUTH_SERVICE_URL,
      minimumRole: REQUIRED_ROLE,
      // No analytics: the SDK otherwise identifies users in PostHog.
      posthog: false,
    },
  };
}

/**
 * Computed once per module load so the config object keeps a stable identity.
 * The SDK memoizes Firebase and API client setup on that identity.
 */
export const hackpsuConfig: HackPSUConfigResult = buildConfig();
