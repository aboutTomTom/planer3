-- SQL script to update the timeThresholds setting

-- Check if the timeThresholds setting exists
SELECT * FROM Settings WHERE key = 'timeThresholds';

-- Update the timeThresholds value if it exists
UPDATE Settings 
SET value = '[{"name":"low","min":0,"max":4,"color":"#74e458"},{"name":"medium","min":4,"max":6,"color":"#d7f350"},{"name":"high","min":6,"max":8,"color":"#FF9800"},{"name":"critical","min":8,"max":10000000,"color":"#cb2b2b"}]'
WHERE key = 'timeThresholds';

-- Insert the new timeThresholds value if it doesn't exist
INSERT OR IGNORE INTO Settings (key, value)
VALUES ('timeThresholds', '[{"name":"low","min":0,"max":4,"color":"#74e458"},{"name":"medium","min":4,"max":6,"color":"#d7f350"},{"name":"high","min":6,"max":8,"color":"#FF9800"},{"name":"critical","min":8,"max":10000000,"color":"#cb2b2b"}]'); 