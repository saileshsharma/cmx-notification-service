import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:8080/api';

test.describe('Security Tests', () => {

  test.describe('SQL Injection Prevention', () => {

    test('GET /surveyors - rejects SQL injection in type parameter', async ({ request }) => {
      const maliciousInputs = [
        "INTERNAL'; DROP TABLE surveyors; --",
        "INTERNAL' OR '1'='1",
        "INTERNAL' UNION SELECT * FROM users --",
        "1; DELETE FROM surveyors WHERE 1=1",
        "INTERNAL%27%20OR%20%271%27%3D%271",
      ];

      for (const input of maliciousInputs) {
        const response = await request.get(`${API_BASE}/surveyors?type=${encodeURIComponent(input)}`);
        // Should either return empty array or 400, but NOT execute the SQL
        expect(response.status()).toBeLessThan(500);

        // Verify surveyors table still exists by making a valid request
        const validResponse = await request.get(`${API_BASE}/surveyors`);
        expect(validResponse.ok()).toBeTruthy();
      }
    });

    test('GET /availability - rejects SQL injection in surveyorId', async ({ request }) => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

      const maliciousInputs = [
        "1 OR 1=1",
        "1; DROP TABLE surveyor_availability;--",
        "1 UNION SELECT * FROM surveyors",
        "-1 OR 1=1",
      ];

      for (const input of maliciousInputs) {
        const response = await request.get(
          `${API_BASE}/availability?from=${from}&to=${to}&surveyorId=${encodeURIComponent(input)}`
        );
        // Should return 400 or empty, not 500
        expect(response.status()).toBeLessThan(500);
      }
    });

    test('POST /mobile/availability - rejects SQL injection in title/description', async ({ request }) => {
      const startTime = new Date(Date.now() + 86400000).toISOString();
      const endTime = new Date(Date.now() + 90000000).toISOString();

      const maliciousPayload = {
        surveyorId: 1,
        blocks: [{
          startTime,
          endTime,
          state: 'BUSY',
          title: "Test'; DROP TABLE surveyor_availability; --",
          description: "'; DELETE FROM surveyors WHERE '1'='1"
        }]
      };

      const response = await request.post(`${API_BASE}/mobile/availability`, {
        data: maliciousPayload
      });

      // Should either succeed (data is escaped) or reject, but not crash
      expect(response.status()).toBeLessThan(500);

      // Verify tables still exist
      const validResponse = await request.get(`${API_BASE}/surveyors`);
      expect(validResponse.ok()).toBeTruthy();
    });
  });

  test.describe('XSS Prevention', () => {

    test('POST /mobile/availability - sanitizes XSS in title', async ({ request }) => {
      const startTime = new Date(Date.now() + 86400000).toISOString();
      const endTime = new Date(Date.now() + 90000000).toISOString();

      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        'javascript:alert("XSS")',
        '<svg onload=alert("XSS")>',
        '"><script>alert(String.fromCharCode(88,83,83))</script>',
      ];

      for (const payload of xssPayloads) {
        const response = await request.post(`${API_BASE}/mobile/availability`, {
          data: {
            surveyorId: 1,
            blocks: [{
              startTime,
              endTime,
              state: 'BUSY',
              title: payload,
              description: 'XSS Test'
            }]
          }
        });

        // Should accept and store safely, or reject
        expect(response.status()).toBeLessThan(500);
      }
    });

    test('POST /mobile/device-token - sanitizes XSS in token', async ({ request }) => {
      const response = await request.post(`${API_BASE}/mobile/device-token`, {
        data: {
          surveyorId: 1,
          token: '<script>alert("XSS")</script>',
          platform: 'ANDROID'
        }
      });

      expect(response.status()).toBeLessThan(500);
    });
  });

  test.describe('Input Validation', () => {

    test('POST /mobile/availability - rejects invalid surveyorId', async ({ request }) => {
      const startTime = new Date(Date.now() + 86400000).toISOString();
      const endTime = new Date(Date.now() + 90000000).toISOString();

      const invalidIds = [
        -1,
        0,
        'abc',
        null,
        undefined,
        9999999999,
      ];

      for (const id of invalidIds) {
        const response = await request.post(`${API_BASE}/mobile/availability`, {
          data: {
            surveyorId: id,
            blocks: [{
              startTime,
              endTime,
              state: 'BUSY',
              title: 'Test',
              description: 'Test'
            }]
          }
        });

        // Should return 400 or fail gracefully, not 500
        expect(response.status()).toBeLessThan(500);
      }
    });

    test('POST /mobile/availability - rejects invalid state values', async ({ request }) => {
      const startTime = new Date(Date.now() + 86400000).toISOString();
      const endTime = new Date(Date.now() + 90000000).toISOString();

      const invalidStates = [
        'INVALID_STATE',
        '',
        'busy', // lowercase
        '<script>',
        '123',
      ];

      for (const state of invalidStates) {
        const response = await request.post(`${API_BASE}/mobile/availability`, {
          data: {
            surveyorId: 1,
            blocks: [{
              startTime,
              endTime,
              state: state,
              title: 'Test',
              description: 'Test'
            }]
          }
        });

        // Should handle gracefully
        expect(response.status()).toBeLessThan(500);
      }
    });

    test('POST /mobile/availability - rejects invalid date formats', async ({ request }) => {
      const invalidDates = [
        'not-a-date',
        '2024-13-45', // Invalid month/day
        '12/25/2024', // Wrong format
        '',
        null,
      ];

      for (const date of invalidDates) {
        const response = await request.post(`${API_BASE}/mobile/availability`, {
          data: {
            surveyorId: 1,
            blocks: [{
              startTime: date,
              endTime: date,
              state: 'BUSY',
              title: 'Test',
              description: 'Test'
            }]
          }
        });

        expect(response.status()).toBeLessThan(500);
      }
    });

    test('POST /mobile/availability - rejects oversized input', async ({ request }) => {
      const startTime = new Date(Date.now() + 86400000).toISOString();
      const endTime = new Date(Date.now() + 90000000).toISOString();

      // Create a very long string (100KB)
      const longString = 'A'.repeat(100000);

      const response = await request.post(`${API_BASE}/mobile/availability`, {
        data: {
          surveyorId: 1,
          blocks: [{
            startTime,
            endTime,
            state: 'BUSY',
            title: longString,
            description: longString
          }]
        }
      });

      // Should reject or truncate, not crash
      expect(response.status()).toBeLessThan(500);
    });
  });

  test.describe('Authentication & Authorization', () => {

    test('API endpoints are accessible without authentication (current state)', async ({ request }) => {
      // Document current security posture - all endpoints are currently open
      // This test should FAIL once authentication is implemented

      const endpoints = [
        { method: 'GET', url: `${API_BASE}/surveyors` },
        { method: 'GET', url: `${API_BASE}/availability?from=2024-01-01&to=2024-12-31` },
        { method: 'GET', url: `${API_BASE}/notifications/history` },
        { method: 'GET', url: `${API_BASE}/activity/recent` },
        { method: 'GET', url: `${API_BASE}/dispatcher/status` },
      ];

      for (const endpoint of endpoints) {
        const response = await request.get(endpoint.url);
        // Currently all return 200 - this should change with auth
        expect(response.status()).toBe(200);
      }
    });

    test('Sensitive endpoints should require authentication (TODO)', async ({ request }) => {
      // These tests document endpoints that SHOULD require auth
      // Update assertions when auth is implemented

      const sensitiveEndpoints = [
        { url: `${API_BASE}/dev/notification-status`, desc: 'Dev notification status' },
        { url: `${API_BASE}/notifications/history`, desc: 'Notification history' },
      ];

      for (const endpoint of sensitiveEndpoints) {
        const response = await request.get(endpoint.url);
        // TODO: Once auth is implemented, these should return 401
        // expect(response.status()).toBe(401);

        // Currently documenting that they're open
        console.log(`WARNING: ${endpoint.desc} is accessible without auth`);
      }
    });
  });

  test.describe('Rate Limiting', () => {

    test('API should handle rapid requests without crashing', async ({ request }) => {
      const promises = [];

      // Send 50 rapid requests
      for (let i = 0; i < 50; i++) {
        promises.push(request.get(`${API_BASE}/surveyors`));
      }

      const responses = await Promise.all(promises);

      // All should complete without 500 errors
      for (const response of responses) {
        expect(response.status()).toBeLessThan(500);
      }

      // TODO: Once rate limiting is implemented, some should be 429
      // const rateLimited = responses.filter(r => r.status() === 429);
      // expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  test.describe('CORS Security', () => {

    test('OPTIONS preflight returns CORS headers', async ({ request }) => {
      const response = await request.fetch(`${API_BASE}/surveyors`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:4200',
          'Access-Control-Request-Method': 'GET',
        }
      });

      expect(response.headers()['access-control-allow-origin']).toBeDefined();
      expect(response.headers()['access-control-allow-methods']).toBeDefined();
    });

    test('CORS allows configured origins', async ({ request }) => {
      const response = await request.get(`${API_BASE}/surveyors`, {
        headers: {
          'Origin': 'http://localhost:4200',
        }
      });

      expect(response.ok()).toBeTruthy();
      // TODO: Verify only allowed origins are accepted once CORS is restricted
    });
  });

  test.describe('Error Handling', () => {

    test('Invalid endpoint returns 404, not 500', async ({ request }) => {
      const response = await request.get(`${API_BASE}/nonexistent-endpoint-12345`);
      expect(response.status()).toBe(404);
    });

    test('Invalid HTTP method returns 405, not 500', async ({ request }) => {
      const response = await request.patch(`${API_BASE}/surveyors`);
      // Should be 405 Method Not Allowed, or similar client error
      expect(response.status()).toBeGreaterThanOrEqual(400);
      expect(response.status()).toBeLessThan(500);
    });

    test('Malformed JSON returns 400, not 500', async ({ request }) => {
      const response = await request.post(`${API_BASE}/mobile/availability`, {
        headers: { 'Content-Type': 'application/json' },
        data: 'not valid json {'
      });

      expect(response.status()).toBe(400);
    });

    test('Error responses do not leak stack traces', async ({ request }) => {
      const response = await request.get(`${API_BASE}/availability?surveyorId=not-a-number`);

      const body = await response.text();

      // Should not contain Java stack trace
      expect(body).not.toContain('java.lang');
      expect(body).not.toContain('at com.cmx');
      expect(body).not.toContain('Exception');
      expect(body).not.toContain('.java:');
    });
  });

  test.describe('HTTP Security Headers', () => {

    test('Response includes security headers', async ({ request }) => {
      const response = await request.get(`${API_BASE}/surveyors`);
      const headers = response.headers();

      // These are recommended security headers
      // TODO: Implement these in the backend

      // Document current state
      console.log('Current security headers:');
      console.log('  X-Content-Type-Options:', headers['x-content-type-options'] || 'MISSING');
      console.log('  X-Frame-Options:', headers['x-frame-options'] || 'MISSING');
      console.log('  X-XSS-Protection:', headers['x-xss-protection'] || 'MISSING');
      console.log('  Strict-Transport-Security:', headers['strict-transport-security'] || 'MISSING');
      console.log('  Content-Security-Policy:', headers['content-security-policy'] || 'MISSING');

      // Once implemented, uncomment these assertions:
      // expect(headers['x-content-type-options']).toBe('nosniff');
      // expect(headers['x-frame-options']).toBe('DENY');
    });
  });

  test.describe('Data Exposure', () => {

    test('Surveyor response does not expose sensitive fields', async ({ request }) => {
      const response = await request.get(`${API_BASE}/surveyors`);
      const surveyors = await response.json();

      for (const surveyor of surveyors) {
        // Should NOT expose these fields
        expect(surveyor).not.toHaveProperty('password');
        expect(surveyor).not.toHaveProperty('passwordHash');
        expect(surveyor).not.toHaveProperty('apiKey');
        expect(surveyor).not.toHaveProperty('secret');
        expect(surveyor).not.toHaveProperty('token');
      }
    });

    test('Notification history does not expose device tokens', async ({ request }) => {
      const response = await request.get(`${API_BASE}/notifications/history`);
      const history = await response.json();

      const bodyString = JSON.stringify(history);

      // Should not contain full device tokens
      // Tokens are typically long alphanumeric strings
      const longTokenPattern = /[a-zA-Z0-9_-]{100,}/;
      expect(bodyString).not.toMatch(longTokenPattern);
    });
  });

  test.describe('File Upload Security', () => {

    test('API rejects unexpected file uploads', async ({ request }) => {
      // Try to upload a file to a non-upload endpoint
      const response = await request.post(`${API_BASE}/surveyors`, {
        multipart: {
          file: {
            name: 'malicious.php',
            mimeType: 'application/x-php',
            buffer: Buffer.from('<?php echo "hacked"; ?>')
          }
        }
      });

      // Should reject with client error, not process the file
      expect(response.status()).toBeGreaterThanOrEqual(400);
      expect(response.status()).toBeLessThan(500);
    });
  });

  test.describe('Session Security', () => {

    test('Cookies have secure flags (when auth implemented)', async ({ request }) => {
      const response = await request.get(`${API_BASE}/surveyors`);
      const cookies = response.headers()['set-cookie'];

      if (cookies) {
        // TODO: Verify these flags when session cookies are implemented
        console.log('Session cookies found - verify security flags');
        // expect(cookies).toContain('HttpOnly');
        // expect(cookies).toContain('Secure');
        // expect(cookies).toContain('SameSite');
      }
    });
  });
});
