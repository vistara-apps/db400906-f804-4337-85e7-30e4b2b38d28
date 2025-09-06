-- SpeakEasy Tasks Database Schema for Supabase
-- This file contains the complete database schema for the SpeakEasy Tasks application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    "userId" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "lastActive" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "walletAddress" TEXT,
    "farcasterFid" TEXT,
    "preferences" JSONB DEFAULT '{}'::jsonb
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    "taskId" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES users("userId") ON DELETE CASCADE,
    "description" TEXT NOT NULL,
    "isCompleted" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "dueDate" TIMESTAMP WITH TIME ZONE,
    "priority" TEXT CHECK ("priority" IN ('low', 'medium', 'high')) DEFAULT 'medium',
    "tags" TEXT[] DEFAULT '{}',
    "metadata" JSONB DEFAULT '{}'::jsonb
);

-- Calendar Events table
CREATE TABLE IF NOT EXISTS calendar_events (
    "eventId" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES users("userId") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "startTime" TIMESTAMP WITH TIME ZONE NOT NULL,
    "endTime" TIMESTAMP WITH TIME ZONE NOT NULL,
    "location" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "metadata" JSONB DEFAULT '{}'::jsonb
);

-- Reminders table
CREATE TABLE IF NOT EXISTS reminders (
    "reminderId" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "taskId" UUID REFERENCES tasks("taskId") ON DELETE CASCADE,
    "eventId" UUID REFERENCES calendar_events("eventId") ON DELETE CASCADE,
    "userId" UUID NOT NULL REFERENCES users("userId") ON DELETE CASCADE,
    "triggerType" TEXT CHECK ("triggerType" IN ('time', 'location', 'completion')) NOT NULL,
    "triggerValue" TEXT NOT NULL,
    "isTriggered" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "triggeredAt" TIMESTAMP WITH TIME ZONE,
    "metadata" JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT reminder_reference_check CHECK (
        ("taskId" IS NOT NULL AND "eventId" IS NULL) OR 
        ("taskId" IS NULL AND "eventId" IS NOT NULL)
    )
);

-- Voice Transcriptions table (for analytics and improvement)
CREATE TABLE IF NOT EXISTS voice_transcriptions (
    "transcriptionId" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES users("userId") ON DELETE CASCADE,
    "originalText" TEXT NOT NULL,
    "parsedResult" JSONB NOT NULL,
    "confidence" DECIMAL(3,2),
    "processingTime" INTEGER, -- in milliseconds
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "taskId" UUID REFERENCES tasks("taskId") ON DELETE SET NULL,
    "eventId" UUID REFERENCES calendar_events("eventId") ON DELETE SET NULL
);

-- AI Prioritizations table (for tracking AI suggestions)
CREATE TABLE IF NOT EXISTS ai_prioritizations (
    "prioritizationId" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES users("userId") ON DELETE CASCADE,
    "taskIds" UUID[] NOT NULL,
    "prioritizationResult" JSONB NOT NULL,
    "appliedChanges" JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "feedback" TEXT -- User feedback on the prioritization
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks("userId");
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks("dueDate");
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks("priority");
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks("isCompleted");
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks("createdAt");

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events("userId");
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events("startTime");
CREATE INDEX IF NOT EXISTS idx_calendar_events_end_time ON calendar_events("endTime");

CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders("userId");
CREATE INDEX IF NOT EXISTS idx_reminders_task_id ON reminders("taskId");
CREATE INDEX IF NOT EXISTS idx_reminders_event_id ON reminders("eventId");
CREATE INDEX IF NOT EXISTS idx_reminders_trigger_type ON reminders("triggerType");
CREATE INDEX IF NOT EXISTS idx_reminders_is_triggered ON reminders("isTriggered");

CREATE INDEX IF NOT EXISTS idx_voice_transcriptions_user_id ON voice_transcriptions("userId");
CREATE INDEX IF NOT EXISTS idx_voice_transcriptions_created_at ON voice_transcriptions("createdAt");

CREATE INDEX IF NOT EXISTS idx_ai_prioritizations_user_id ON ai_prioritizations("userId");
CREATE INDEX IF NOT EXISTS idx_ai_prioritizations_created_at ON ai_prioritizations("createdAt");

-- Triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prioritizations ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = "userId"::text);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = "userId"::text);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid()::text = "userId"::text);

-- Tasks policies
CREATE POLICY "Users can view own tasks" ON tasks
    FOR SELECT USING (auth.uid()::text = "userId"::text);

CREATE POLICY "Users can insert own tasks" ON tasks
    FOR INSERT WITH CHECK (auth.uid()::text = "userId"::text);

