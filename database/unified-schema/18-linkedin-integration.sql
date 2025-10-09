-- LinkedIn Integration Tables
-- Tracks VIPs and their LinkedIn activity

-- LinkedIn profiles for contacts
CREATE TABLE IF NOT EXISTS linkedin_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
    profile_url TEXT NOT NULL,
    name TEXT,
    headline TEXT,
    location TEXT,
    connections INTEGER DEFAULT 0,
    followers INTEGER DEFAULT 0,
    last_activity TIMESTAMPTZ,
    profile_picture TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(contact_id)
);

-- LinkedIn posts from VIPs
CREATE TABLE IF NOT EXISTS linkedin_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id TEXT UNIQUE NOT NULL,
    contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
    author_name TEXT,
    author_url TEXT,
    content TEXT,
    post_type TEXT DEFAULT 'text' CHECK (post_type IN ('text', 'image', 'video', 'article')),
    engagement JSONB DEFAULT '{}'::jsonb, -- {likes: int, comments: int, shares: int}
    posted_at TIMESTAMPTZ,
    hashtags JSONB DEFAULT '[]'::jsonb,
    mentions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- LinkedIn messages (connection requests, DMs, InMails)
CREATE TABLE IF NOT EXISTS linkedin_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id TEXT UNIQUE NOT NULL,
    contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
    sender_name TEXT,
    sender_url TEXT,
    content TEXT,
    sent_at TIMESTAMPTZ,
    message_type TEXT DEFAULT 'message' CHECK (message_type IN ('connection_request', 'message', 'inmail')),
    is_read BOOLEAN DEFAULT false,
    response_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- LinkedIn activity tracking
CREATE TABLE IF NOT EXISTS linkedin_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('post', 'comment', 'like', 'share', 'connection', 'message')),
    activity_data JSONB DEFAULT '{}'::jsonb,
    activity_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    source_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- LinkedIn sync status
