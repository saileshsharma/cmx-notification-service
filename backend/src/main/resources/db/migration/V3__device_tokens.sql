-- Device tokens for FCM push notifications
CREATE TABLE device_token (
  id BIGSERIAL PRIMARY KEY,
  surveyor_id BIGINT NOT NULL REFERENCES surveyor(id),
  token VARCHAR(512) NOT NULL,
  platform VARCHAR(16) NOT NULL,  -- ANDROID / IOS
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (surveyor_id, token)
);

CREATE INDEX ix_device_token_surveyor ON device_token(surveyor_id);

-- Notification log for tracking sent notifications
CREATE TABLE notification_log (
  id BIGSERIAL PRIMARY KEY,
  surveyor_id BIGINT NOT NULL REFERENCES surveyor(id),
  title VARCHAR(256) NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  status VARCHAR(32) NOT NULL,  -- SENT / FAILED / FIREBASE_DISABLED / NO_TOKENS
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_notification_log_surveyor ON notification_log(surveyor_id);
CREATE INDEX ix_notification_log_created ON notification_log(created_at);
