-- Create task_reminders table
CREATE TABLE IF NOT EXISTS public.task_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  time TIME NOT NULL DEFAULT '09:00:00',
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 31),
  include_pending BOOLEAN NOT NULL DEFAULT true,
  include_overdue BOOLEAN NOT NULL DEFAULT true,
  include_due_soon BOOLEAN NOT NULL DEFAULT true,
  include_high_priority BOOLEAN NOT NULL DEFAULT false,
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(board_id, user_id)
);

-- Add RLS policies
ALTER TABLE public.task_reminders ENABLE ROW LEVEL SECURITY;

-- Users can only see their own reminders
CREATE POLICY "Users can view own reminders"
  ON public.task_reminders
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can create their own reminders
CREATE POLICY "Users can create own reminders"
  ON public.task_reminders
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own reminders
CREATE POLICY "Users can update own reminders"
  ON public.task_reminders
  FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own reminders
CREATE POLICY "Users can delete own reminders"
  ON public.task_reminders
  FOR DELETE
  USING (user_id = auth.uid());

-- Add index for performance
CREATE INDEX idx_task_reminders_user_board ON public.task_reminders(user_id, board_id);
CREATE INDEX idx_task_reminders_enabled ON public.task_reminders(enabled) WHERE enabled = true;

-- Add comment
COMMENT ON TABLE public.task_reminders IS 'Stores user task reminder configurations for email notifications';