CREATE POLICY "Users can update own tasks" ON tasks
    FOR UPDATE USING (auth.uid()::text = "userId"::text);

CREATE POLICY "Users can delete own tasks" ON tasks
    FOR DELETE USING (auth.uid()::text = "userId"::text);

-- Calendar events policies
CREATE POLICY "Users can view own events" ON calendar_events
    FOR SELECT USING (auth.uid()::text = "userId"::text);

CREATE POLICY "Users can insert own events" ON calendar_events
    FOR INSERT WITH CHECK (auth.uid()::text = "userId"::text);

CREATE POLICY "Users can update own events" ON calendar_events
    FOR UPDATE USING (auth.uid()::text = "userId"::text);

CREATE POLICY "Users can delete own events" ON calendar_events
    FOR DELETE USING (auth.uid()::text = "userId"::text);

-- Reminders policies
CREATE POLICY "Users can view own reminders" ON reminders
    FOR SELECT USING (auth.uid()::text = "userId"::text);

CREATE POLICY "Users can insert own reminders" ON reminders
    FOR INSERT WITH CHECK (auth.uid()::text = "userId"::text);

CREATE POLICY "Users can update own reminders" ON reminders
    FOR UPDATE USING (auth.uid()::text = "userId"::text);

CREATE POLICY "Users can delete own reminders" ON reminders
    FOR DELETE USING (auth.uid()::text = "userId"::text);

-- Voice transcriptions policies
CREATE POLICY "Users can view own transcriptions" ON voice_transcriptions
    FOR SELECT USING (auth.uid()::text = "userId"::text);

CREATE POLICY "Users can insert own transcriptions" ON voice_transcriptions
    FOR INSERT WITH CHECK (auth.uid()::text = "userId"::text);

-- AI prioritizations policies
CREATE POLICY "Users can view own prioritizations" ON ai_prioritizations
    FOR SELECT USING (auth.uid()::text = "userId"::text);

CREATE POLICY "Users can insert own prioritizations" ON ai_prioritizations
    FOR INSERT WITH CHECK (auth.uid()::text = "userId"::text);

CREATE POLICY "Users can update own prioritizations" ON ai_prioritizations
    FOR UPDATE USING (auth.uid()::text = "userId"::text);

-- Functions for common operations
CREATE OR REPLACE FUNCTION get_user_task_stats(user_id UUID)
RETURNS TABLE(
    total_tasks BIGINT,
    completed_tasks BIGINT,
    pending_tasks BIGINT,
    overdue_tasks BIGINT,
    high_priority_tasks BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE "isCompleted" = true) as completed_tasks,
        COUNT(*) FILTER (WHERE "isCompleted" = false) as pending_tasks,
        COUNT(*) FILTER (WHERE "isCompleted" = false AND "dueDate" < NOW()) as overdue_tasks,
        COUNT(*) FILTER (WHERE "isCompleted" = false AND "priority" = 'high') as high_priority_tasks
    FROM tasks 
    WHERE "userId" = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_upcoming_events(user_id UUID, days_ahead INTEGER DEFAULT 7)
RETURNS TABLE(
    "eventId" UUID,
    "title" TEXT,
    "startTime" TIMESTAMP WITH TIME ZONE,
    "endTime" TIMESTAMP WITH TIME ZONE,
    "location" TEXT,
    "notes" TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e."eventId",
        e."title",
        e."startTime",
        e."endTime",
        e."location",
        e."notes"
    FROM calendar_events e
    WHERE e."userId" = user_id 
    AND e."startTime" BETWEEN NOW() AND NOW() + INTERVAL '1 day' * days_ahead
    ORDER BY e."startTime" ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sample data (optional - remove in production)
-- INSERT INTO users ("userId", "createdAt", "lastActive") 
-- VALUES ('demo-user-uuid', NOW(), NOW())
-- ON CONFLICT DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE users IS 'User profiles and authentication data';
COMMENT ON TABLE tasks IS 'User tasks with priorities, due dates, and completion status';
COMMENT ON TABLE calendar_events IS 'Calendar events with time, location, and notes';
COMMENT ON TABLE reminders IS 'Contextual reminders for tasks and events';
COMMENT ON TABLE voice_transcriptions IS 'Voice input transcriptions for analytics';
COMMENT ON TABLE ai_prioritizations IS 'AI-generated task prioritization results';

COMMENT ON COLUMN tasks."priority" IS 'Task priority: low, medium, or high';
COMMENT ON COLUMN reminders."triggerType" IS 'Reminder trigger: time, location, or completion';
COMMENT ON COLUMN voice_transcriptions."confidence" IS 'Transcription confidence score (0.00-1.00)';
COMMENT ON COLUMN voice_transcriptions."processingTime" IS 'Processing time in milliseconds';
