-- Create Allan's User Account on Elephant Master
-- Date: October 9, 2025
-- Create Allan's user if not exists
INSERT INTO users (
        username,
        email,
        full_name,
        created_at,
        updated_at
    )
VALUES (
        'allan',
        'allan@testpilotcpg.com',
        'Allan Peretz',
        NOW(),
        NOW()
    ) ON CONFLICT (email) DO
UPDATE
SET updated_at = NOW()
RETURNING id,
    username,
    email;
-- Show the user ID
SELECT id,
    username,
    email,
    created_at
FROM users
WHERE email = 'allan@testpilotcpg.com';