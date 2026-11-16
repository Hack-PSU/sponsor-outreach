type SetupRequiredProps = {
  missing: readonly string[];
  invalid: readonly string[];
};

/**
 * Shown instead of the app when required configuration is absent or malformed.
 * Variable names are listed only in development builds.
 */
export function SetupRequired({ missing, invalid }: SetupRequiredProps) {
  const showDetails = process.env.NODE_ENV === "development";

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-xl font-semibold">Configuration required</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          HackPSU Sponsor Outreach is missing the configuration it needs to
          sign you in.
        </p>

        {showDetails ? (
          <div className="mt-4 space-y-4 text-sm">
            {missing.length > 0 && (
              <section>
                <h2 className="font-medium">Missing variables</h2>
                <ul className="mt-1 list-disc pl-5 font-mono text-xs">
                  {missing.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              </section>
            )}
            {invalid.length > 0 && (
              <section>
                <h2 className="font-medium">
                  Invalid values (must be http(s) URLs)
                </h2>
                <ul className="mt-1 list-disc pl-5 font-mono text-xs">
                  {invalid.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              </section>
            )}
            <p className="text-zinc-600 dark:text-zinc-400">
              Copy <code className="font-mono">.env.example</code> to{" "}
              <code className="font-mono">.env.local</code>, fill in the
              values, and restart the dev server.
            </p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Contact the HackPSU tech team.
          </p>
        )}
      </div>
    </main>
  );
}
