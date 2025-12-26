# CMX Surveyor Calendar - Database Schema Documentation

## Overview

This document provides a comprehensive overview of the database schema for the CMX Surveyor Calendar application. The database uses PostgreSQL and is managed via Liquibase migrations.

## Entity Relationship Diagram (ERD)

```
                                    +---------------------+
                                    |      surveyor       |
                                    +---------------------+
                                    | PK id               |
                                    | UK code             |
                                    |    display_name     |
                                    |    home_lat         |
                                    |    home_lng         |
                                    |    status           |
                                    |    surveyor_type    |
                                    |    email            |
                                    |    phone            |
                                    |    password         |
                                    |    current_lat      |
                                    |    current_lng      |
                                    |    current_status   |
                                    |    last_location_upd|
                                    +----------+----------+
                                               |
          +------------------------------------+------------------------------------+
          |                    |               |               |                   |
          v                    v               v               v                   v
+-------------------+  +---------------+  +------------+  +--------------+  +----------------+
|surveyor_availability|  | device_token  |  |dispatch_offer| | job_assignment|  |notification_log|
+-------------------+  +---------------+  +------------+  +--------------+  +----------------+
| PK id             |  | PK id         |  | PK id      |  | PK id        |  | PK id          |
| FK surveyor_id    |  | FK surveyor_id|  | FK surveyor_id| | FK surveyor_id|  | FK surveyor_id |
|    start_time     |  |    token      |  |    offer_group|  |    offer_group|  |    title       |
|    end_time       |  |    platform   |  |    fnol_id  |  |    fnol_id   |  |    body        |
|    state          |  |    created_at |  |    status   |  |    status    |  |    channel     |
|    source         |  |    updated_at |  |    created_at|  |    start_time|  |    event_type  |
|    response_status|  +---------------+  |    expires_at|  |    end_time  |  |    recipient   |
|    responded_at   |                     |    accepted_at|  |    created_at|  |    data        |
|    title          |                     +------------+  |    completed_at|  |    status      |
|    contacts       |                                     +--------------+  |    external_id |
|    description    |                                                       |    error_message|
|    updated_at     |                                                       |    created_at  |
+-------------------+                                                       +----------------+
                                               |
                                               v
                                    +---------------------+
                                    |surveyor_activity_log|
                                    +---------------------+
                                    | PK id               |
                                    | FK surveyor_id      |
                                    |    activity_type    |
                                    |    previous_value   |
                                    |    new_value        |
                                    |    appointment_id   |
                                    |    latitude         |
                                    |    longitude        |
                                    |    notes            |
                                    |    created_at       |
                                    +---------------------+
```

## Tables

### 1. surveyor

Main table for surveyor (field inspector) information.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | BIGINT | NO | auto_increment | Primary key |
| code | VARCHAR(32) | NO | - | Unique surveyor code (e.g., SVY-001) |
| display_name | VARCHAR(128) | NO | - | Full name of surveyor |
| home_lat | DECIMAL(9,6) | YES | - | Home location latitude |
| home_lng | DECIMAL(9,6) | YES | - | Home location longitude |
| status | VARCHAR(16) | NO | 'ACTIVE' | Account status (ACTIVE/INACTIVE) |
| surveyor_type | VARCHAR(32) | YES | - | Type (VEH_INSPECTOR, PROP_INSPECTOR) |
| email | VARCHAR(255) | YES | - | Email address (used for login) |
| phone | VARCHAR(32) | YES | - | Phone number |
| password | VARCHAR(255) | YES | - | Login password |
| current_lat | DECIMAL(9,6) | YES | - | Current GPS latitude |
| current_lng | DECIMAL(9,6) | YES | - | Current GPS longitude |
| current_status | VARCHAR(16) | YES | 'AVAILABLE' | Availability (AVAILABLE/BUSY/OFFLINE) |
| last_location_update | TIMESTAMP WITH TZ | YES | - | Last location update timestamp |

**Indexes:**
- Primary key on `id`
- Unique constraint on `code`
- Index on `email`

---

### 2. surveyor_availability

