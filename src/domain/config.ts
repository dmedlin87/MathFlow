// Environment configuration wrapper
// Segregated to prevent 'import.meta' leaking into pure domain logic files when running in Node.js
export const getApiBaseUrl = (): string | null => {
  const env = (
    import.meta as ImportMeta & {
      env?: Record<string, string | undefined>;
    }
  ).env;
  const hasWindow =
    typeof (globalThis as unknown as { window?: unknown }).window !== "undefined";

  if (hasWindow && env?.VITE_API_BASE_URL) {
    return env.VITE_API_BASE_URL;
  }
  return null;
};
