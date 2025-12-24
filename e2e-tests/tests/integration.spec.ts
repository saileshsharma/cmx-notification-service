import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:8080/api';

test.describe('Full Integration Tests', () => {

  test.describe('End-to-End Appointment Workflow', () => {

    test('complete appointment lifecycle: create, read, update, delete', async ({ page, request }) => {
      // Step 1: Navigate to the app
      await page.goto('/');
      await page.waitForSelector('.surveyor-card, .surveyor-item', { timeout: 30000 });

      // Step 2: Create an appointment via API
      const now = new Date();
      const startTime = new Date(now.getTime() + 604800000); // 1 week from now
      startTime.setHours(11, 0, 0, 0);
      const endTime = new Date(startTime.getTime() + 7200000); // +2 hours

      const createResponse = await request.post(`${API_BASE}/mobile/availability`, {
        data: {
          surveyorId: 5,
          blocks: [{
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            state: 'BUSY',
            title: 'Integration Test Appointment',
            description: 'Full lifecycle test'
          }]
        }
      });

      expect(createResponse.ok()).toBeTruthy();
      const createResult = await createResponse.json();
      expect(createResult.ok).toBe(true);

      // Step 3: Verify the appointment exists via API
      const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const to = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();

      const getResponse = await request.get(`${API_BASE}/availability?from=${from}&to=${to}&surveyorId=5`);
      const appointments = await getResponse.json();
      const created = appointments.find((a: any) => a.title === 'Integration Test Appointment');

      expect(created).toBeDefined();

      // Step 4: Update the appointment
      if (created) {
        const updateResponse = await request.put(`${API_BASE}/availability/${created.id}`, {
          data: {
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            state: 'BUSY',
            title: 'Integration Test - Updated',
            description: 'Updated in lifecycle test'
          }
        });

        expect(updateResponse.ok()).toBeTruthy();

        // Step 5: Verify the update
        const verifyResponse = await request.get(`${API_BASE}/availability?from=${from}&to=${to}&surveyorId=5`);
        const updatedAppointments = await verifyResponse.json();
        const updated = updatedAppointments.find((a: any) => a.id === created.id);

        expect(updated).toBeDefined();
        expect(updated.title).toBe('Integration Test - Updated');

        // Step 6: Delete the appointment
        const deleteResponse = await request.delete(`${API_BASE}/availability/${created.id}`);
        expect(deleteResponse.ok()).toBeTruthy();

        // Step 7: Verify deletion
        const finalResponse = await request.get(`${API_BASE}/availability?from=${from}&to=${to}&surveyorId=5`);
        const finalAppointments = await finalResponse.json();
        const deleted = finalAppointments.find((a: any) => a.id === created.id);

        expect(deleted).toBeUndefined();
      }
    });

    test('frontend reflects API changes', async ({ page, request }) => {
      // Navigate to the app
      await page.goto('/');
      await page.waitForSelector('.surveyor-card, .surveyor-item', { timeout: 30000 });

      // Get initial surveyor count
      const surveyorResponse = await request.get(`${API_BASE}/surveyors`);
      const surveyors = await surveyorResponse.json();

      expect(surveyors.length).toBeGreaterThan(0);

      // Verify frontend displays surveyors
      const surveyorCards = page.locator('.surveyor-card, .surveyor-item');
      const displayedCount = await surveyorCards.count();

      expect(displayedCount).toBeGreaterThan(0);
    });
  });

  test.describe('Dispatch Workflow', () => {

    test('create offer, accept offer, complete job', async ({ request }) => {
      // Step 1: Create dispatch offers
      const createOfferResponse = await request.post(`${API_BASE}/fnol/E2E-FNOL-001/offers`, {
        data: {
          candidateSurveyorIds: [10, 11, 12],
          ttlSeconds: 600
        }
      });

      expect(createOfferResponse.ok()).toBeTruthy();
      const offerResult = await createOfferResponse.json();
      expect(offerResult.offerGroup).toBeDefined();

      const offerGroup = offerResult.offerGroup;

      // Step 2: Accept the offer (surveyor 10 accepts)
      const acceptResponse = await request.post(`${API_BASE}/offers/${offerGroup}/accept`, {
        data: {
          surveyorId: 10
        }
      });

      expect(acceptResponse.ok()).toBeTruthy();
      const acceptResult = await acceptResponse.json();
      expect(acceptResult.ok).toBe(true);
      expect(acceptResult.jobId).toBeDefined();

      const jobId = acceptResult.jobId;

      // Step 3: Complete the job
      const completeResponse = await request.post(`${API_BASE}/jobs/${jobId}/complete`);
      expect(completeResponse.ok()).toBeTruthy();
      const completeResult = await completeResponse.json();
      expect(completeResult.ok).toBe(true);
    });

    test('second surveyor cannot accept already accepted offer', async ({ request }) => {
      // Create dispatch offers
      const createOfferResponse = await request.post(`${API_BASE}/fnol/E2E-FNOL-002/offers`, {
        data: {
          candidateSurveyorIds: [20, 21, 22],
          ttlSeconds: 600
        }
      });

      const offerResult = await createOfferResponse.json();
      const offerGroup = offerResult.offerGroup;

      // First surveyor accepts
      await request.post(`${API_BASE}/offers/${offerGroup}/accept`, {
        data: {
          surveyorId: 20
        }
      });

      // Second surveyor tries to accept - should fail
      const secondAcceptResponse = await request.post(`${API_BASE}/offers/${offerGroup}/accept`, {
        data: {
          surveyorId: 21
        }
      });

      expect(secondAcceptResponse.status()).toBe(409); // Conflict
      const secondResult = await secondAcceptResponse.json();
      expect(secondResult.ok).toBe(false);
    });
  });

  test.describe('Notification Workflow', () => {

    test('device token registration and notification history', async ({ request }) => {
      // Register a device token
      const token = 'integration-test-token-' + Date.now();

      const registerResponse = await request.post(`${API_BASE}/mobile/device-token`, {
        data: {
          surveyorId: 15,
          token: token,
          platform: 'ANDROID'
        }
      });

      expect(registerResponse.ok()).toBeTruthy();

      // Create an appointment (triggers notification)
      const now = new Date();
      const startTime = new Date(now.getTime() + 864000000); // 10 days from now
      startTime.setHours(9, 0, 0, 0);
      const endTime = new Date(startTime.getTime() + 3600000);

      await request.post(`${API_BASE}/mobile/availability`, {
        data: {
          surveyorId: 15,
          blocks: [{
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            state: 'BUSY',
            title: 'Notification Test',
            description: 'Testing notification workflow'
          }]
        }
      });

      // Check notification history
      const historyResponse = await request.get(`${API_BASE}/notifications/history?surveyorId=15`);
      expect(historyResponse.ok()).toBeTruthy();

      const history = await historyResponse.json();
      expect(Array.isArray(history)).toBeTruthy();

      // Unregister the device token
      await request.delete(`${API_BASE}/mobile/device-token`, {
        data: {
          surveyorId: 15,
          token: token,
          platform: 'ANDROID'
        }
      });
    });
  });

  test.describe('Data Consistency', () => {

    test('availability pagination works correctly', async ({ request }) => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

      // Get first page
      const page1Response = await request.get(`${API_BASE}/availability?from=${from}&to=${to}&limit=10&offset=0`);
      expect(page1Response.ok()).toBeTruthy();
      const page1 = await page1Response.json();

      // Get second page
      const page2Response = await request.get(`${API_BASE}/availability?from=${from}&to=${to}&limit=10&offset=10`);
      expect(page2Response.ok()).toBeTruthy();
      const page2 = await page2Response.json();

      // Pages should have different content (if there are enough records)
      if (page1.length === 10 && page2.length > 0) {
        const page1Ids = page1.map((a: any) => a.id);
        const page2Ids = page2.map((a: any) => a.id);

        // No overlap between pages
        for (const id of page2Ids) {
          expect(page1Ids).not.toContain(id);
        }
      }
    });

    test('surveyor type and status filters can be combined', async ({ request }) => {
      // Get all surveyors
      const allResponse = await request.get(`${API_BASE}/surveyors`);
      const allSurveyors = await allResponse.json();

      // Get INTERNAL surveyors
      const internalResponse = await request.get(`${API_BASE}/surveyors?type=INTERNAL`);
      const internalSurveyors = await internalResponse.json();

      // Get AVAILABLE surveyors
      const availableResponse = await request.get(`${API_BASE}/surveyors?currentStatus=AVAILABLE`);
      const availableSurveyors = await availableResponse.json();

      // Verify filters work
      expect(internalSurveyors.length).toBeLessThanOrEqual(allSurveyors.length);
      expect(availableSurveyors.length).toBeLessThanOrEqual(allSurveyors.length);

      // All internal surveyors should have INTERNAL type
      for (const s of internalSurveyors) {
        expect(s.surveyor_type).toBe('INTERNAL');
      }

      // All available surveyors should have AVAILABLE status
      for (const s of availableSurveyors) {
        expect(s.current_status).toBe('AVAILABLE');
      }
    });
  });
});
