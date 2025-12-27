/**
 * API configuration
 * Switch between local and production
 */
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
export const API_BASE = isLocal
  ? 'http://localhost:8080/api'
  : 'https://cmx-notification-be-production.up.railway.app/api';