Appointments/calendar slots for surveyors.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | BIGINT | NO | auto_increment | Primary key |
| surveyor_id | BIGINT | NO | - | FK to surveyor.id |
| start_time | TIMESTAMP | NO | - | Appointment start time |
| end_time | TIMESTAMP | NO | - | Appointment end time |
| state | VARCHAR(16) | NO | - | Slot state (BUSY/AVAILABLE) |
| source | VARCHAR(16) | NO | - | Source (MANUAL/OUTLOOK/GOOGLE) |
| title | VARCHAR(512) | YES | - | Appointment title |
| contacts | VARCHAR(512) | YES | - | Contact information |
| description | TEXT | YES | - | Full description/notes |
| response_status | VARCHAR(16) | YES | 'PENDING' | Response (PENDING/ACCEPTED/REJECTED) |
| responded_at | TIMESTAMP WITH TZ | YES | - | When surveyor responded |
| updated_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- Primary key on `id`
- Composite index on `(surveyor_id, start_time, end_time)`
- Index on `response_status`

**Foreign Keys:**
- `fk_availability_surveyor`: surveyor_id -> surveyor(id)

---

### 3. device_token

Mobile device push notification tokens.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | BIGINT | NO | auto_increment | Primary key |
| surveyor_id | BIGINT | NO | - | FK to surveyor.id |
| token | VARCHAR(512) | NO | - | Push notification token (FCM/APNs) |
| platform | VARCHAR(16) | NO | - | Platform (ANDROID/IOS) |
| created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | Token registration time |
| updated_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | Last update time |

**Indexes:**
- Primary key on `id`
- Unique constraint on `(surveyor_id, token)`
- Index on `surveyor_id`

**Foreign Keys:**
- `fk_device_token_surveyor`: surveyor_id -> surveyor(id)

**Note:** This table stores push tokens registered when surveyors log in from the mobile app. If empty, it means no surveyors have logged in with push notifications enabled.

---

### 4. dispatch_offer

Job offers sent to surveyors with expiration.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | BIGINT | NO | auto_increment | Primary key |
| offer_group | UUID | NO | - | Groups related offers together |
| fnol_id | VARCHAR(64) | NO | - | First Notice of Loss ID |
| surveyor_id | BIGINT | NO | - | FK to surveyor.id |
| status | VARCHAR(16) | NO | - | Status (PENDING/ACCEPTED/CLOSED/EXPIRED) |
| created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | Offer creation time |
| expires_at | TIMESTAMP | NO | - | Offer expiration time |
| accepted_at | TIMESTAMP | YES | - | When offer was accepted |

**Indexes:**
- Primary key on `id`
- Index on `offer_group`
- Composite index on `(offer_group, status, expires_at)`

**Foreign Keys:**
- `fk_offer_surveyor`: surveyor_id -> surveyor(id)

**Note:** This table is used for the dispatch workflow where jobs are offered to multiple surveyors and first to accept gets the job. If empty, the dispatch workflow hasn't been used.

---

### 5. job_assignment

Confirmed job assignments to surveyors.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | BIGINT | NO | auto_increment | Primary key |
| offer_group | UUID | NO | - | Link to original offer group |
| fnol_id | VARCHAR(64) | NO | - | First Notice of Loss ID |
| surveyor_id | BIGINT | NO | - | FK to surveyor.id |
| status | VARCHAR(16) | NO | - | Status (ASSIGNED/COMPLETED/CANCELLED) |
| start_time | TIMESTAMP | NO | - | Job start time |
| end_time | TIMESTAMP | NO | - | Job end time |
| created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | Assignment creation time |
| completed_at | TIMESTAMP | YES | - | Job completion time |

**Indexes:**
- Primary key on `id`
- Composite index on `(surveyor_id, start_time, end_time)`

**Foreign Keys:**
- `fk_assignment_surveyor`: surveyor_id -> surveyor(id)

**Note:** Created when a dispatch offer is accepted. Tracks the lifecycle of assigned jobs from assignment to completion.

---

### 6. notification_log

Audit log for all notifications sent (Push, Email, SMS).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | BIGINT | NO | auto_increment | Primary key |
| surveyor_id | BIGINT | NO | - | FK to surveyor.id |
| title | VARCHAR(256) | NO | - | Notification title |
| body | TEXT | NO | - | Notification body/message |
| channel | VARCHAR(16) | NO | 'PUSH' | Channel (PUSH/EMAIL/SMS) |
| event_type | VARCHAR(64) | YES | - | Event type (APPOINTMENT_CREATED, etc.) |
| recipient | VARCHAR(512) | YES | - | Actual recipient (token/email/phone) |
| data | JSON | YES | - | Additional notification data |
| status | VARCHAR(32) | NO | - | Status (SENT/DELIVERED/FAILED) |
| external_id | VARCHAR(256) | YES | - | Provider ID (FCM message ID, Twilio SID) |
| error_message | TEXT | YES | - | Error details if failed |
| created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | Notification send time |

