-- Aurora RobbieVerse - Conversation Context Migration
-- Adds conversation context, rollback, and branching functionality

-- Add new columns to existing messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS branch_id UUID;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_reason VARCHAR(255);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS parent_message_id UUID;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS context_importance INTEGER DEFAULT 1;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_context_compressed BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS compressed_content TEXT;

-- Add new columns to existing conversations table
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS context_window_size INTEGER DEFAULT 10;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS context_compression_enabled BOOLEAN DEFAULT true;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS current_branch_id UUID;

-- Create conversation branches table
CREATE TABLE IF NOT EXISTS conversation_branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    parent_branch_id UUID REFERENCES conversation_branches(id) ON DELETE CASCADE,
    branch_point_message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create context snapshots table
CREATE TABLE IF NOT EXISTS context_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    snapshot_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    message_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Add foreign key constraints for new message columns
ALTER TABLE messages ADD CONSTRAINT fk_messages_branch_id 
    FOREIGN KEY (branch_id) REFERENCES conversation_branches(id) ON DELETE SET NULL;

ALTER TABLE messages ADD CONSTRAINT fk_messages_parent_message_id 
    FOREIGN KEY (parent_message_id) REFERENCES messages(id) ON DELETE SET NULL;

-- Add foreign key constraint for conversations current_branch_id
ALTER TABLE conversations ADD CONSTRAINT fk_conversations_current_branch_id 
    FOREIGN KEY (current_branch_id) REFERENCES conversation_branches(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_branch_id ON messages(branch_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_deleted ON messages(is_deleted);
CREATE INDEX IF NOT EXISTS idx_messages_deleted_at ON messages(deleted_at);
CREATE INDEX IF NOT EXISTS idx_messages_context_importance ON messages(context_importance);
CREATE INDEX IF NOT EXISTS idx_messages_parent_message_id ON messages(parent_message_id);

CREATE INDEX IF NOT EXISTS idx_conversation_branches_conversation_id ON conversation_branches(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_branches_is_active ON conversation_branches(is_active);
CREATE INDEX IF NOT EXISTS idx_conversation_branches_created_at ON conversation_branches(created_at);

CREATE INDEX IF NOT EXISTS idx_context_snapshots_conversation_id ON context_snapshots(conversation_id);
CREATE INDEX IF NOT EXISTS idx_context_snapshots_snapshot_type ON context_snapshots(snapshot_type);
CREATE INDEX IF NOT EXISTS idx_context_snapshots_created_at ON context_snapshots(created_at);

-- Create updated_at trigger for conversation_branches
CREATE TRIGGER update_conversation_branches_updated_at 
    BEFORE UPDATE ON conversation_branches 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create updated_at trigger for context_snapshots
CREATE TRIGGER update_context_snapshots_updated_at 
    BEFORE UPDATE ON context_snapshots 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add check constraints
ALTER TABLE messages ADD CONSTRAINT chk_messages_context_importance 
    CHECK (context_importance >= 1 AND context_importance <= 10);

ALTER TABLE conversation_branches ADD CONSTRAINT chk_conversation_branches_name 
    CHECK (LENGTH(name) > 0);

ALTER TABLE context_snapshots ADD CONSTRAINT chk_context_snapshots_snapshot_type 
    CHECK (snapshot_type IN ('compressed', 'summary', 'key_points', 'full_context'));

-- Create a function to automatically update context importance based on message content
CREATE OR REPLACE FUNCTION update_message_importance()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate importance based on role and content
    NEW.context_importance := 5; -- Base importance
    
    -- System and gatekeeper messages are more important
    IF NEW.role IN ('system', 'gatekeeper') THEN
        NEW.context_importance := NEW.context_importance + 3;
    END IF;
    
    -- Longer messages might be more important
    IF LENGTH(NEW.content) > 200 THEN
        NEW.context_importance := NEW.context_importance + 1;
    END IF;
    
    -- Messages with questions or specific requests
    IF NEW.content LIKE '%?%' OR 
       NEW.content ILIKE '%help%' OR 
       NEW.content ILIKE '%explain%' OR 
       NEW.content ILIKE '%how%' OR 
       NEW.content ILIKE '%what%' OR 
       NEW.content ILIKE '%why%' THEN
        NEW.context_importance := NEW.context_importance + 2;
    END IF;
    
    -- Ensure importance is within bounds
    NEW.context_importance := LEAST(10, GREATEST(1, NEW.context_importance));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set context importance
CREATE TRIGGER trigger_update_message_importance
    BEFORE INSERT OR UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_message_importance();

-- Create a function to get conversation context with intelligent message selection
CREATE OR REPLACE FUNCTION get_conversation_context(
    p_conversation_id UUID,
    p_context_window INTEGER DEFAULT 10
)
RETURNS TABLE (
    message_id UUID,
    role VARCHAR(20),
    content TEXT,
    created_at TIMESTAMPTZ,
    context_importance INTEGER,
    token_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.role,
        m.content,
        m.created_at,
        m.context_importance,
        m.token_count
    FROM messages m
    WHERE m.conversation_id = p_conversation_id
      AND m.is_deleted = false
    ORDER BY 
        -- Weighted score: 70% recency, 30% importance
        (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - m.created_at)) / -86400.0 * 0.7 + m.context_importance * 0.3) DESC,
        m.created_at DESC
    LIMIT p_context_window;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get rollback history
CREATE OR REPLACE FUNCTION get_rollback_history(p_conversation_id UUID)
RETURNS TABLE (
    message_id UUID,
    role VARCHAR(20),
    content TEXT,
    deleted_at TIMESTAMPTZ,
    deleted_reason VARCHAR(255),
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.role,
        m.content,
        m.deleted_at,
        m.deleted_reason,
        m.created_at
    FROM messages m
    WHERE m.conversation_id = p_conversation_id
      AND m.is_deleted = true
    ORDER BY m.deleted_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a function to compress conversation context
CREATE OR REPLACE FUNCTION compress_conversation_context(p_conversation_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_message_count INTEGER;
    v_compressed_content TEXT;
    v_snapshot_id UUID;
BEGIN
    -- Count messages
    SELECT COUNT(*) INTO v_message_count
    FROM messages 
    WHERE conversation_id = p_conversation_id AND is_deleted = false;
    
    -- Only compress if there are enough messages
    IF v_message_count < 20 THEN
        RETURN jsonb_build_object(
            'compressed', false,
            'reason', 'Not enough messages to compress',
            'message_count', v_message_count
        );
    END IF;
    
    -- Create compressed content (simplified version)
    SELECT string_agg(
        '[' || to_char(created_at, 'YYYY-MM-DD HH24:MI') || '] ' || 
        role || ': ' || 
        CASE 
            WHEN LENGTH(content) > 100 THEN LEFT(content, 100) || '...'
            ELSE content
        END,
        E'\n'
        ORDER BY created_at
    ) INTO v_compressed_content
    FROM messages 
    WHERE conversation_id = p_conversation_id AND is_deleted = false;
    
    -- Create snapshot
    v_snapshot_id := uuid_generate_v4();
    
    INSERT INTO context_snapshots (
        id, conversation_id, snapshot_type, content, message_count
    ) VALUES (
        v_snapshot_id, p_conversation_id, 'compressed', v_compressed_content, v_message_count
    );
    
    RETURN jsonb_build_object(
        'compressed', true,
        'snapshot_id', v_snapshot_id,
        'original_message_count', v_message_count,
        'compressed_content', v_compressed_content
    );
END;
$$ LANGUAGE plpgsql;

-- Grant permissions to aurora user
GRANT ALL PRIVILEGES ON TABLE conversation_branches TO aurora;
GRANT ALL PRIVILEGES ON TABLE context_snapshots TO aurora;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO aurora;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_conversation_context(UUID, INTEGER) TO aurora;
GRANT EXECUTE ON FUNCTION get_rollback_history(UUID) TO aurora;
GRANT EXECUTE ON FUNCTION compress_conversation_context(UUID) TO aurora;

-- Production-ready schema - No test data

COMMENT ON TABLE conversation_branches IS 'Stores conversation branches for exploring different AI responses';
COMMENT ON TABLE context_snapshots IS 'Stores compressed context snapshots for long conversations';
COMMENT ON FUNCTION get_conversation_context(UUID, INTEGER) IS 'Returns intelligently selected conversation context';
COMMENT ON FUNCTION get_rollback_history(UUID) IS 'Returns rollback history for a conversation';
COMMENT ON FUNCTION compress_conversation_context(UUID) IS 'Compresses long conversation context';
