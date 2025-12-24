package com.cmx.surveyor.calendar.data

import com.google.gson.annotations.SerializedName

data class Surveyor(
    val id: Long,
    val name: String,
    val email: String?,
    val phone: String?,
    val type: String,
    val color: String?
)

data class DeviceRegistrationRequest(
    @SerializedName("surveyorId")
    val surveyorId: Long,
    @SerializedName("token")
    val token: String,
    @SerializedName("platform")
    val platform: String = "ANDROID"
)

data class DeviceRegistrationResponse(
    val ok: Boolean?,
    val success: Boolean?,
    val message: String?
) {
    fun isSuccessful(): Boolean = ok == true || success == true
}

data class AppointmentNotification(
    val id: String,
    val type: NotificationType,
    val title: String,
    val body: String,
    val appointmentId: Long?,
    val timestamp: Long = System.currentTimeMillis()
)

enum class NotificationType {
    CREATED,
    RESCHEDULED,
    DELETED
}
