/**
 * Dynamically determines the API base URL based on the current hostname.
 * This allows the app to work seamlessly when accessed from:
 * - localhost (development)
 * - Network IP address (e.g., 192.168.1.x)
 */
export function getApiBase(): string {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;

  // Use the current hostname with backend port 8080
  return `${protocol}//${hostname}:8080/api`;
}

export const API_BASE = getApiBase();
