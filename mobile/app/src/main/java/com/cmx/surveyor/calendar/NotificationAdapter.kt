package com.cmx.surveyor.calendar

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.cmx.surveyor.calendar.data.AppointmentNotification
import com.cmx.surveyor.calendar.data.NotificationType
import com.cmx.surveyor.calendar.databinding.ItemNotificationBinding
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class NotificationAdapter : ListAdapter<AppointmentNotification, NotificationAdapter.NotificationViewHolder>(
    NotificationDiffCallback()
) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): NotificationViewHolder {
        val binding = ItemNotificationBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return NotificationViewHolder(binding)
    }

    override fun onBindViewHolder(holder: NotificationViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class NotificationViewHolder(
        private val binding: ItemNotificationBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        private val dateFormat = SimpleDateFormat("MMM dd, yyyy HH:mm", Locale.getDefault())

        fun bind(notification: AppointmentNotification) {
            binding.txtNotificationTitle.text = notification.title
            binding.txtNotificationBody.text = notification.body
            binding.txtNotificationTime.text = dateFormat.format(Date(notification.timestamp))

            val indicatorColor = when (notification.type) {
                NotificationType.CREATED -> R.color.notification_created
                NotificationType.RESCHEDULED -> R.color.notification_rescheduled
                NotificationType.DELETED -> R.color.notification_deleted
            }
            binding.viewTypeIndicator.setBackgroundColor(
                binding.root.context.getColor(indicatorColor)
            )
        }
    }

    class NotificationDiffCallback : DiffUtil.ItemCallback<AppointmentNotification>() {
        override fun areItemsTheSame(
            oldItem: AppointmentNotification,
            newItem: AppointmentNotification
        ): Boolean = oldItem.id == newItem.id

        override fun areContentsTheSame(
            oldItem: AppointmentNotification,
            newItem: AppointmentNotification
        ): Boolean = oldItem == newItem
    }
}
