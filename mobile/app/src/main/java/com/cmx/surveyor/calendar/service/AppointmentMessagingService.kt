package com.cmx.surveyor.calendar.service

import android.util.Log
import com.cmx.surveyor.calendar.data.AppointmentNotification
import com.cmx.surveyor.calendar.data.NotificationType
import com.cmx.surveyor.calendar.util.NotificationHelper
import com.cmx.surveyor.calendar.util.PreferencesManager
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import java.util.UUID

class AppointmentMessagingService : FirebaseMessagingService() {

    companion object {
        private const val TAG = "FCMService"
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "New FCM token: $token")

        // Save the new token
        val prefsManager = PreferencesManager(this)
        prefsManager.fcmToken = token

        // If device was registered, mark it as needing re-registration
        if (prefsManager.isDeviceRegistered) {
            prefsManager.isDeviceRegistered = false
        }
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        Log.d(TAG, "Message received from: ${remoteMessage.from}")

        // Extract data from the message
        val data = remoteMessage.data
        val notification = remoteMessage.notification

        val title = notification?.title ?: data["title"] ?: "Appointment Update"
        val body = notification?.body ?: data["body"] ?: ""
        val typeStr = data["type"] ?: "CREATED"
        val appointmentIdStr = data["appointmentId"]

        val type = try {
            NotificationType.valueOf(typeStr.uppercase())
        } catch (e: Exception) {
            NotificationType.CREATED
        }

        val appointmentId = appointmentIdStr?.toLongOrNull()

        Log.d(TAG, "Notification - Title: $title, Body: $body, Type: $type, AppointmentId: $appointmentId")

        // Save notification to history
        val prefsManager = PreferencesManager(this)
        val notificationRecord = AppointmentNotification(
            id = UUID.randomUUID().toString(),
            type = type,
            title = title,
            body = body,
            appointmentId = appointmentId,
            timestamp = System.currentTimeMillis()
        )
        prefsManager.addNotification(notificationRecord)

        // Show the notification
        NotificationHelper.showNotification(
            context = this,
            title = title,
            body = body,
            type = type,
            appointmentId = appointmentId
        )
    }
}
