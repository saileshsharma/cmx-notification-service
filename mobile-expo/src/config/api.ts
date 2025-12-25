// API Configuration
// Production backend URL (Railway)
export const API_BASE_URL = 'https://cmx-notification-be-production.up.railway.app/api';

// For local development, use:
// export const API_BASE_URL = 'http://192.168.1.83:8080/api';

// QStash Configuration
// QStash URL and token for publishing messages to the queue
export const QSTASH_TOKEN = 'eyJVc2VySUQiOiJlNTFjZjdhMy03MTVjLTQ2MTctODEyMi00ZWQzYjYxZDU3YTYiLCJQYXNzd29yZCI6IjJhYWY3ZjZkMDhlZTRhNDViMDQ0N2E0YjZjZjQxYjgxIn0=';

// The destination URL that QStash will call when delivering messages
// This is your backend webhook endpoint
export const QSTASH_DESTINATION_URL = 'https://cmx-notification-be-production.up.railway.app/api/webhook/qstash/location';

// For local development with ngrok or similar:
// export const QSTASH_DESTINATION_URL = 'https://your-ngrok-url.ngrok.io/api/webhook/qstash/location';
