package com.cmx.surveyor.calendar

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.cmx.surveyor.calendar.api.ApiService
import com.cmx.surveyor.calendar.data.DeviceRegistrationRequest
import com.cmx.surveyor.calendar.data.Surveyor
import com.cmx.surveyor.calendar.databinding.ActivityMainBinding
import com.cmx.surveyor.calendar.util.PreferencesManager
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var prefsManager: PreferencesManager
    private lateinit var notificationAdapter: NotificationAdapter

    private var surveyors: List<Surveyor> = emptyList()
    private var selectedSurveyor: Surveyor? = null

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        if (isGranted) {
            Log.d(TAG, "Notification permission granted")
        } else {
            Toast.makeText(this, "Notification permission denied", Toast.LENGTH_SHORT).show()
        }
    }

    companion object {
        private const val TAG = "MainActivity"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        prefsManager = PreferencesManager(this)

        setupUI()
        requestNotificationPermission()
        loadFcmToken()
        loadSurveyors()
    }

    override fun onResume() {
        super.onResume()
        loadNotifications()
    }

    private fun setupUI() {
        // Setup toolbar
        setSupportActionBar(binding.toolbar)

        // Setup notification recycler
        notificationAdapter = NotificationAdapter()
        binding.recyclerNotifications.apply {
            layoutManager = LinearLayoutManager(this@MainActivity)
            adapter = notificationAdapter
        }

        // Surveyor dropdown selection
        binding.surveyorDropdown.setOnItemClickListener { _, _, position, _ ->
            selectedSurveyor = surveyors[position]
            binding.btnRegister.isEnabled = true
        }

        // Register button
        binding.btnRegister.setOnClickListener {
            selectedSurveyor?.let { surveyor ->
                registerDevice(surveyor)
            }
        }

        // Check if already registered
        if (prefsManager.isDeviceRegistered && prefsManager.surveyorId > 0) {
            showRegisteredState()
        }
    }

    private fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            when {
                ContextCompat.checkSelfPermission(
                    this,
                    Manifest.permission.POST_NOTIFICATIONS
                ) == PackageManager.PERMISSION_GRANTED -> {
                    Log.d(TAG, "Notification permission already granted")
                }
                else -> {
                    requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                }
            }
        }
    }

    private fun loadFcmToken() {
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (task.isSuccessful) {
                val token = task.result
                Log.d(TAG, "FCM Token: $token")
                prefsManager.fcmToken = token
            } else {
                Log.e(TAG, "Failed to get FCM token", task.exception)
            }
        }
    }

    private fun loadSurveyors() {
        showLoading(true)

        lifecycleScope.launch {
            try {
                val response = ApiService.getInstance().getSurveyors()
                if (response.isSuccessful) {
                    surveyors = response.body() ?: emptyList()
                    updateSurveyorDropdown()
                } else {
                    Log.e(TAG, "Failed to load surveyors: ${response.code()}")
                    Toast.makeText(this@MainActivity, "Failed to load surveyors", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading surveyors", e)
                Toast.makeText(this@MainActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                showLoading(false)
            }
        }
    }

    private fun updateSurveyorDropdown() {
        val surveyorNames = surveyors.map { "${it.name} (${it.type})" }
        val adapter = ArrayAdapter(this, android.R.layout.simple_dropdown_item_1line, surveyorNames)
        binding.surveyorDropdown.setAdapter(adapter)

        // If already registered, select the surveyor
        if (prefsManager.surveyorId > 0) {
            val index = surveyors.indexOfFirst { it.id == prefsManager.surveyorId }
            if (index >= 0) {
                binding.surveyorDropdown.setText(surveyorNames[index], false)
                selectedSurveyor = surveyors[index]
            }
        }
    }

    private fun registerDevice(surveyor: Surveyor) {
        val fcmToken = prefsManager.fcmToken
        if (fcmToken.isNullOrEmpty()) {
            Toast.makeText(this, "FCM token not available", Toast.LENGTH_SHORT).show()
            return
        }

        showLoading(true)

        lifecycleScope.launch {
            try {
                val request = DeviceRegistrationRequest(
                    surveyorId = surveyor.id,
                    fcmToken = fcmToken
                )

                val response = ApiService.getInstance().registerDevice(request)
                if (response.isSuccessful && response.body()?.success == true) {
                    prefsManager.surveyorId = surveyor.id
                    prefsManager.surveyorName = surveyor.name
                    prefsManager.isDeviceRegistered = true

                    Toast.makeText(this@MainActivity, getString(R.string.registered_success), Toast.LENGTH_SHORT).show()
                    showRegisteredState()
                } else {
                    val errorMsg = response.body()?.message ?: "Registration failed"
                    Toast.makeText(this@MainActivity, errorMsg, Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error registering device", e)
                Toast.makeText(this@MainActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                showLoading(false)
            }
        }
    }

    private fun showRegisteredState() {
        binding.cardStatus.visibility = View.VISIBLE
        binding.txtStatus.text = "Registered as: ${prefsManager.surveyorName}\n\n${getString(R.string.waiting_notifications)}"

        loadNotifications()
    }

    private fun loadNotifications() {
        val notifications = prefsManager.getNotifications()

        if (notifications.isEmpty()) {
            binding.txtRecentNotifications.visibility = View.GONE
            binding.recyclerNotifications.visibility = View.GONE
            binding.txtNoNotifications.visibility = if (prefsManager.isDeviceRegistered) View.VISIBLE else View.GONE
        } else {
            binding.txtRecentNotifications.visibility = View.VISIBLE
            binding.recyclerNotifications.visibility = View.VISIBLE
            binding.txtNoNotifications.visibility = View.GONE
            notificationAdapter.submitList(notifications)
        }
    }

    private fun showLoading(show: Boolean) {
        binding.loadingOverlay.visibility = if (show) View.VISIBLE else View.GONE
    }
}
