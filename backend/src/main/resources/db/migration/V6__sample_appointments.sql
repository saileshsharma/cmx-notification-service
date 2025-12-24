-- Add random sample appointments for all surveyors
-- Only BUSY (appointments) and OFFLINE (not working) - empty time = available
-- Times spread from 8 AM to 9 PM with varied durations (1-3 hours)

-- Surveyor 1 - John Smith
INSERT INTO surveyor_availability (surveyor_id, start_time, end_time, state, source) VALUES
(1, NOW() + INTERVAL '1 day' + INTERVAL '9 hours', NOW() + INTERVAL '1 day' + INTERVAL '11 hours', 'BUSY', 'CMX'),
(1, NOW() + INTERVAL '1 day' + INTERVAL '14 hours', NOW() + INTERVAL '1 day' + INTERVAL '16 hours', 'BUSY', 'CMX'),
(1, NOW() + INTERVAL '3 days' + INTERVAL '18 hours', NOW() + INTERVAL '3 days' + INTERVAL '20 hours', 'BUSY', 'CMX'),
(1, NOW() + INTERVAL '5 days' + INTERVAL '11 hours', NOW() + INTERVAL '5 days' + INTERVAL '13 hours', 'BUSY', 'CMX'),
(1, NOW() + INTERVAL '7 days' + INTERVAL '8 hours', NOW() + INTERVAL '7 days' + INTERVAL '12 hours', 'OFFLINE', 'CMX'),
(1, NOW() + INTERVAL '9 days' + INTERVAL '15 hours', NOW() + INTERVAL '9 days' + INTERVAL '18 hours', 'BUSY', 'CMX');