CREATE TABLE IF NOT EXISTS linkedin_sync_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
    last_profile_sync TIMESTAMPTZ,
    last_posts_sync TIMESTAMPTZ,
    last_messages_sync TIMESTAMPTZ,
    sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'in_progress', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(contact_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_linkedin_profiles_contact ON linkedin_profiles(contact_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_profiles_url ON linkedin_profiles(profile_url);
CREATE INDEX IF NOT EXISTS idx_linkedin_profiles_last_activity ON linkedin_profiles(last_activity);

CREATE INDEX IF NOT EXISTS idx_linkedin_posts_contact ON linkedin_posts(contact_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_posted_at ON linkedin_posts(posted_at);
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_post_id ON linkedin_posts(post_id);

CREATE INDEX IF NOT EXISTS idx_linkedin_messages_contact ON linkedin_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_messages_sent_at ON linkedin_messages(sent_at);
CREATE INDEX IF NOT EXISTS idx_linkedin_messages_type ON linkedin_messages(message_type);

CREATE INDEX IF NOT EXISTS idx_linkedin_activity_contact ON linkedin_activity(contact_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_activity_date ON linkedin_activity(activity_date);
CREATE INDEX IF NOT EXISTS idx_linkedin_activity_type ON linkedin_activity(activity_type);

CREATE INDEX IF NOT EXISTS idx_linkedin_sync_contact ON linkedin_sync_status(contact_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_sync_status ON linkedin_sync_status(sync_status);

-- Views for easy querying
CREATE OR REPLACE VIEW vip_linkedin_summary AS
SELECT 
    c.id as contact_id,
    c.first_name,
    c.last_name,
    c.email,
    c.company_domain,
    lp.profile_url,
    lp.name as linkedin_name,
    lp.headline,
    lp.location,
    lp.connections,
    lp.followers,
    lp.last_activity,
    lp.profile_picture,
    COUNT(DISTINCT lposts.id) as total_posts,
    COUNT(CASE WHEN lposts.posted_at > NOW() - INTERVAL '7 days' THEN 1 END) as posts_last_7_days,
    COUNT(CASE WHEN lposts.posted_at > NOW() - INTERVAL '30 days' THEN 1 END) as posts_last_30_days,
    MAX(lposts.posted_at) as last_post_date,
    COUNT(DISTINCT lmsg.id) as total_messages,
    COUNT(CASE WHEN lmsg.sent_at > NOW() - INTERVAL '7 days' THEN 1 END) as messages_last_7_days,
    MAX(lmsg.sent_at) as last_message_date,
    lss.last_profile_sync,
    lss.last_posts_sync,
    lss.sync_status
FROM crm_contacts c
LEFT JOIN linkedin_profiles lp ON lp.contact_id = c.id
LEFT JOIN linkedin_posts lposts ON lposts.contact_id = c.id
LEFT JOIN linkedin_messages lmsg ON lmsg.contact_id = c.id
LEFT JOIN linkedin_sync_status lss ON lss.contact_id = c.id
JOIN crm_deals d ON d.associated_contacts @> jsonb_build_array(c.id::text)
WHERE c.linkedin_url IS NOT NULL
GROUP BY c.id, c.first_name, c.last_name, c.email, c.company_domain,
         lp.profile_url, lp.name, lp.headline, lp.location,
         lp.connections, lp.followers, lp.last_activity, lp.profile_picture,
         lss.last_profile_sync, lss.last_posts_sync, lss.sync_status;

-- Function to update sync status
CREATE OR REPLACE FUNCTION update_linkedin_sync_status(
    p_contact_id UUID,
    p_sync_type TEXT,
    p_status TEXT,
    p_error_message TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO linkedin_sync_status (contact_id, sync_status, error_message)
    VALUES (p_contact_id, p_status, p_error_message)
    ON CONFLICT (contact_id) 
    DO UPDATE SET
        sync_status = EXCLUDED.sync_status,
        error_message = EXCLUDED.error_message,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Update specific sync timestamp
    IF p_sync_type = 'profile' THEN
        UPDATE linkedin_sync_status 
        SET last_profile_sync = CURRENT_TIMESTAMP 
        WHERE contact_id = p_contact_id;
    ELSIF p_sync_type = 'posts' THEN
        UPDATE linkedin_sync_status 
        SET last_posts_sync = CURRENT_TIMESTAMP 
        WHERE contact_id = p_contact_id;
    ELSIF p_sync_type = 'messages' THEN
        UPDATE linkedin_sync_status 
        SET last_messages_sync = CURRENT_TIMESTAMP 
        WHERE contact_id = p_contact_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get VIPs needing sync
CREATE OR REPLACE FUNCTION get_vips_needing_sync(
    p_sync_type TEXT DEFAULT 'all',
    p_hours_old INTEGER DEFAULT 24
) RETURNS TABLE (
    contact_id UUID,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    linkedin_url TEXT,
    company_domain TEXT,
    deal_name TEXT,
    deal_amount NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.first_name,
        c.last_name,
        c.email,
        c.linkedin_url,
        c.company_domain,
        d.name as deal_name,
        d.amount as deal_amount
    FROM crm_contacts c
    JOIN crm_deals d ON d.associated_contacts @> jsonb_build_array(c.id::text)
    LEFT JOIN linkedin_sync_status lss ON lss.contact_id = c.id
    WHERE c.linkedin_url IS NOT NULL
    AND (
        p_sync_type = 'all' OR
        (p_sync_type = 'profile' AND (lss.last_profile_sync IS NULL OR lss.last_profile_sync < NOW() - INTERVAL '1 hour' * p_hours_old)) OR
        (p_sync_type = 'posts' AND (lss.last_posts_sync IS NULL OR lss.last_posts_sync < NOW() - INTERVAL '1 hour' * p_hours_old)) OR
        (p_sync_type = 'messages' AND (lss.last_messages_sync IS NULL OR lss.last_messages_sync < NOW() - INTERVAL '1 hour' * p_hours_old))
    )
    ORDER BY d.amount DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE linkedin_profiles IS 'LinkedIn profile data for VIP contacts';
COMMENT ON TABLE linkedin_posts IS 'LinkedIn posts from VIP contacts';
COMMENT ON TABLE linkedin_messages IS 'LinkedIn messages and connection requests';
COMMENT ON TABLE linkedin_activity IS 'General LinkedIn activity tracking';
COMMENT ON TABLE linkedin_sync_status IS 'Sync status and timestamps for LinkedIn data';

COMMENT ON VIEW vip_linkedin_summary IS 'Comprehensive LinkedIn summary for all VIPs';
COMMENT ON FUNCTION update_linkedin_sync_status IS 'Update sync status for a contact';
COMMENT ON FUNCTION get_vips_needing_sync IS 'Get VIPs that need LinkedIn sync';
