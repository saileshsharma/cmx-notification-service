// Production backend URL
const PRODUCTION_API_URL = 'https://cmx-notification-be-production.up.railway.app/api';

/**
 * Dynamically determines the API base URL based on the current hostname.
 */
function getApiBase(): string {
  const hostname = window.location.hostname;

  // Production: Railway deployment
  if (hostname.includes('railway.app')) {
    return PRODUCTION_API_URL;
  }

  // Development: use current hostname with backend port
  return `${window.location.protocol}//${hostname}:8080/api`;
}

export const API_BASE = getApiBase();
