-- Drop existing table
DROP TABLE IF EXISTS public.task_reminders CASCADE;

-- Create simplified task_reminders table
-- Each row represents a reminder for a specific task
CREATE TABLE public.task_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  reminder_time TIME NOT NULL DEFAULT '09:00:00',
  days_before INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, user_id)
);

-- Enable RLS
ALTER TABLE public.task_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own task reminders"
  ON public.task_reminders
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own task reminders"
  ON public.task_reminders
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own task reminders"
  ON public.task_reminders
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own task reminders"
  ON public.task_reminders
  FOR DELETE
  USING (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_task_reminders_user ON public.task_reminders(user_id);
CREATE INDEX idx_task_reminders_task ON public.task_reminders(task_id);
CREATE INDEX idx_task_reminders_enabled ON public.task_reminders(enabled) WHERE enabled = true;

-- Comment
COMMENT ON TABLE public.task_reminders IS 'Stores individual task reminder preferences per user';
