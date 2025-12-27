import { QSTASH_TOKEN, QSTASH_DESTINATION_URL } from '../config/api';
import { SurveyorStatus, AppointmentResponseStatus } from '../types';

/**
 * QStash Service
 * Publishes messages to Upstash QStash which then delivers them to the backend webhook.
 *
 * Flow: Mobile App -> QStash API -> Backend Webhook -> Database
 *
 * This decouples the mobile app from the backend, providing:
 * - Automatic retries on failure
 * - Message persistence
 * - Rate limiting protection
 */
class QStashService {
  private qstashUrl = 'https://qstash.upstash.io/v2/publish';

  /**
   * Publish a message to QStash which will deliver it to our backend webhook
   */
  private async publish(payload: object): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // QStash publish endpoint format: POST /v2/publish/{destination}
      // Note: QStash expects the raw URL, not URL-encoded
      const response = await fetch(`${this.qstashUrl}/${QSTASH_DESTINATION_URL}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${QSTASH_TOKEN}`,
          'Content-Type': 'application/json',
          'Upstash-Retries': '3', // Retry up to 3 times on failure
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[QStash] Publish failed:', response.status, errorText);
        return { success: false, error: `QStash publish failed: ${response.status}` };
      }

      const result = await response.json();
      console.log('[QStash] Message published:', result);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('[QStash] Publish error:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Publish location update to QStash
   */
  async publishLocation(surveyorId: number, lat: number, lng: number): Promise<{ success: boolean; messageId?: string; error?: string }> {
    console.log('[QStash] Publishing location update:', { surveyorId, lat, lng });
    return this.publish({
      type: 'location',
      surveyorId,
      lat,
      lng,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Publish status update to QStash
   */
  async publishStatus(surveyorId: number, status: SurveyorStatus): Promise<{ success: boolean; messageId?: string; error?: string }> {
    console.log('[QStash] Publishing status update:', { surveyorId, status });
    return this.publish({
      type: 'status',
      surveyorId,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Publish combined location and status update to QStash
   */
  async publishLocationAndStatus(
    surveyorId: number,
    lat: number,
    lng: number,
    status: SurveyorStatus
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    console.log('[QStash] Publishing location+status update:', { surveyorId, lat, lng, status });
    return this.publish({
      type: 'location_status',
      surveyorId,
      lat,
      lng,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Publish appointment response to QStash
   */
  async publishAppointmentResponse(
    appointmentId: number,
    surveyorId: number,
    response: AppointmentResponseStatus
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    console.log('[QStash] Publishing appointment response:', { appointmentId, surveyorId, response });
    return this.publish({
      type: 'appointment_response',
      appointmentId,
      surveyorId,
      response,
      timestamp: new Date().toISOString(),
    });
  }
}

export const qstashService = new QStashService();
