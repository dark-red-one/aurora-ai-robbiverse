-- Migration 002: Enhance Users Table
-- Add additional user profile fields from Robbie V3

-- ========================================
-- ADD NEW USER COLUMNS
-- ========================================

-- Add first_name and last_name (split from username if needed)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Add professional info
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add timezone support
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- Add LinkedIn profile
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- Add bio/about
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS bio TEXT;

-- ========================================
-- MIGRATE EXISTING DATA
-- ========================================

-- Try to split username into first_name/last_name for existing users
UPDATE users 
SET 
  first_name = SPLIT_PART(username, ' ', 1),
  last_name = CASE 
    WHEN POSITION(' ' IN username) > 0 
    THEN SPLIT_PART(username, ' ', 2)
    ELSE ''
  END
WHERE first_name IS NULL;

-- ========================================
-- CREATE INDEXES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Full text search on user names
CREATE INDEX IF NOT EXISTS idx_users_name_search ON users 
USING gin(to_tsvector('english', COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')));

-- ========================================
-- ADD UPDATED_AT TRIGGER
-- ========================================

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- MIGRATION COMPLETE
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 002 Complete: User Enhancements';
  RAISE NOTICE '   - Added first_name, last_name';
  RAISE NOTICE '   - Added job_title, phone, avatar_url';
  RAISE NOTICE '   - Added timezone, linkedin_url, bio';
  RAISE NOTICE '   - Created search indexes';
END $$;
