package com.cmx.surveyor.calendar.util

import android.content.Context
import android.content.SharedPreferences
import com.cmx.surveyor.calendar.data.AppointmentNotification
import com.cmx.surveyor.calendar.data.NotificationType
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

class PreferencesManager(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    private val gson = Gson()

    companion object {
        private const val PREFS_NAME = "surveyor_calendar_prefs"
        private const val KEY_SURVEYOR_ID = "surveyor_id"
        private const val KEY_SURVEYOR_NAME = "surveyor_name"
        private const val KEY_FCM_TOKEN = "fcm_token"
        private const val KEY_DEVICE_REGISTERED = "device_registered"
        private const val KEY_NOTIFICATIONS = "notifications"
        private const val MAX_NOTIFICATIONS = 50
    }

    var surveyorId: Long
        get() = prefs.getLong(KEY_SURVEYOR_ID, -1)
        set(value) = prefs.edit().putLong(KEY_SURVEYOR_ID, value).apply()

    var surveyorName: String?
        get() = prefs.getString(KEY_SURVEYOR_NAME, null)
        set(value) = prefs.edit().putString(KEY_SURVEYOR_NAME, value).apply()

    var fcmToken: String?
        get() = prefs.getString(KEY_FCM_TOKEN, null)
        set(value) = prefs.edit().putString(KEY_FCM_TOKEN, value).apply()

    var isDeviceRegistered: Boolean
        get() = prefs.getBoolean(KEY_DEVICE_REGISTERED, false)
        set(value) = prefs.edit().putBoolean(KEY_DEVICE_REGISTERED, value).apply()

    fun addNotification(notification: AppointmentNotification) {
        val notifications = getNotifications().toMutableList()
        notifications.add(0, notification)

        // Keep only the last MAX_NOTIFICATIONS
        val trimmed = notifications.take(MAX_NOTIFICATIONS)

        val json = gson.toJson(trimmed)
        prefs.edit().putString(KEY_NOTIFICATIONS, json).apply()
    }

    fun getNotifications(): List<AppointmentNotification> {
        val json = prefs.getString(KEY_NOTIFICATIONS, null) ?: return emptyList()
        val type = object : TypeToken<List<AppointmentNotification>>() {}.type
        return try {
            gson.fromJson(json, type) ?: emptyList()
        } catch (e: Exception) {
            emptyList()
        }
    }

    fun clearNotifications() {
        prefs.edit().remove(KEY_NOTIFICATIONS).apply()
    }

    fun clearAll() {
        prefs.edit().clear().apply()
    }
}
