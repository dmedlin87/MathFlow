// Environment configuration wrapper
// Segregated to prevent 'import.meta' leaking into pure domain logic files when running in Node.js
export const getApiBaseUrl = (): string | null => {
  if (typeof window !== "undefined" && import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  return null;
};
