/**
 * Central API configuration. The base URL can be overridden via the
 * VITE_API_URL environment variable (e.g. http://192.168.1.42:5001 when
 * playing over a local network). Defaults to localhost for local dev.
 */
export const API_BASE: string =
  import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const SOCKET_URL: string = API_BASE;
