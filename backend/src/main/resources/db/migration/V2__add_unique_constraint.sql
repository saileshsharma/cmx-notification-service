-- Add unique constraint for upsert support
ALTER TABLE surveyor_availability
ADD CONSTRAINT uq_surveyor_availability_time
UNIQUE (surveyor_id, start_time, end_time);
