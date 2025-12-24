import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:8080/api';

test.describe('Backend API Tests', () => {

  test.describe('Surveyor API', () => {

    test('GET /surveyors - returns list of surveyors', async ({ request }) => {
      const response = await request.get(`${API_BASE}/surveyors`);
      expect(response.ok()).toBeTruthy();

      const surveyors = await response.json();
      expect(Array.isArray(surveyors)).toBeTruthy();
      expect(surveyors.length).toBeGreaterThan(0);

      // Verify surveyor structure
      const surveyor = surveyors[0];
      expect(surveyor).toHaveProperty('id');
      expect(surveyor).toHaveProperty('code');
      expect(surveyor).toHaveProperty('display_name');
      expect(surveyor).toHaveProperty('surveyor_type');
      expect(surveyor).toHaveProperty('current_status');
    });

    test('GET /surveyors?type=INTERNAL - filters by type', async ({ request }) => {
      const response = await request.get(`${API_BASE}/surveyors?type=INTERNAL`);
      expect(response.ok()).toBeTruthy();

      const surveyors = await response.json();
      expect(Array.isArray(surveyors)).toBeTruthy();

      // All returned surveyors should be INTERNAL type
      for (const surveyor of surveyors) {
        expect(surveyor.surveyor_type).toBe('INTERNAL');
      }
    });

    test('GET /surveyors?type=EXTERNAL - filters by type', async ({ request }) => {
      const response = await request.get(`${API_BASE}/surveyors?type=EXTERNAL`);
      expect(response.ok()).toBeTruthy();

      const surveyors = await response.json();
      for (const surveyor of surveyors) {
        expect(surveyor.surveyor_type).toBe('EXTERNAL');
      }
    });

    test('GET /surveyors?currentStatus=AVAILABLE - filters by status', async ({ request }) => {
      const response = await request.get(`${API_BASE}/surveyors?currentStatus=AVAILABLE`);
      expect(response.ok()).toBeTruthy();

      const surveyors = await response.json();
      for (const surveyor of surveyors) {
        expect(surveyor.current_status).toBe('AVAILABLE');
      }
    });
  });

  test.describe('Availability API', () => {

    test('GET /availability - returns availability data', async ({ request }) => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

      const response = await request.get(`${API_BASE}/availability?from=${from}&to=${to}`);
      expect(response.ok()).toBeTruthy();

      const availability = await response.json();
      expect(Array.isArray(availability)).toBeTruthy();
    });

    test('GET /availability with surveyorId - filters by surveyor', async ({ request }) => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

      const response = await request.get(`${API_BASE}/availability?from=${from}&to=${to}&surveyorId=1`);
      expect(response.ok()).toBeTruthy();

      const availability = await response.json();
      expect(Array.isArray(availability)).toBeTruthy();

      // All returned availability should be for surveyor 1
      for (const item of availability) {
        expect(item.surveyor_id).toBe(1);
      }
    });

    test('POST /mobile/availability - creates new availability', async ({ request }) => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 86400000); // Tomorrow
      startTime.setHours(10, 0, 0, 0);
      const endTime = new Date(startTime.getTime() + 3600000); // +1 hour

      const response = await request.post(`${API_BASE}/mobile/availability`, {
        data: {
          surveyorId: 1,
          blocks: [{
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            state: 'BUSY',
            title: 'E2E Test Appointment',
            description: 'Created by E2E test'
          }]
        }
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();
      expect(result.ok).toBe(true);
    });

    test('PUT /availability/{id} - updates availability', async ({ request }) => {
      // First create an availability to update
      const now = new Date();
      const startTime = new Date(now.getTime() + 172800000); // Day after tomorrow
      startTime.setHours(14, 0, 0, 0);
      const endTime = new Date(startTime.getTime() + 3600000);

      await request.post(`${API_BASE}/mobile/availability`, {
        data: {
          surveyorId: 2,
          blocks: [{
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            state: 'BUSY',
            title: 'Test to Update',
            description: 'Will be updated'
          }]
        }
      });

      // Get the created availability
      const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const to = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();

      const getResponse = await request.get(`${API_BASE}/availability?from=${from}&to=${to}&surveyorId=2`);
      const availabilities = await getResponse.json();
      const toUpdate = availabilities.find((a: any) => a.title === 'Test to Update');

      if (toUpdate) {
        const updateResponse = await request.put(`${API_BASE}/availability/${toUpdate.id}`, {
          data: {
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            state: 'BUSY',
            title: 'Updated Title',
            description: 'Updated description'
          }
        });

        expect(updateResponse.ok()).toBeTruthy();
        const result = await updateResponse.json();
        expect(result.ok).toBe(true);
      }
    });

    test('DELETE /availability/{id} - deletes availability', async ({ request }) => {
      // First create an availability to delete
      const now = new Date();
      const startTime = new Date(now.getTime() + 259200000); // 3 days from now
      startTime.setHours(9, 0, 0, 0);
      const endTime = new Date(startTime.getTime() + 3600000);

      await request.post(`${API_BASE}/mobile/availability`, {
        data: {
          surveyorId: 3,
          blocks: [{
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            state: 'BUSY',
            title: 'Test to Delete',
            description: 'Will be deleted'
          }]
        }
      });

      // Get the created availability
      const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const to = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();

      const getResponse = await request.get(`${API_BASE}/availability?from=${from}&to=${to}&surveyorId=3`);
      const availabilities = await getResponse.json();
      const toDelete = availabilities.find((a: any) => a.title === 'Test to Delete');

      if (toDelete) {
        const deleteResponse = await request.delete(`${API_BASE}/availability/${toDelete.id}`);
        expect(deleteResponse.ok()).toBeTruthy();
        const result = await deleteResponse.json();
        expect(result.ok).toBe(true);
      }
    });
  });

  test.describe('Device Token API', () => {

    test('POST /mobile/device-token - registers device token', async ({ request }) => {
      const response = await request.post(`${API_BASE}/mobile/device-token`, {
        data: {
          surveyorId: 1,
          token: 'test-token-e2e-' + Date.now(),
          platform: 'ANDROID'
        }
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();
      expect(result.ok).toBe(true);
    });

    test('DELETE /mobile/device-token - unregisters device token', async ({ request }) => {
      const token = 'test-token-to-delete-' + Date.now();

      // First register the token
      await request.post(`${API_BASE}/mobile/device-token`, {
        data: {
          surveyorId: 1,
          token: token,
          platform: 'IOS'
        }
      });

      // Then delete it
      const response = await request.delete(`${API_BASE}/mobile/device-token`, {
        data: {
          surveyorId: 1,
          token: token,
          platform: 'IOS'
        }
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();
      expect(result.ok).toBe(true);
    });
  });

  test.describe('Dispatch API', () => {

    test('POST /fnol/{fnolId}/offers - creates dispatch offers', async ({ request }) => {
      const response = await request.post(`${API_BASE}/fnol/TEST-FNOL-001/offers`, {
        data: {
          candidateSurveyorIds: [1, 2, 3],
          ttlSeconds: 300
        }
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();
      expect(result.offerGroup).toBeDefined();
      expect(result.expiresAt).toBeDefined();
    });

    test('POST /jobs/{jobId}/complete - completes job (non-existent)', async ({ request }) => {
      // Test with non-existent job - should return ok: false
      const response = await request.post(`${API_BASE}/jobs/99999/complete`);
      expect(response.ok()).toBeTruthy();
      const result = await response.json();
      expect(result.ok).toBe(false);
    });
  });

  test.describe('Notification API', () => {

    test('GET /notifications/history - returns notification history', async ({ request }) => {
      const response = await request.get(`${API_BASE}/notifications/history`);
      expect(response.ok()).toBeTruthy();

      const history = await response.json();
      expect(Array.isArray(history)).toBeTruthy();
    });

    test('GET /notifications/stats - returns notification stats', async ({ request }) => {
      const response = await request.get(`${API_BASE}/notifications/stats?hours=24`);
      expect(response.ok()).toBeTruthy();

      const stats = await response.json();
      expect(stats).toHaveProperty('periodHours');
      expect(stats).toHaveProperty('totalPush');
      expect(stats).toHaveProperty('totalEmail');
      expect(stats).toHaveProperty('totalSms');
    });

    test('GET /dev/notification-status - returns notification status', async ({ request }) => {
      const response = await request.get(`${API_BASE}/dev/notification-status`);
      expect(response.ok()).toBeTruthy();

      const status = await response.json();
      expect(status).toHaveProperty('firebaseEnabled');
      expect(status).toHaveProperty('totalSurveyors');
      expect(status).toHaveProperty('totalDeviceTokens');
    });
  });
});
