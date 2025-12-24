package com.cmx.surveyor.calendar.util

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.cmx.surveyor.calendar.MainActivity
import com.cmx.surveyor.calendar.R
import com.cmx.surveyor.calendar.data.NotificationType

object NotificationHelper {
    const val CHANNEL_APPOINTMENTS = "appointments"

    fun showNotification(
        context: Context,
        title: String,
        body: String,
        type: NotificationType,
        appointmentId: Long? = null
    ) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            appointmentId?.let { putExtra("appointmentId", it) }
            putExtra("notificationType", type.name)
        }

        val pendingIntent = PendingIntent.getActivity(
            context,
            appointmentId?.toInt() ?: 0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val color = when (type) {
            NotificationType.CREATED -> context.getColor(R.color.notification_created)
            NotificationType.RESCHEDULED -> context.getColor(R.color.notification_rescheduled)
            NotificationType.DELETED -> context.getColor(R.color.notification_deleted)
        }

        val notification = NotificationCompat.Builder(context, CHANNEL_APPOINTMENTS)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setColor(color)
            .setContentIntent(pendingIntent)
            .build()

        notificationManager.notify(appointmentId?.toInt() ?: System.currentTimeMillis().toInt(), notification)
    }
}