**Indexes:**
- Primary key on `id`
- Index on `surveyor_id`
- Index on `created_at`
- Index on `channel`
- Index on `event_type`
- Composite index on `(surveyor_id, channel, created_at)`

**Foreign Keys:**
- `fk_notification_log_surveyor`: surveyor_id -> surveyor(id)

**Supported Channels:**
- `PUSH` - Firebase Cloud Messaging (Android) / APNs (iOS)
- `EMAIL` - Email notifications
- `SMS` - SMS text messages

**Event Types:**
- `APPOINTMENT_CREATED` - New appointment assigned
- `APPOINTMENT_UPDATED` - Appointment details changed
- `APPOINTMENT_DELETED` - Appointment cancelled
- `DISPATCH_OFFER` - New job offer sent
- `TEST_NOTIFICATION` - Test notification

---

### 7. surveyor_activity_log

Real-time activity tracking for surveyors (for dispatcher dashboard).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | BIGINT | NO | auto_increment | Primary key |
| surveyor_id | BIGINT | NO | - | FK to surveyor.id |
| activity_type | VARCHAR(32) | NO | - | Type (STATUS_CHANGE/JOB_UPDATE/LOGIN/LOGOUT) |
| previous_value | VARCHAR(64) | YES | - | Previous state/status |
| new_value | VARCHAR(64) | NO | - | New state/status |
| appointment_id | BIGINT | YES | - | Related appointment ID |
| latitude | DECIMAL(9,6) | YES | - | Location latitude at time of activity |
| longitude | DECIMAL(9,6) | YES | - | Location longitude at time of activity |
| notes | TEXT | YES | - | Additional notes |
| created_at | TIMESTAMP WITH TZ | NO | CURRENT_TIMESTAMP | Activity timestamp |

**Indexes:**
- Primary key on `id`
- Index on `surveyor_id`
- Index on `activity_type`
- Index on `created_at`
- Index on `appointment_id`

**Foreign Keys:**
- `fk_activity_surveyor`: surveyor_id -> surveyor(id)

**Activity Types:**
- `STATUS_CHANGE` - Surveyor availability changed (AVAILABLE/BUSY/OFFLINE)
- `JOB_UPDATE` - Job progress update (ON_WAY/ARRIVED/INSPECTING/COMPLETED)
- `LOGIN` - Surveyor logged in to mobile app
- `LOGOUT` - Surveyor logged out

---

## DDL (PostgreSQL)

