"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { AuthGuard, HackPSUProvider } from "@hackpsu/react-sdk";
import { REQUIRED_ROLE, hackpsuConfig } from "@/lib/hackpsu-config";
import { SetupRequired } from "@/components/setup-required";

const noopSubscribe = () => () => {};

/** False during server rendering and prerendering, true in the browser. */
function useIsBrowser(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/**
 * Wraps all application UI in HackPSU SSO and a Role.TEAM guard.
 *
 * The provider's built-in guard is disabled (guard={false}) because the explicit
 * AuthGuard below does the gating. Using both would guard twice.
 *
 * The SDK is mounted only in the browser. It initializes Firebase during render,
 * which has no use on the server (the session lives in the browser) and fails
 * Cache Components prerendering because Firebase reads the current time.
 *
 * This is UI protection only. Anything private must also be authorized on the
 * server; see README.md, "Security model".
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const isBrowser = useIsBrowser();

  if (!hackpsuConfig.ok) {
    // Do not mount the SDK: Firebase would fail to initialize without config.
    return (
      <SetupRequired
        missing={hackpsuConfig.missing}
        invalid={hackpsuConfig.invalid}
      />
    );
  }

  if (!isBrowser) return null;

  return (
    <HackPSUProvider config={hackpsuConfig.config} guard={false}>
      <AuthGuard minimumRole={REQUIRED_ROLE}>{children}</AuthGuard>
    </HackPSUProvider>
  );
}
