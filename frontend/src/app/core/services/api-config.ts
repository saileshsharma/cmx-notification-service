/**
 * Dynamically determines the API base URL based on the current hostname.
 * This allows the app to work seamlessly when accessed from:
 * - localhost (development)
 * - Network IP address (e.g., 192.168.1.x)
 * - Custom domain
 */
export function getApiBase(): string {
  // Check for explicit override first
  if ((window as any).__API_BASE__) {
    return (window as any).__API_BASE__;
  }

  // Use the current hostname with backend port 8080
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;

  return `${protocol}//${hostname}:8080/api`;
}

export const API_BASE = getApiBase();
