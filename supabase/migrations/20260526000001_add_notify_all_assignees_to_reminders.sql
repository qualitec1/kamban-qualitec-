-- Adiciona campo para notificar todos os responsáveis da tarefa
ALTER TABLE public.task_reminders
  ADD COLUMN IF NOT EXISTS notify_all_assignees BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.task_reminders.notify_all_assignees IS
  'Quando true, o lembrete será replicado para todos os responsáveis da tarefa com as mesmas configurações';
