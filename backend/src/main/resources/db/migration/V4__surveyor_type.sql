-- Add surveyor type (INTERNAL/EXTERNAL)
ALTER TABLE surveyor ADD COLUMN surveyor_type VARCHAR(16) NOT NULL DEFAULT 'INTERNAL';

-- Update sample data
UPDATE surveyor SET surveyor_type = 'INTERNAL' WHERE id = 1;
UPDATE surveyor SET surveyor_type = 'EXTERNAL' WHERE id = 2;
UPDATE surveyor SET surveyor_type = 'INTERNAL' WHERE id = 3;

-- Add more sample surveyors for testing
INSERT INTO surveyor (code, display_name, home_lat, home_lng, surveyor_type) VALUES
('SVY-004', 'David Wilson', 1.340000, 103.850000, 'EXTERNAL'),
('SVY-005', 'Emma Brown', 1.320000, 103.870000, 'INTERNAL'),
('SVY-006', 'James Lee', 1.380000, 103.750000, 'EXTERNAL'),
('SVY-007', 'Sophia Wang', 1.290000, 103.820000, 'INTERNAL'),
('SVY-008', 'Oliver Tan', 1.370000, 103.880000, 'EXTERNAL');

CREATE INDEX ix_surveyor_type ON surveyor(surveyor_type);