```sql
-- =====================================================
-- SURVEYOR TABLE
-- =====================================================
CREATE TABLE surveyor (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    display_name VARCHAR(128) NOT NULL,
    home_lat DECIMAL(9,6),
    home_lng DECIMAL(9,6),
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    surveyor_type VARCHAR(32),
    email VARCHAR(255),
    phone VARCHAR(32),
    password VARCHAR(255),
    current_lat DECIMAL(9,6),
    current_lng DECIMAL(9,6),
    current_status VARCHAR(16) DEFAULT 'AVAILABLE',
    last_location_update TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- SURVEYOR_AVAILABILITY TABLE (Appointments)
-- =====================================================
CREATE TABLE surveyor_availability (
    id BIGSERIAL PRIMARY KEY,
    surveyor_id BIGINT NOT NULL REFERENCES surveyor(id),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    state VARCHAR(16) NOT NULL,
    source VARCHAR(16) NOT NULL,
    title VARCHAR(512),
    contacts VARCHAR(512),
    description TEXT,
    response_status VARCHAR(16) DEFAULT 'PENDING',
    responded_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ix_av_surveyor_time ON surveyor_availability(surveyor_id, start_time, end_time);
CREATE INDEX ix_av_response_status ON surveyor_availability(response_status);

-- =====================================================
-- DEVICE_TOKEN TABLE
-- =====================================================
CREATE TABLE device_token (
    id BIGSERIAL PRIMARY KEY,
    surveyor_id BIGINT NOT NULL REFERENCES surveyor(id),
    token VARCHAR(512) NOT NULL,
    platform VARCHAR(16) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(surveyor_id, token)
);

CREATE INDEX ix_device_token_surveyor ON device_token(surveyor_id);

-- =====================================================
-- DISPATCH_OFFER TABLE
-- =====================================================
CREATE TABLE dispatch_offer (
    id BIGSERIAL PRIMARY KEY,
    offer_group UUID NOT NULL,
    fnol_id VARCHAR(64) NOT NULL,
    surveyor_id BIGINT NOT NULL REFERENCES surveyor(id),
    status VARCHAR(16) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP
);

CREATE INDEX ix_offer_group ON dispatch_offer(offer_group);
CREATE INDEX ix_offer_group_status ON dispatch_offer(offer_group, status, expires_at);

-- =====================================================
-- JOB_ASSIGNMENT TABLE
-- =====================================================
CREATE TABLE job_assignment (
    id BIGSERIAL PRIMARY KEY,
    offer_group UUID NOT NULL,
    fnol_id VARCHAR(64) NOT NULL,
    surveyor_id BIGINT NOT NULL REFERENCES surveyor(id),
    status VARCHAR(16) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX ix_job_surveyor_time ON job_assignment(surveyor_id, start_time, end_time);

-- =====================================================
-- NOTIFICATION_LOG TABLE
-- =====================================================
CREATE TABLE notification_log (
    id BIGSERIAL PRIMARY KEY,
    surveyor_id BIGINT NOT NULL REFERENCES surveyor(id),
    title VARCHAR(256) NOT NULL,
    body TEXT NOT NULL,
    channel VARCHAR(16) NOT NULL DEFAULT 'PUSH',
    event_type VARCHAR(64),
    recipient VARCHAR(512),
    data JSON,
    status VARCHAR(32) NOT NULL,
    external_id VARCHAR(256),
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ix_notification_log_surveyor ON notification_log(surveyor_id);
CREATE INDEX ix_notification_log_created ON notification_log(created_at);
CREATE INDEX ix_notification_log_channel ON notification_log(channel);
CREATE INDEX ix_notification_log_event_type ON notification_log(event_type);
CREATE INDEX ix_notification_log_surveyor_channel ON notification_log(surveyor_id, channel, created_at);

-- =====================================================
-- SURVEYOR_ACTIVITY_LOG TABLE
-- =====================================================
CREATE TABLE surveyor_activity_log (
    id BIGSERIAL PRIMARY KEY,
    surveyor_id BIGINT NOT NULL REFERENCES surveyor(id),
    activity_type VARCHAR(32) NOT NULL,
    previous_value VARCHAR(64),
    new_value VARCHAR(64) NOT NULL,
    appointment_id BIGINT,
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_surveyor_id ON surveyor_activity_log(surveyor_id);
CREATE INDEX idx_activity_type ON surveyor_activity_log(activity_type);
CREATE INDEX idx_activity_created_at ON surveyor_activity_log(created_at);
CREATE INDEX idx_activity_appointment_id ON surveyor_activity_log(appointment_id);
```

## Table Relationships Summary

| Parent Table | Child Table | Relationship | Foreign Key |
|--------------|-------------|--------------|-------------|
| surveyor | surveyor_availability | 1:N | fk_availability_surveyor |
| surveyor | device_token | 1:N | fk_device_token_surveyor |
| surveyor | dispatch_offer | 1:N | fk_offer_surveyor |
| surveyor | job_assignment | 1:N | fk_assignment_surveyor |
| surveyor | notification_log | 1:N | fk_notification_log_surveyor |
| surveyor | surveyor_activity_log | 1:N | fk_activity_surveyor |

## Notes on Empty Tables

### Why is `job_assignment` empty?
This table is populated when a surveyor accepts a dispatch offer. If empty, either:
- The dispatch workflow hasn't been used
- Jobs are being managed through `surveyor_availability` directly

### Why is `device_token` empty?
This table is populated when surveyors log in from the mobile app with push notifications enabled. If empty:
- No surveyors have logged in from the mobile app yet
- Push notification permission was not granted on mobile devices

### Why is `dispatch_offer` empty?
This table is part of the multi-surveyor dispatch workflow where:
1. A job is offered to multiple surveyors
2. First surveyor to accept gets the job
3. Other offers are marked as CLOSED

If empty, jobs are being assigned directly through the calendar interface.

## Migration History

The schema is managed via Liquibase. Key migrations:
- `001-init-schema` - Initial tables (surveyor, availability, dispatch_offer, job_assignment)
- `003-device-tokens` - Added device_token and notification_log tables
- `012-notification-audit-enhancement` - Added channel, event_type, recipient to notification_log
- `013-mobile-features` - Added response_status, current location tracking
- `016/017-surveyor-activity-log` - Added surveyor_activity_log table

For the complete migration history, see `backend/src/main/resources/db/changelog/`.
