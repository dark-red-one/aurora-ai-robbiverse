-- Unified Extensions Migration
-- Ensure required PostgreSQL extensions exist

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;
-- Keep pgcrypto available for any legacy gen_random_uuid() usage
CREATE EXTENSION IF NOT EXISTS pgcrypto;
