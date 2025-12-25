-- Add columns for mobile app features: location tracking and appointment response

-- Add response tracking to surveyor_availability
ALTER TABLE surveyor_availability ADD COLUMN IF NOT EXISTS response_status VARCHAR(16) DEFAULT 'PENDING';
ALTER TABLE surveyor_availability ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;

-- Add title and description if not exists (for appointment details)
ALTER TABLE surveyor_availability ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE surveyor_availability ADD COLUMN IF NOT EXISTS description TEXT;

-- Add current location and status tracking to surveyor
ALTER TABLE surveyor ADD COLUMN IF NOT EXISTS current_lat NUMERIC(9,6);
ALTER TABLE surveyor ADD COLUMN IF NOT EXISTS current_lng NUMERIC(9,6);
ALTER TABLE surveyor ADD COLUMN IF NOT EXISTS current_status VARCHAR(16) DEFAULT 'AVAILABLE';
ALTER TABLE surveyor ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMPTZ;

-- Add email and phone if not exists
ALTER TABLE surveyor ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE surveyor ADD COLUMN IF NOT EXISTS phone VARCHAR(32);

-- Create index for response status queries
CREATE INDEX IF NOT EXISTS ix_av_response_status ON surveyor_availability(response_status);

-- Update existing appointments to have PENDING response status
UPDATE surveyor_availability SET response_status = 'PENDING' WHERE response_status IS NULL;