-- Surveyor 2 - Sarah Johnson
INSERT INTO surveyor_availability (surveyor_id, start_time, end_time, state, source) VALUES
(2, NOW() + INTERVAL '1 day' + INTERVAL '10 hours', NOW() + INTERVAL '1 day' + INTERVAL '12 hours', 'BUSY', 'CMX'),
(2, NOW() + INTERVAL '2 days' + INTERVAL '17 hours', NOW() + INTERVAL '2 days' + INTERVAL '19 hours', 'BUSY', 'CMX'),
(2, NOW() + INTERVAL '4 days' + INTERVAL '8 hours', NOW() + INTERVAL '4 days' + INTERVAL '11 hours', 'BUSY', 'CMX'),
(2, NOW() + INTERVAL '6 days' + INTERVAL '19 hours', NOW() + INTERVAL '6 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(2, NOW() + INTERVAL '8 days' + INTERVAL '8 hours', NOW() + INTERVAL '8 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX');

-- Surveyor 3 - Michael Chen
INSERT INTO surveyor_availability (surveyor_id, start_time, end_time, state, source) VALUES
(3, NOW() + INTERVAL '1 day' + INTERVAL '12 hours', NOW() + INTERVAL '1 day' + INTERVAL '14 hours', 'BUSY', 'CMX'),
(3, NOW() + INTERVAL '2 days' + INTERVAL '18 hours', NOW() + INTERVAL '2 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(3, NOW() + INTERVAL '3 days' + INTERVAL '8 hours', NOW() + INTERVAL '3 days' + INTERVAL '10 hours', 'BUSY', 'CMX'),
(3, NOW() + INTERVAL '5 days' + INTERVAL '16 hours', NOW() + INTERVAL '5 days' + INTERVAL '18 hours', 'BUSY', 'CMX'),
(3, NOW() + INTERVAL '9 days' + INTERVAL '8 hours', NOW() + INTERVAL '9 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(3, NOW() + INTERVAL '12 days' + INTERVAL '14 hours', NOW() + INTERVAL '12 days' + INTERVAL '17 hours', 'BUSY', 'CMX');

-- Surveyor 4 - David Wilson
INSERT INTO surveyor_availability (surveyor_id, start_time, end_time, state, source) VALUES
(4, NOW() + INTERVAL '1 day' + INTERVAL '17 hours', NOW() + INTERVAL '1 day' + INTERVAL '19 hours', 'BUSY', 'CMX'),
(4, NOW() + INTERVAL '3 days' + INTERVAL '9 hours', NOW() + INTERVAL '3 days' + INTERVAL '12 hours', 'BUSY', 'CMX'),
(4, NOW() + INTERVAL '4 days' + INTERVAL '19 hours', NOW() + INTERVAL '4 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(4, NOW() + INTERVAL '6 days' + INTERVAL '8 hours', NOW() + INTERVAL '6 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(4, NOW() + INTERVAL '10 days' + INTERVAL '11 hours', NOW() + INTERVAL '10 days' + INTERVAL '13 hours', 'BUSY', 'CMX');

-- Surveyor 5 - Emma Brown
INSERT INTO surveyor_availability (surveyor_id, start_time, end_time, state, source) VALUES
(5, NOW() + INTERVAL '1 day' + INTERVAL '8 hours', NOW() + INTERVAL '1 day' + INTERVAL '11 hours', 'BUSY', 'CMX'),
(5, NOW() + INTERVAL '2 days' + INTERVAL '16 hours', NOW() + INTERVAL '2 days' + INTERVAL '18 hours', 'BUSY', 'CMX'),
(5, NOW() + INTERVAL '4 days' + INTERVAL '19 hours', NOW() + INTERVAL '4 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(5, NOW() + INTERVAL '5 days' + INTERVAL '10 hours', NOW() + INTERVAL '5 days' + INTERVAL '12 hours', 'BUSY', 'CMX'),
(5, NOW() + INTERVAL '7 days' + INTERVAL '8 hours', NOW() + INTERVAL '7 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX');

-- Surveyor 6 - James Lee
INSERT INTO surveyor_availability (surveyor_id, start_time, end_time, state, source) VALUES
(6, NOW() + INTERVAL '1 day' + INTERVAL '14 hours', NOW() + INTERVAL '1 day' + INTERVAL '17 hours', 'BUSY', 'CMX'),
(6, NOW() + INTERVAL '2 days' + INTERVAL '19 hours', NOW() + INTERVAL '2 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(6, NOW() + INTERVAL '3 days' + INTERVAL '8 hours', NOW() + INTERVAL '3 days' + INTERVAL '10 hours', 'BUSY', 'CMX'),
(6, NOW() + INTERVAL '6 days' + INTERVAL '11 hours', NOW() + INTERVAL '6 days' + INTERVAL '14 hours', 'BUSY', 'CMX'),
(6, NOW() + INTERVAL '10 days' + INTERVAL '8 hours', NOW() + INTERVAL '10 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX');

-- Surveyor 7 - Sophia Wang
INSERT INTO surveyor_availability (surveyor_id, start_time, end_time, state, source) VALUES
(7, NOW() + INTERVAL '1 day' + INTERVAL '18 hours', NOW() + INTERVAL '1 day' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(7, NOW() + INTERVAL '3 days' + INTERVAL '8 hours', NOW() + INTERVAL '3 days' + INTERVAL '11 hours', 'BUSY', 'CMX'),
(7, NOW() + INTERVAL '5 days' + INTERVAL '15 hours', NOW() + INTERVAL '5 days' + INTERVAL '17 hours', 'BUSY', 'CMX'),
(7, NOW() + INTERVAL '6 days' + INTERVAL '10 hours', NOW() + INTERVAL '6 days' + INTERVAL '12 hours', 'BUSY', 'CMX'),
(7, NOW() + INTERVAL '11 days' + INTERVAL '8 hours', NOW() + INTERVAL '11 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX');

-- Surveyor 8 - Oliver Tan
INSERT INTO surveyor_availability (surveyor_id, start_time, end_time, state, source) VALUES
(8, NOW() + INTERVAL '1 day' + INTERVAL '9 hours', NOW() + INTERVAL '1 day' + INTERVAL '11 hours', 'BUSY', 'CMX'),
(8, NOW() + INTERVAL '2 days' + INTERVAL '18 hours', NOW() + INTERVAL '2 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(8, NOW() + INTERVAL '4 days' + INTERVAL '13 hours', NOW() + INTERVAL '4 days' + INTERVAL '16 hours', 'BUSY', 'CMX'),
(8, NOW() + INTERVAL '5 days' + INTERVAL '8 hours', NOW() + INTERVAL '5 days' + INTERVAL '10 hours', 'BUSY', 'CMX'),
(8, NOW() + INTERVAL '10 days' + INTERVAL '8 hours', NOW() + INTERVAL '10 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX');

-- Surveyors 9-18 with BUSY and OFFLINE only
INSERT INTO surveyor_availability (surveyor_id, start_time, end_time, state, source) VALUES
(9, NOW() + INTERVAL '1 day' + INTERVAL '8 hours', NOW() + INTERVAL '1 day' + INTERVAL '11 hours', 'BUSY', 'CMX'),
(9, NOW() + INTERVAL '3 days' + INTERVAL '17 hours', NOW() + INTERVAL '3 days' + INTERVAL '20 hours', 'BUSY', 'CMX'),
(9, NOW() + INTERVAL '5 days' + INTERVAL '12 hours', NOW() + INTERVAL '5 days' + INTERVAL '14 hours', 'BUSY', 'CMX'),
(9, NOW() + INTERVAL '8 days' + INTERVAL '19 hours', NOW() + INTERVAL '8 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(9, NOW() + INTERVAL '12 days' + INTERVAL '8 hours', NOW() + INTERVAL '12 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(10, NOW() + INTERVAL '1 day' + INTERVAL '15 hours', NOW() + INTERVAL '1 day' + INTERVAL '18 hours', 'BUSY', 'CMX'),
(10, NOW() + INTERVAL '2 days' + INTERVAL '8 hours', NOW() + INTERVAL '2 days' + INTERVAL '10 hours', 'BUSY', 'CMX'),
(10, NOW() + INTERVAL '4 days' + INTERVAL '19 hours', NOW() + INTERVAL '4 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(10, NOW() + INTERVAL '6 days' + INTERVAL '10 hours', NOW() + INTERVAL '6 days' + INTERVAL '13 hours', 'BUSY', 'CMX'),
(10, NOW() + INTERVAL '9 days' + INTERVAL '8 hours', NOW() + INTERVAL '9 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(11, NOW() + INTERVAL '1 day' + INTERVAL '19 hours', NOW() + INTERVAL '1 day' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(11, NOW() + INTERVAL '2 days' + INTERVAL '9 hours', NOW() + INTERVAL '2 days' + INTERVAL '11 hours', 'BUSY', 'CMX'),
(11, NOW() + INTERVAL '5 days' + INTERVAL '14 hours', NOW() + INTERVAL '5 days' + INTERVAL '17 hours', 'BUSY', 'CMX'),
(11, NOW() + INTERVAL '7 days' + INTERVAL '8 hours', NOW() + INTERVAL '7 days' + INTERVAL '10 hours', 'BUSY', 'CMX'),
(11, NOW() + INTERVAL '13 days' + INTERVAL '8 hours', NOW() + INTERVAL '13 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(12, NOW() + INTERVAL '1 day' + INTERVAL '11 hours', NOW() + INTERVAL '1 day' + INTERVAL '14 hours', 'BUSY', 'CMX'),
(12, NOW() + INTERVAL '3 days' + INTERVAL '18 hours', NOW() + INTERVAL '3 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(12, NOW() + INTERVAL '4 days' + INTERVAL '8 hours', NOW() + INTERVAL '4 days' + INTERVAL '10 hours', 'BUSY', 'CMX'),
(12, NOW() + INTERVAL '7 days' + INTERVAL '15 hours', NOW() + INTERVAL '7 days' + INTERVAL '18 hours', 'BUSY', 'CMX'),
(12, NOW() + INTERVAL '9 days' + INTERVAL '8 hours', NOW() + INTERVAL '9 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(13, NOW() + INTERVAL '1 day' + INTERVAL '8 hours', NOW() + INTERVAL '1 day' + INTERVAL '10 hours', 'BUSY', 'CMX'),
(13, NOW() + INTERVAL '2 days' + INTERVAL '17 hours', NOW() + INTERVAL '2 days' + INTERVAL '20 hours', 'BUSY', 'CMX'),
(13, NOW() + INTERVAL '4 days' + INTERVAL '12 hours', NOW() + INTERVAL '4 days' + INTERVAL '15 hours', 'BUSY', 'CMX'),
(13, NOW() + INTERVAL '6 days' + INTERVAL '19 hours', NOW() + INTERVAL '6 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(13, NOW() + INTERVAL '12 days' + INTERVAL '8 hours', NOW() + INTERVAL '12 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(14, NOW() + INTERVAL '1 day' + INTERVAL '16 hours', NOW() + INTERVAL '1 day' + INTERVAL '19 hours', 'BUSY', 'CMX'),
(14, NOW() + INTERVAL '3 days' + INTERVAL '8 hours', NOW() + INTERVAL '3 days' + INTERVAL '11 hours', 'BUSY', 'CMX'),
(14, NOW() + INTERVAL '5 days' + INTERVAL '18 hours', NOW() + INTERVAL '5 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(14, NOW() + INTERVAL '7 days' + INTERVAL '10 hours', NOW() + INTERVAL '7 days' + INTERVAL '13 hours', 'BUSY', 'CMX'),
(14, NOW() + INTERVAL '10 days' + INTERVAL '8 hours', NOW() + INTERVAL '10 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(15, NOW() + INTERVAL '1 day' + INTERVAL '13 hours', NOW() + INTERVAL '1 day' + INTERVAL '16 hours', 'BUSY', 'CMX'),
(15, NOW() + INTERVAL '2 days' + INTERVAL '19 hours', NOW() + INTERVAL '2 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(15, NOW() + INTERVAL '4 days' + INTERVAL '8 hours', NOW() + INTERVAL '4 days' + INTERVAL '10 hours', 'BUSY', 'CMX'),
(15, NOW() + INTERVAL '6 days' + INTERVAL '11 hours', NOW() + INTERVAL '6 days' + INTERVAL '14 hours', 'BUSY', 'CMX'),
(15, NOW() + INTERVAL '9 days' + INTERVAL '8 hours', NOW() + INTERVAL '9 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(16, NOW() + INTERVAL '1 day' + INTERVAL '18 hours', NOW() + INTERVAL '1 day' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(16, NOW() + INTERVAL '3 days' + INTERVAL '10 hours', NOW() + INTERVAL '3 days' + INTERVAL '13 hours', 'BUSY', 'CMX'),
(16, NOW() + INTERVAL '5 days' + INTERVAL '8 hours', NOW() + INTERVAL '5 days' + INTERVAL '10 hours', 'BUSY', 'CMX'),
(16, NOW() + INTERVAL '8 days' + INTERVAL '14 hours', NOW() + INTERVAL '8 days' + INTERVAL '17 hours', 'BUSY', 'CMX'),
(16, NOW() + INTERVAL '11 days' + INTERVAL '8 hours', NOW() + INTERVAL '11 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(17, NOW() + INTERVAL '1 day' + INTERVAL '9 hours', NOW() + INTERVAL '1 day' + INTERVAL '12 hours', 'BUSY', 'CMX'),
(17, NOW() + INTERVAL '2 days' + INTERVAL '15 hours', NOW() + INTERVAL '2 days' + INTERVAL '18 hours', 'BUSY', 'CMX'),
(17, NOW() + INTERVAL '4 days' + INTERVAL '19 hours', NOW() + INTERVAL '4 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(17, NOW() + INTERVAL '7 days' + INTERVAL '8 hours', NOW() + INTERVAL '7 days' + INTERVAL '10 hours', 'BUSY', 'CMX'),
(17, NOW() + INTERVAL '9 days' + INTERVAL '8 hours', NOW() + INTERVAL '9 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(18, NOW() + INTERVAL '1 day' + INTERVAL '14 hours', NOW() + INTERVAL '1 day' + INTERVAL '17 hours', 'BUSY', 'CMX'),
(18, NOW() + INTERVAL '3 days' + INTERVAL '19 hours', NOW() + INTERVAL '3 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(18, NOW() + INTERVAL '5 days' + INTERVAL '9 hours', NOW() + INTERVAL '5 days' + INTERVAL '11 hours', 'BUSY', 'CMX'),
(18, NOW() + INTERVAL '6 days' + INTERVAL '16 hours', NOW() + INTERVAL '6 days' + INTERVAL '19 hours', 'BUSY', 'CMX'),
(18, NOW() + INTERVAL '10 days' + INTERVAL '8 hours', NOW() + INTERVAL '10 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX');

-- Surveyors 19-28
INSERT INTO surveyor_availability (surveyor_id, start_time, end_time, state, source) VALUES
(19, NOW() + INTERVAL '1 day' + INTERVAL '8 hours', NOW() + INTERVAL '1 day' + INTERVAL '11 hours', 'BUSY', 'CMX'),
(19, NOW() + INTERVAL '2 days' + INTERVAL '18 hours', NOW() + INTERVAL '2 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(19, NOW() + INTERVAL '5 days' + INTERVAL '12 hours', NOW() + INTERVAL '5 days' + INTERVAL '15 hours', 'BUSY', 'CMX'),
(19, NOW() + INTERVAL '7 days' + INTERVAL '16 hours', NOW() + INTERVAL '7 days' + INTERVAL '19 hours', 'BUSY', 'CMX'),
(19, NOW() + INTERVAL '11 days' + INTERVAL '8 hours', NOW() + INTERVAL '11 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(20, NOW() + INTERVAL '1 day' + INTERVAL '19 hours', NOW() + INTERVAL '1 day' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(20, NOW() + INTERVAL '3 days' + INTERVAL '8 hours', NOW() + INTERVAL '3 days' + INTERVAL '10 hours', 'BUSY', 'CMX'),
(20, NOW() + INTERVAL '4 days' + INTERVAL '14 hours', NOW() + INTERVAL '4 days' + INTERVAL '17 hours', 'BUSY', 'CMX'),
(20, NOW() + INTERVAL '8 days' + INTERVAL '10 hours', NOW() + INTERVAL '8 days' + INTERVAL '13 hours', 'BUSY', 'CMX'),
(20, NOW() + INTERVAL '10 days' + INTERVAL '8 hours', NOW() + INTERVAL '10 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(21, NOW() + INTERVAL '1 day' + INTERVAL '10 hours', NOW() + INTERVAL '1 day' + INTERVAL '13 hours', 'BUSY', 'CMX'),
(21, NOW() + INTERVAL '2 days' + INTERVAL '17 hours', NOW() + INTERVAL '2 days' + INTERVAL '20 hours', 'BUSY', 'CMX'),
(21, NOW() + INTERVAL '6 days' + INTERVAL '8 hours', NOW() + INTERVAL '6 days' + INTERVAL '10 hours', 'BUSY', 'CMX'),
(21, NOW() + INTERVAL '8 days' + INTERVAL '19 hours', NOW() + INTERVAL '8 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(21, NOW() + INTERVAL '12 days' + INTERVAL '8 hours', NOW() + INTERVAL '12 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(22, NOW() + INTERVAL '1 day' + INTERVAL '16 hours', NOW() + INTERVAL '1 day' + INTERVAL '19 hours', 'BUSY', 'CMX'),
(22, NOW() + INTERVAL '3 days' + INTERVAL '9 hours', NOW() + INTERVAL '3 days' + INTERVAL '12 hours', 'BUSY', 'CMX'),
(22, NOW() + INTERVAL '5 days' + INTERVAL '18 hours', NOW() + INTERVAL '5 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(22, NOW() + INTERVAL '9 days' + INTERVAL '8 hours', NOW() + INTERVAL '9 days' + INTERVAL '10 hours', 'BUSY', 'CMX'),
(22, NOW() + INTERVAL '11 days' + INTERVAL '8 hours', NOW() + INTERVAL '11 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(23, NOW() + INTERVAL '1 day' + INTERVAL '12 hours', NOW() + INTERVAL '1 day' + INTERVAL '15 hours', 'BUSY', 'CMX'),
(23, NOW() + INTERVAL '4 days' + INTERVAL '19 hours', NOW() + INTERVAL '4 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(23, NOW() + INTERVAL '6 days' + INTERVAL '8 hours', NOW() + INTERVAL '6 days' + INTERVAL '11 hours', 'BUSY', 'CMX'),
(23, NOW() + INTERVAL '8 days' + INTERVAL '15 hours', NOW() + INTERVAL '8 days' + INTERVAL '18 hours', 'BUSY', 'CMX'),
(23, NOW() + INTERVAL '13 days' + INTERVAL '8 hours', NOW() + INTERVAL '13 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(24, NOW() + INTERVAL '1 day' + INTERVAL '8 hours', NOW() + INTERVAL '1 day' + INTERVAL '11 hours', 'BUSY', 'CMX'),
(24, NOW() + INTERVAL '2 days' + INTERVAL '18 hours', NOW() + INTERVAL '2 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(24, NOW() + INTERVAL '5 days' + INTERVAL '13 hours', NOW() + INTERVAL '5 days' + INTERVAL '16 hours', 'BUSY', 'CMX'),
(24, NOW() + INTERVAL '7 days' + INTERVAL '9 hours', NOW() + INTERVAL '7 days' + INTERVAL '11 hours', 'BUSY', 'CMX'),
(24, NOW() + INTERVAL '11 days' + INTERVAL '8 hours', NOW() + INTERVAL '11 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(25, NOW() + INTERVAL '1 day' + INTERVAL '15 hours', NOW() + INTERVAL '1 day' + INTERVAL '18 hours', 'BUSY', 'CMX'),
(25, NOW() + INTERVAL '3 days' + INTERVAL '8 hours', NOW() + INTERVAL '3 days' + INTERVAL '10 hours', 'BUSY', 'CMX'),
(25, NOW() + INTERVAL '4 days' + INTERVAL '19 hours', NOW() + INTERVAL '4 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(25, NOW() + INTERVAL '6 days' + INTERVAL '11 hours', NOW() + INTERVAL '6 days' + INTERVAL '14 hours', 'BUSY', 'CMX'),
(25, NOW() + INTERVAL '9 days' + INTERVAL '8 hours', NOW() + INTERVAL '9 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(26, NOW() + INTERVAL '1 day' + INTERVAL '11 hours', NOW() + INTERVAL '1 day' + INTERVAL '14 hours', 'BUSY', 'CMX'),
(26, NOW() + INTERVAL '2 days' + INTERVAL '18 hours', NOW() + INTERVAL '2 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(26, NOW() + INTERVAL '5 days' + INTERVAL '8 hours', NOW() + INTERVAL '5 days' + INTERVAL '10 hours', 'BUSY', 'CMX'),
(26, NOW() + INTERVAL '8 days' + INTERVAL '14 hours', NOW() + INTERVAL '8 days' + INTERVAL '17 hours', 'BUSY', 'CMX'),
(26, NOW() + INTERVAL '10 days' + INTERVAL '8 hours', NOW() + INTERVAL '10 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(27, NOW() + INTERVAL '1 day' + INTERVAL '17 hours', NOW() + INTERVAL '1 day' + INTERVAL '20 hours', 'BUSY', 'CMX'),
(27, NOW() + INTERVAL '3 days' + INTERVAL '8 hours', NOW() + INTERVAL '3 days' + INTERVAL '11 hours', 'BUSY', 'CMX'),
(27, NOW() + INTERVAL '6 days' + INTERVAL '13 hours', NOW() + INTERVAL '6 days' + INTERVAL '16 hours', 'BUSY', 'CMX'),
(27, NOW() + INTERVAL '9 days' + INTERVAL '19 hours', NOW() + INTERVAL '9 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(27, NOW() + INTERVAL '11 days' + INTERVAL '8 hours', NOW() + INTERVAL '11 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(28, NOW() + INTERVAL '1 day' + INTERVAL '9 hours', NOW() + INTERVAL '1 day' + INTERVAL '12 hours', 'BUSY', 'CMX'),
(28, NOW() + INTERVAL '4 days' + INTERVAL '18 hours', NOW() + INTERVAL '4 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(28, NOW() + INTERVAL '5 days' + INTERVAL '8 hours', NOW() + INTERVAL '5 days' + INTERVAL '10 hours', 'BUSY', 'CMX'),
(28, NOW() + INTERVAL '7 days' + INTERVAL '15 hours', NOW() + INTERVAL '7 days' + INTERVAL '18 hours', 'BUSY', 'CMX'),
(28, NOW() + INTERVAL '10 days' + INTERVAL '8 hours', NOW() + INTERVAL '10 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX');

-- Surveyors 29-38
INSERT INTO surveyor_availability (surveyor_id, start_time, end_time, state, source) VALUES
(29, NOW() + INTERVAL '1 day' + INTERVAL '8 hours', NOW() + INTERVAL '1 day' + INTERVAL '11 hours', 'BUSY', 'CMX'),
(29, NOW() + INTERVAL '2 days' + INTERVAL '19 hours', NOW() + INTERVAL '2 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(29, NOW() + INTERVAL '4 days' + INTERVAL '12 hours', NOW() + INTERVAL '4 days' + INTERVAL '15 hours', 'BUSY', 'CMX'),
(29, NOW() + INTERVAL '6 days' + INTERVAL '16 hours', NOW() + INTERVAL '6 days' + INTERVAL '19 hours', 'BUSY', 'CMX'),
(29, NOW() + INTERVAL '9 days' + INTERVAL '8 hours', NOW() + INTERVAL '9 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(30, NOW() + INTERVAL '1 day' + INTERVAL '14 hours', NOW() + INTERVAL '1 day' + INTERVAL '17 hours', 'BUSY', 'CMX'),
(30, NOW() + INTERVAL '3 days' + INTERVAL '18 hours', NOW() + INTERVAL '3 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(30, NOW() + INTERVAL '5 days' + INTERVAL '8 hours', NOW() + INTERVAL '5 days' + INTERVAL '10 hours', 'BUSY', 'CMX'),
(30, NOW() + INTERVAL '8 days' + INTERVAL '11 hours', NOW() + INTERVAL '8 days' + INTERVAL '14 hours', 'BUSY', 'CMX'),
(30, NOW() + INTERVAL '11 days' + INTERVAL '8 hours', NOW() + INTERVAL '11 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(31, NOW() + INTERVAL '1 day' + INTERVAL '10 hours', NOW() + INTERVAL '1 day' + INTERVAL '13 hours', 'BUSY', 'CMX'),
(31, NOW() + INTERVAL '2 days' + INTERVAL '17 hours', NOW() + INTERVAL '2 days' + INTERVAL '20 hours', 'BUSY', 'CMX'),
(31, NOW() + INTERVAL '4 days' + INTERVAL '8 hours', NOW() + INTERVAL '4 days' + INTERVAL '10 hours', 'BUSY', 'CMX'),
(31, NOW() + INTERVAL '7 days' + INTERVAL '19 hours', NOW() + INTERVAL '7 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(31, NOW() + INTERVAL '12 days' + INTERVAL '8 hours', NOW() + INTERVAL '12 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(32, NOW() + INTERVAL '1 day' + INTERVAL '18 hours', NOW() + INTERVAL '1 day' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(32, NOW() + INTERVAL '3 days' + INTERVAL '9 hours', NOW() + INTERVAL '3 days' + INTERVAL '12 hours', 'BUSY', 'CMX'),
(32, NOW() + INTERVAL '5 days' + INTERVAL '15 hours', NOW() + INTERVAL '5 days' + INTERVAL '18 hours', 'BUSY', 'CMX'),
(32, NOW() + INTERVAL '6 days' + INTERVAL '8 hours', NOW() + INTERVAL '6 days' + INTERVAL '10 hours', 'BUSY', 'CMX'),
(32, NOW() + INTERVAL '9 days' + INTERVAL '8 hours', NOW() + INTERVAL '9 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(33, NOW() + INTERVAL '1 day' + INTERVAL '8 hours', NOW() + INTERVAL '1 day' + INTERVAL '11 hours', 'BUSY', 'CMX'),
(33, NOW() + INTERVAL '2 days' + INTERVAL '16 hours', NOW() + INTERVAL '2 days' + INTERVAL '19 hours', 'BUSY', 'CMX'),
(33, NOW() + INTERVAL '4 days' + INTERVAL '19 hours', NOW() + INTERVAL '4 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(33, NOW() + INTERVAL '7 days' + INTERVAL '10 hours', NOW() + INTERVAL '7 days' + INTERVAL '13 hours', 'BUSY', 'CMX'),
(33, NOW() + INTERVAL '10 days' + INTERVAL '8 hours', NOW() + INTERVAL '10 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(34, NOW() + INTERVAL '1 day' + INTERVAL '13 hours', NOW() + INTERVAL '1 day' + INTERVAL '16 hours', 'BUSY', 'CMX'),
(34, NOW() + INTERVAL '3 days' + INTERVAL '18 hours', NOW() + INTERVAL '3 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(34, NOW() + INTERVAL '6 days' + INTERVAL '8 hours', NOW() + INTERVAL '6 days' + INTERVAL '10 hours', 'BUSY', 'CMX'),
(34, NOW() + INTERVAL '8 days' + INTERVAL '11 hours', NOW() + INTERVAL '8 days' + INTERVAL '14 hours', 'BUSY', 'CMX'),
(34, NOW() + INTERVAL '11 days' + INTERVAL '8 hours', NOW() + INTERVAL '11 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(35, NOW() + INTERVAL '1 day' + INTERVAL '19 hours', NOW() + INTERVAL '1 day' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(35, NOW() + INTERVAL '2 days' + INTERVAL '8 hours', NOW() + INTERVAL '2 days' + INTERVAL '11 hours', 'BUSY', 'CMX'),
(35, NOW() + INTERVAL '5 days' + INTERVAL '14 hours', NOW() + INTERVAL '5 days' + INTERVAL '17 hours', 'BUSY', 'CMX'),
(35, NOW() + INTERVAL '7 days' + INTERVAL '17 hours', NOW() + INTERVAL '7 days' + INTERVAL '20 hours', 'BUSY', 'CMX'),
(35, NOW() + INTERVAL '9 days' + INTERVAL '8 hours', NOW() + INTERVAL '9 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(36, NOW() + INTERVAL '1 day' + INTERVAL '11 hours', NOW() + INTERVAL '1 day' + INTERVAL '14 hours', 'BUSY', 'CMX'),
(36, NOW() + INTERVAL '3 days' + INTERVAL '18 hours', NOW() + INTERVAL '3 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(36, NOW() + INTERVAL '4 days' + INTERVAL '8 hours', NOW() + INTERVAL '4 days' + INTERVAL '10 hours', 'BUSY', 'CMX'),
(36, NOW() + INTERVAL '6 days' + INTERVAL '15 hours', NOW() + INTERVAL '6 days' + INTERVAL '18 hours', 'BUSY', 'CMX'),
(36, NOW() + INTERVAL '10 days' + INTERVAL '8 hours', NOW() + INTERVAL '10 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(37, NOW() + INTERVAL '1 day' + INTERVAL '8 hours', NOW() + INTERVAL '1 day' + INTERVAL '11 hours', 'BUSY', 'CMX'),
(37, NOW() + INTERVAL '2 days' + INTERVAL '16 hours', NOW() + INTERVAL '2 days' + INTERVAL '19 hours', 'BUSY', 'CMX'),
(37, NOW() + INTERVAL '5 days' + INTERVAL '19 hours', NOW() + INTERVAL '5 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(37, NOW() + INTERVAL '8 days' + INTERVAL '10 hours', NOW() + INTERVAL '8 days' + INTERVAL '13 hours', 'BUSY', 'CMX'),
(37, NOW() + INTERVAL '11 days' + INTERVAL '8 hours', NOW() + INTERVAL '11 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(38, NOW() + INTERVAL '1 day' + INTERVAL '17 hours', NOW() + INTERVAL '1 day' + INTERVAL '20 hours', 'BUSY', 'CMX'),
(38, NOW() + INTERVAL '3 days' + INTERVAL '9 hours', NOW() + INTERVAL '3 days' + INTERVAL '11 hours', 'BUSY', 'CMX'),
(38, NOW() + INTERVAL '6 days' + INTERVAL '18 hours', NOW() + INTERVAL '6 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(38, NOW() + INTERVAL '9 days' + INTERVAL '8 hours', NOW() + INTERVAL '9 days' + INTERVAL '10 hours', 'BUSY', 'CMX'),
(38, NOW() + INTERVAL '12 days' + INTERVAL '8 hours', NOW() + INTERVAL '12 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX');

-- Surveyors 39-48
INSERT INTO surveyor_availability (surveyor_id, start_time, end_time, state, source) VALUES
(39, NOW() + INTERVAL '1 day' + INTERVAL '19 hours', NOW() + INTERVAL '1 day' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(39, NOW() + INTERVAL '2 days' + INTERVAL '8 hours', NOW() + INTERVAL '2 days' + INTERVAL '11 hours', 'BUSY', 'CMX'),
(39, NOW() + INTERVAL '4 days' + INTERVAL '14 hours', NOW() + INTERVAL '4 days' + INTERVAL '17 hours', 'BUSY', 'CMX'),
(39, NOW() + INTERVAL '7 days' + INTERVAL '18 hours', NOW() + INTERVAL '7 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(39, NOW() + INTERVAL '13 days' + INTERVAL '8 hours', NOW() + INTERVAL '13 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(40, NOW() + INTERVAL '1 day' + INTERVAL '9 hours', NOW() + INTERVAL '1 day' + INTERVAL '12 hours', 'BUSY', 'CMX'),
(40, NOW() + INTERVAL '3 days' + INTERVAL '17 hours', NOW() + INTERVAL '3 days' + INTERVAL '20 hours', 'BUSY', 'CMX'),
(40, NOW() + INTERVAL '5 days' + INTERVAL '19 hours', NOW() + INTERVAL '5 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(40, NOW() + INTERVAL '8 days' + INTERVAL '8 hours', NOW() + INTERVAL '8 days' + INTERVAL '10 hours', 'BUSY', 'CMX'),
(40, NOW() + INTERVAL '11 days' + INTERVAL '8 hours', NOW() + INTERVAL '11 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(41, NOW() + INTERVAL '1 day' + INTERVAL '14 hours', NOW() + INTERVAL '1 day' + INTERVAL '17 hours', 'BUSY', 'CMX'),
(41, NOW() + INTERVAL '2 days' + INTERVAL '19 hours', NOW() + INTERVAL '2 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(41, NOW() + INTERVAL '4 days' + INTERVAL '8 hours', NOW() + INTERVAL '4 days' + INTERVAL '10 hours', 'BUSY', 'CMX'),
(41, NOW() + INTERVAL '6 days' + INTERVAL '11 hours', NOW() + INTERVAL '6 days' + INTERVAL '14 hours', 'BUSY', 'CMX'),
(41, NOW() + INTERVAL '9 days' + INTERVAL '8 hours', NOW() + INTERVAL '9 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(42, NOW() + INTERVAL '1 day' + INTERVAL '8 hours', NOW() + INTERVAL '1 day' + INTERVAL '11 hours', 'BUSY', 'CMX'),
(42, NOW() + INTERVAL '3 days' + INTERVAL '16 hours', NOW() + INTERVAL '3 days' + INTERVAL '19 hours', 'BUSY', 'CMX'),
(42, NOW() + INTERVAL '5 days' + INTERVAL '19 hours', NOW() + INTERVAL '5 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(42, NOW() + INTERVAL '7 days' + INTERVAL '10 hours', NOW() + INTERVAL '7 days' + INTERVAL '13 hours', 'BUSY', 'CMX'),
(42, NOW() + INTERVAL '10 days' + INTERVAL '8 hours', NOW() + INTERVAL '10 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(43, NOW() + INTERVAL '1 day' + INTERVAL '18 hours', NOW() + INTERVAL '1 day' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(43, NOW() + INTERVAL '2 days' + INTERVAL '9 hours', NOW() + INTERVAL '2 days' + INTERVAL '12 hours', 'BUSY', 'CMX'),
(43, NOW() + INTERVAL '4 days' + INTERVAL '15 hours', NOW() + INTERVAL '4 days' + INTERVAL '18 hours', 'BUSY', 'CMX'),
(43, NOW() + INTERVAL '6 days' + INTERVAL '8 hours', NOW() + INTERVAL '6 days' + INTERVAL '10 hours', 'BUSY', 'CMX'),
(43, NOW() + INTERVAL '9 days' + INTERVAL '8 hours', NOW() + INTERVAL '9 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(44, NOW() + INTERVAL '1 day' + INTERVAL '12 hours', NOW() + INTERVAL '1 day' + INTERVAL '15 hours', 'BUSY', 'CMX'),
(44, NOW() + INTERVAL '3 days' + INTERVAL '18 hours', NOW() + INTERVAL '3 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(44, NOW() + INTERVAL '5 days' + INTERVAL '8 hours', NOW() + INTERVAL '5 days' + INTERVAL '11 hours', 'BUSY', 'CMX'),
(44, NOW() + INTERVAL '8 days' + INTERVAL '14 hours', NOW() + INTERVAL '8 days' + INTERVAL '17 hours', 'BUSY', 'CMX'),
(44, NOW() + INTERVAL '11 days' + INTERVAL '8 hours', NOW() + INTERVAL '11 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(45, NOW() + INTERVAL '1 day' + INTERVAL '8 hours', NOW() + INTERVAL '1 day' + INTERVAL '11 hours', 'BUSY', 'CMX'),
(45, NOW() + INTERVAL '2 days' + INTERVAL '17 hours', NOW() + INTERVAL '2 days' + INTERVAL '20 hours', 'BUSY', 'CMX'),
(45, NOW() + INTERVAL '4 days' + INTERVAL '19 hours', NOW() + INTERVAL '4 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(45, NOW() + INTERVAL '7 days' + INTERVAL '11 hours', NOW() + INTERVAL '7 days' + INTERVAL '14 hours', 'BUSY', 'CMX'),
(45, NOW() + INTERVAL '10 days' + INTERVAL '8 hours', NOW() + INTERVAL '10 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(46, NOW() + INTERVAL '1 day' + INTERVAL '16 hours', NOW() + INTERVAL '1 day' + INTERVAL '19 hours', 'BUSY', 'CMX'),
(46, NOW() + INTERVAL '3 days' + INTERVAL '8 hours', NOW() + INTERVAL '3 days' + INTERVAL '10 hours', 'BUSY', 'CMX'),
(46, NOW() + INTERVAL '6 days' + INTERVAL '18 hours', NOW() + INTERVAL '6 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(46, NOW() + INTERVAL '9 days' + INTERVAL '12 hours', NOW() + INTERVAL '9 days' + INTERVAL '15 hours', 'BUSY', 'CMX'),
(46, NOW() + INTERVAL '12 days' + INTERVAL '8 hours', NOW() + INTERVAL '12 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(47, NOW() + INTERVAL '1 day' + INTERVAL '10 hours', NOW() + INTERVAL '1 day' + INTERVAL '13 hours', 'BUSY', 'CMX'),
(47, NOW() + INTERVAL '2 days' + INTERVAL '18 hours', NOW() + INTERVAL '2 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(47, NOW() + INTERVAL '5 days' + INTERVAL '8 hours', NOW() + INTERVAL '5 days' + INTERVAL '10 hours', 'BUSY', 'CMX'),
(47, NOW() + INTERVAL '7 days' + INTERVAL '14 hours', NOW() + INTERVAL '7 days' + INTERVAL '17 hours', 'BUSY', 'CMX'),
(47, NOW() + INTERVAL '11 days' + INTERVAL '8 hours', NOW() + INTERVAL '11 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(48, NOW() + INTERVAL '1 day' + INTERVAL '19 hours', NOW() + INTERVAL '1 day' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(48, NOW() + INTERVAL '3 days' + INTERVAL '9 hours', NOW() + INTERVAL '3 days' + INTERVAL '12 hours', 'BUSY', 'CMX'),
(48, NOW() + INTERVAL '4 days' + INTERVAL '16 hours', NOW() + INTERVAL '4 days' + INTERVAL '19 hours', 'BUSY', 'CMX'),
(48, NOW() + INTERVAL '8 days' + INTERVAL '8 hours', NOW() + INTERVAL '8 days' + INTERVAL '10 hours', 'BUSY', 'CMX'),
(48, NOW() + INTERVAL '10 days' + INTERVAL '8 hours', NOW() + INTERVAL '10 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX');

-- Surveyors 49-58
INSERT INTO surveyor_availability (surveyor_id, start_time, end_time, state, source) VALUES
(49, NOW() + INTERVAL '1 day' + INTERVAL '8 hours', NOW() + INTERVAL '1 day' + INTERVAL '11 hours', 'BUSY', 'CMX'),
(49, NOW() + INTERVAL '2 days' + INTERVAL '18 hours', NOW() + INTERVAL '2 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(49, NOW() + INTERVAL '5 days' + INTERVAL '13 hours', NOW() + INTERVAL '5 days' + INTERVAL '16 hours', 'BUSY', 'CMX'),
(49, NOW() + INTERVAL '7 days' + INTERVAL '19 hours', NOW() + INTERVAL '7 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(49, NOW() + INTERVAL '12 days' + INTERVAL '8 hours', NOW() + INTERVAL '12 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(50, NOW() + INTERVAL '1 day' + INTERVAL '17 hours', NOW() + INTERVAL '1 day' + INTERVAL '20 hours', 'BUSY', 'CMX'),
(50, NOW() + INTERVAL '3 days' + INTERVAL '8 hours', NOW() + INTERVAL '3 days' + INTERVAL '10 hours', 'BUSY', 'CMX'),
(50, NOW() + INTERVAL '6 days' + INTERVAL '19 hours', NOW() + INTERVAL '6 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(50, NOW() + INTERVAL '9 days' + INTERVAL '11 hours', NOW() + INTERVAL '9 days' + INTERVAL '14 hours', 'BUSY', 'CMX'),
(50, NOW() + INTERVAL '11 days' + INTERVAL '8 hours', NOW() + INTERVAL '11 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(51, NOW() + INTERVAL '1 day' + INTERVAL '14 hours', NOW() + INTERVAL '1 day' + INTERVAL '17 hours', 'BUSY', 'CMX'),
(51, NOW() + INTERVAL '2 days' + INTERVAL '8 hours', NOW() + INTERVAL '2 days' + INTERVAL '10 hours', 'BUSY', 'CMX'),
(51, NOW() + INTERVAL '4 days' + INTERVAL '18 hours', NOW() + INTERVAL '4 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(51, NOW() + INTERVAL '7 days' + INTERVAL '19 hours', NOW() + INTERVAL '7 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(51, NOW() + INTERVAL '10 days' + INTERVAL '8 hours', NOW() + INTERVAL '10 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(52, NOW() + INTERVAL '1 day' + INTERVAL '9 hours', NOW() + INTERVAL '1 day' + INTERVAL '12 hours', 'BUSY', 'CMX'),
(52, NOW() + INTERVAL '3 days' + INTERVAL '19 hours', NOW() + INTERVAL '3 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(52, NOW() + INTERVAL '5 days' + INTERVAL '8 hours', NOW() + INTERVAL '5 days' + INTERVAL '10 hours', 'BUSY', 'CMX'),
(52, NOW() + INTERVAL '8 days' + INTERVAL '16 hours', NOW() + INTERVAL '8 days' + INTERVAL '19 hours', 'BUSY', 'CMX'),
(52, NOW() + INTERVAL '11 days' + INTERVAL '8 hours', NOW() + INTERVAL '11 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(53, NOW() + INTERVAL '1 day' + INTERVAL '18 hours', NOW() + INTERVAL '1 day' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(53, NOW() + INTERVAL '2 days' + INTERVAL '10 hours', NOW() + INTERVAL '2 days' + INTERVAL '13 hours', 'BUSY', 'CMX'),
(53, NOW() + INTERVAL '4 days' + INTERVAL '8 hours', NOW() + INTERVAL '4 days' + INTERVAL '10 hours', 'BUSY', 'CMX'),
(53, NOW() + INTERVAL '6 days' + INTERVAL '17 hours', NOW() + INTERVAL '6 days' + INTERVAL '20 hours', 'BUSY', 'CMX'),
(53, NOW() + INTERVAL '9 days' + INTERVAL '8 hours', NOW() + INTERVAL '9 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(54, NOW() + INTERVAL '1 day' + INTERVAL '8 hours', NOW() + INTERVAL '1 day' + INTERVAL '11 hours', 'BUSY', 'CMX'),
(54, NOW() + INTERVAL '3 days' + INTERVAL '15 hours', NOW() + INTERVAL '3 days' + INTERVAL '18 hours', 'BUSY', 'CMX'),
(54, NOW() + INTERVAL '5 days' + INTERVAL '19 hours', NOW() + INTERVAL '5 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(54, NOW() + INTERVAL '8 days' + INTERVAL '9 hours', NOW() + INTERVAL '8 days' + INTERVAL '12 hours', 'BUSY', 'CMX'),
(54, NOW() + INTERVAL '10 days' + INTERVAL '8 hours', NOW() + INTERVAL '10 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(55, NOW() + INTERVAL '1 day' + INTERVAL '13 hours', NOW() + INTERVAL '1 day' + INTERVAL '16 hours', 'BUSY', 'CMX'),
(55, NOW() + INTERVAL '2 days' + INTERVAL '19 hours', NOW() + INTERVAL '2 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(55, NOW() + INTERVAL '4 days' + INTERVAL '8 hours', NOW() + INTERVAL '4 days' + INTERVAL '10 hours', 'BUSY', 'CMX'),
(55, NOW() + INTERVAL '7 days' + INTERVAL '18 hours', NOW() + INTERVAL '7 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(55, NOW() + INTERVAL '9 days' + INTERVAL '8 hours', NOW() + INTERVAL '9 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(56, NOW() + INTERVAL '1 day' + INTERVAL '19 hours', NOW() + INTERVAL '1 day' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(56, NOW() + INTERVAL '3 days' + INTERVAL '8 hours', NOW() + INTERVAL '3 days' + INTERVAL '11 hours', 'BUSY', 'CMX'),
(56, NOW() + INTERVAL '6 days' + INTERVAL '14 hours', NOW() + INTERVAL '6 days' + INTERVAL '17 hours', 'BUSY', 'CMX'),
(56, NOW() + INTERVAL '9 days' + INTERVAL '18 hours', NOW() + INTERVAL '9 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(56, NOW() + INTERVAL '11 days' + INTERVAL '8 hours', NOW() + INTERVAL '11 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(57, NOW() + INTERVAL '1 day' + INTERVAL '10 hours', NOW() + INTERVAL '1 day' + INTERVAL '13 hours', 'BUSY', 'CMX'),
(57, NOW() + INTERVAL '2 days' + INTERVAL '17 hours', NOW() + INTERVAL '2 days' + INTERVAL '20 hours', 'BUSY', 'CMX'),
(57, NOW() + INTERVAL '5 days' + INTERVAL '19 hours', NOW() + INTERVAL '5 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(57, NOW() + INTERVAL '8 days' + INTERVAL '8 hours', NOW() + INTERVAL '8 days' + INTERVAL '10 hours', 'BUSY', 'CMX'),
(57, NOW() + INTERVAL '10 days' + INTERVAL '8 hours', NOW() + INTERVAL '10 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX'),
(58, NOW() + INTERVAL '1 day' + INTERVAL '16 hours', NOW() + INTERVAL '1 day' + INTERVAL '19 hours', 'BUSY', 'CMX'),
(58, NOW() + INTERVAL '3 days' + INTERVAL '19 hours', NOW() + INTERVAL '3 days' + INTERVAL '21 hours', 'BUSY', 'CMX'),
(58, NOW() + INTERVAL '4 days' + INTERVAL '8 hours', NOW() + INTERVAL '4 days' + INTERVAL '11 hours', 'BUSY', 'CMX'),
(58, NOW() + INTERVAL '7 days' + INTERVAL '12 hours', NOW() + INTERVAL '7 days' + INTERVAL '15 hours', 'BUSY', 'CMX'),
(58, NOW() + INTERVAL '9 days' + INTERVAL '8 hours', NOW() + INTERVAL '9 days' + INTERVAL '17 hours', 'OFFLINE', 'CMX');

-- Extended OFFLINE periods - surveyors on leave
-- Surveyor 3 (Michael Chen) - Out for 1 week (vacation starting in 2 days)
INSERT INTO surveyor_availability (surveyor_id, start_time, end_time, state, source) VALUES
(3, NOW() + INTERVAL '2 days' + INTERVAL '0 hours', NOW() + INTERVAL '2 days' + INTERVAL '23 hours 59 minutes', 'OFFLINE', 'CMX'),
(3, NOW() + INTERVAL '3 days' + INTERVAL '0 hours', NOW() + INTERVAL '3 days' + INTERVAL '23 hours 59 minutes', 'OFFLINE', 'CMX'),
(3, NOW() + INTERVAL '4 days' + INTERVAL '0 hours', NOW() + INTERVAL '4 days' + INTERVAL '23 hours 59 minutes', 'OFFLINE', 'CMX'),
(3, NOW() + INTERVAL '5 days' + INTERVAL '0 hours', NOW() + INTERVAL '5 days' + INTERVAL '23 hours 59 minutes', 'OFFLINE', 'CMX'),
(3, NOW() + INTERVAL '6 days' + INTERVAL '0 hours', NOW() + INTERVAL '6 days' + INTERVAL '23 hours 59 minutes', 'OFFLINE', 'CMX'),
(3, NOW() + INTERVAL '7 days' + INTERVAL '0 hours', NOW() + INTERVAL '7 days' + INTERVAL '23 hours 59 minutes', 'OFFLINE', 'CMX'),
(3, NOW() + INTERVAL '8 days' + INTERVAL '0 hours', NOW() + INTERVAL '8 days' + INTERVAL '23 hours 59 minutes', 'OFFLINE', 'CMX');

-- Surveyor 5 (Emma Brown) - Out for 2 days (sick leave starting tomorrow)
INSERT INTO surveyor_availability (surveyor_id, start_time, end_time, state, source) VALUES
(5, NOW() + INTERVAL '1 day' + INTERVAL '0 hours', NOW() + INTERVAL '1 day' + INTERVAL '23 hours 59 minutes', 'OFFLINE', 'CMX'),
(5, NOW() + INTERVAL '2 days' + INTERVAL '0 hours', NOW() + INTERVAL '2 days' + INTERVAL '23 hours 59 minutes', 'OFFLINE', 'CMX');

-- Surveyor 10 (Olivia Martinez) - Out for 1 week (training starting in 5 days)
INSERT INTO surveyor_availability (surveyor_id, start_time, end_time, state, source) VALUES
(10, NOW() + INTERVAL '5 days' + INTERVAL '0 hours', NOW() + INTERVAL '5 days' + INTERVAL '23 hours 59 minutes', 'OFFLINE', 'CMX'),
(10, NOW() + INTERVAL '6 days' + INTERVAL '0 hours', NOW() + INTERVAL '6 days' + INTERVAL '23 hours 59 minutes', 'OFFLINE', 'CMX'),
(10, NOW() + INTERVAL '7 days' + INTERVAL '0 hours', NOW() + INTERVAL '7 days' + INTERVAL '23 hours 59 minutes', 'OFFLINE', 'CMX'),
(10, NOW() + INTERVAL '8 days' + INTERVAL '0 hours', NOW() + INTERVAL '8 days' + INTERVAL '23 hours 59 minutes', 'OFFLINE', 'CMX'),
(10, NOW() + INTERVAL '9 days' + INTERVAL '0 hours', NOW() + INTERVAL '9 days' + INTERVAL '23 hours 59 minutes', 'OFFLINE', 'CMX'),
(10, NOW() + INTERVAL '10 days' + INTERVAL '0 hours', NOW() + INTERVAL '10 days' + INTERVAL '23 hours 59 minutes', 'OFFLINE', 'CMX'),
(10, NOW() + INTERVAL '11 days' + INTERVAL '0 hours', NOW() + INTERVAL '11 days' + INTERVAL '23 hours 59 minutes', 'OFFLINE', 'CMX');

-- Surveyor 15 (James Wilson) - Out for 3 days (conference starting in 3 days)
INSERT INTO surveyor_availability (surveyor_id, start_time, end_time, state, source) VALUES
(15, NOW() + INTERVAL '3 days' + INTERVAL '0 hours', NOW() + INTERVAL '3 days' + INTERVAL '23 hours 59 minutes', 'OFFLINE', 'CMX'),
(15, NOW() + INTERVAL '4 days' + INTERVAL '0 hours', NOW() + INTERVAL '4 days' + INTERVAL '23 hours 59 minutes', 'OFFLINE', 'CMX'),
(15, NOW() + INTERVAL '5 days' + INTERVAL '0 hours', NOW() + INTERVAL '5 days' + INTERVAL '23 hours 59 minutes', 'OFFLINE', 'CMX');

-- Surveyor 20 (Charlotte Harris) - Out for 5 days (personal leave starting in 1 day)
INSERT INTO surveyor_availability (surveyor_id, start_time, end_time, state, source) VALUES
(20, NOW() + INTERVAL '1 day' + INTERVAL '0 hours', NOW() + INTERVAL '1 day' + INTERVAL '23 hours 59 minutes', 'OFFLINE', 'CMX'),
(20, NOW() + INTERVAL '2 days' + INTERVAL '0 hours', NOW() + INTERVAL '2 days' + INTERVAL '23 hours 59 minutes', 'OFFLINE', 'CMX'),
(20, NOW() + INTERVAL '3 days' + INTERVAL '0 hours', NOW() + INTERVAL '3 days' + INTERVAL '23 hours 59 minutes', 'OFFLINE', 'CMX'),
(20, NOW() + INTERVAL '4 days' + INTERVAL '0 hours', NOW() + INTERVAL '4 days' + INTERVAL '23 hours 59 minutes', 'OFFLINE', 'CMX'),
(20, NOW() + INTERVAL '5 days' + INTERVAL '0 hours', NOW() + INTERVAL '5 days' + INTERVAL '23 hours 59 minutes', 'OFFLINE', 'CMX');

-- Surveyor 25 (Daniel Hall) - Out for 4 days (family event starting in 6 days)
INSERT INTO surveyor_availability (surveyor_id, start_time, end_time, state, source) VALUES
(25, NOW() + INTERVAL '6 days' + INTERVAL '0 hours', NOW() + INTERVAL '6 days' + INTERVAL '23 hours 59 minutes', 'OFFLINE', 'CMX'),
(25, NOW() + INTERVAL '7 days' + INTERVAL '0 hours', NOW() + INTERVAL '7 days' + INTERVAL '23 hours 59 minutes', 'OFFLINE', 'CMX'),
(25, NOW() + INTERVAL '8 days' + INTERVAL '0 hours', NOW() + INTERVAL '8 days' + INTERVAL '23 hours 59 minutes', 'OFFLINE', 'CMX'),
(25, NOW() + INTERVAL '9 days' + INTERVAL '0 hours', NOW() + INTERVAL '9 days' + INTERVAL '23 hours 59 minutes', 'OFFLINE', 'CMX');
