/**
 * Dynamically determines the API base URL based on the current hostname.
 * This allows the app to work seamlessly when accessed from:
 * - localhost (development)
 * - Network IP address (e.g., 192.168.1.x)
 * - Production (Railway deployed backend)
 */
export function getApiBase(): string {
  // Check if we're in production (Railway)
  const hostname = window.location.hostname;

  // If running on Railway or production, use the production API
  if (hostname.includes('railway.app') || hostname.includes('up.railway.app')) {
    return 'https://cmx-notification-be-production.up.railway.app/api';
  }

  // Development: use the current hostname with backend port 8080
  const protocol = window.location.protocol;
  return `${protocol}//${hostname}:8080/api`;
}

export const API_BASE = getApiBase();
