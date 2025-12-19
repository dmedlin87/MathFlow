// Environment configuration wrapper
// Segregated to prevent 'import.meta' leaking into pure domain logic files when running in Node.js
type ConfigEnv = Record<string, string | undefined>;

export const getApiBaseUrl = (options?: {
  env?: ConfigEnv;
  hasWindow?: boolean;
}): string | null => {
  const env =
    options?.env ??
    (
      import.meta as ImportMeta & {
        env?: ConfigEnv;
      }
    ).env;
  const hasWindow =
    options?.hasWindow ??
    typeof (globalThis as unknown as { window?: unknown }).window !== "undefined";

  if (hasWindow && env?.VITE_API_BASE_URL) {
    return env.VITE_API_BASE_URL;
  }
  return null;
};
