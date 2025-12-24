-- PostgreSQL schema for surveyor availability & dispatch offers

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE surveyor (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(32) NOT NULL UNIQUE,
  display_name VARCHAR(128) NOT NULL,
  home_lat NUMERIC(9,6),
  home_lng NUMERIC(9,6),
  status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE'
);

-- Hourly availability slots (source=MOBILE) plus system blocks (source=CMX)
CREATE TABLE surveyor_availability (
  id BIGSERIAL PRIMARY KEY,
  surveyor_id BIGINT NOT NULL REFERENCES surveyor(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time   TIMESTAMPTZ NOT NULL,
  state VARCHAR(16) NOT NULL,   -- AVAILABLE / BUSY / OFFLINE
  source VARCHAR(16) NOT NULL,  -- MOBILE / CMX
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_av_surveyor_time ON surveyor_availability(surveyor_id, start_time, end_time);

-- Offers with TTL
CREATE TABLE dispatch_offer (
  id BIGSERIAL PRIMARY KEY,
  offer_group UUID NOT NULL,
  fnol_id VARCHAR(64) NOT NULL,
  surveyor_id BIGINT NOT NULL REFERENCES surveyor(id),
  status VARCHAR(16) NOT NULL, -- PENDING / ACCEPTED / CLOSED / EXPIRED
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ NULL
);
CREATE INDEX ix_offer_group ON dispatch_offer(offer_group);
CREATE INDEX ix_offer_group_status ON dispatch_offer(offer_group, status, expires_at);

-- Assignment created when someone accepts
CREATE TABLE job_assignment (
  id BIGSERIAL PRIMARY KEY,
  offer_group UUID NOT NULL,
  fnol_id VARCHAR(64) NOT NULL,
  surveyor_id BIGINT NOT NULL REFERENCES surveyor(id),
  status VARCHAR(16) NOT NULL, -- ASSIGNED / COMPLETED / CANCELLED
  start_time TIMESTAMPTZ NOT NULL,
  end_time   TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ NULL
);
CREATE INDEX ix_job_surveyor_time ON job_assignment(surveyor_id, start_time, end_time);

-- Seed
INSERT INTO surveyor (code, display_name, home_lat, home_lng) VALUES
('SVY-001', 'John Smith', 1.352100, 103.819800),
('SVY-002', 'Sarah Johnson', 1.300000, 103.800000),
('SVY-003', 'Michael Chen', 1.360000, 103.900000);
