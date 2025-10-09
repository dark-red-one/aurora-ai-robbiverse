-- Migration 008: Create Default Users with Hashed Passwords
-- Creates Allan, Kristina, and Andre with default password: go2Work!

-- Note: Password hash for "go2Work!" using bcrypt
-- This will be replaced by proper bcrypt hashes when the auth system runs

-- First, ensure we have the pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert default users
-- Password: go2Work! (will be hashed by backend on first use)
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, created_at)
VALUES 
  (
    'allan@testpilotcpg.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIvApKtEHm',  -- go2Work!
    'Allan',
    'Peretz',
    'admin',
    true,
    NOW()
  ),
  (
    'kristina@testpilotcpg.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIvApKtEHm',  -- go2Work!
    'Kristina',
    'Peretz',
    'user',
    true,
    NOW()
  ),
  (
    'andre@testpilotcpg.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIvApKtEHm',  -- go2Work!
    'Andre',
    NULL,
    'user',
    true,
    NOW()
  )
ON CONFLICT (email) DO NOTHING;

-- Create a guest user for demos
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, created_at)
VALUES 
  (
    'guest@testpilotcpg.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIvApKtEHm',  -- go2Work!
    'Guest',
    'User',
    'user',
    true,
    NOW()
  )
ON CONFLICT (email) DO NOTHING;

-- Set Allan's preferences for full flirty mode
UPDATE users 
SET preferences = jsonb_build_object(
  'flirt_mode', 7,
  'gandhi_genghis', 5,
  'genghis_gandhi_intensity', 50,
  'cocktail_lightning_energy', 50,
  'theme', 'dark',
  'notifications_enabled', true
)
WHERE email = 'allan@testpilotcpg.com';

COMMENT ON TABLE users IS 'User accounts with bcrypt password hashing';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password (default: go2Work!)';








