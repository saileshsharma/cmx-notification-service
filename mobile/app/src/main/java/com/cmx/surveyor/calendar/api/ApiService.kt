package com.cmx.surveyor.calendar.api

import com.cmx.surveyor.calendar.BuildConfig
import com.cmx.surveyor.calendar.data.DeviceRegistrationRequest
import com.cmx.surveyor.calendar.data.DeviceRegistrationResponse
import com.cmx.surveyor.calendar.data.Surveyor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import java.util.concurrent.TimeUnit

interface ApiService {

    @GET("surveyors")
    suspend fun getSurveyors(): Response<List<Surveyor>>

    @POST("mobile/device-token")
    suspend fun registerDevice(@Body request: DeviceRegistrationRequest): Response<Map<String, Any>>

    companion object {
        private var instance: ApiService? = null

        fun getInstance(): ApiService {
            if (instance == null) {
                val loggingInterceptor = HttpLoggingInterceptor().apply {
                    level = if (BuildConfig.DEBUG) {
                        HttpLoggingInterceptor.Level.BODY
                    } else {
                        HttpLoggingInterceptor.Level.NONE
                    }
                }

                val client = OkHttpClient.Builder()
                    .addInterceptor(loggingInterceptor)
                    .connectTimeout(30, TimeUnit.SECONDS)
                    .readTimeout(30, TimeUnit.SECONDS)
                    .writeTimeout(30, TimeUnit.SECONDS)
                    .build()

                val retrofit = Retrofit.Builder()
                    .baseUrl(BuildConfig.API_BASE_URL + "/")
                    .client(client)
                    .addConverterFactory(GsonConverterFactory.create())
                    .build()

                instance = retrofit.create(ApiService::class.java)
            }
            return instance!!
        }
    }
}
