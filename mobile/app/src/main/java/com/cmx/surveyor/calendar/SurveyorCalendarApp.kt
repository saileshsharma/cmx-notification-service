package com.cmx.surveyor.calendar

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import com.cmx.surveyor.calendar.util.NotificationHelper

class SurveyorCalendarApp : Application() {

    override fun onCreate() {
        super.onCreate()
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = getSystemService(NotificationManager::class.java)

            // Appointments channel
            val appointmentsChannel = NotificationChannel(
                NotificationHelper.CHANNEL_APPOINTMENTS,
                getString(R.string.notification_channel_name),
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = getString(R.string.notification_channel_description)
                enableVibration(true)
                enableLights(true)
            }

            notificationManager.createNotificationChannel(appointmentsChannel)
        }
    }
}
