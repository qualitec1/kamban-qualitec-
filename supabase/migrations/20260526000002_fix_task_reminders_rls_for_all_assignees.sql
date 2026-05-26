-- Permite que um responsável de uma tarefa crie/atualize lembretes
-- para os demais responsáveis da mesma tarefa.

-- Remover policies restritivas de INSERT e UPDATE
DROP POLICY IF EXISTS "Users can create own task reminders" ON public.task_reminders;
DROP POLICY IF EXISTS "Users can update own task reminders" ON public.task_reminders;

-- INSERT: pode inserir para si mesmo OU para outro usuário que seja
-- responsável da mesma tarefa, desde que o insertor também seja responsável.
CREATE POLICY "Assignees can create reminders for task assignees"
  ON public.task_reminders
  FOR INSERT
  WITH CHECK (
    -- Sempre pode criar para si mesmo
    user_id = auth.uid()
    OR
    -- Pode criar para outro usuário se:
    -- 1. O destinatário é responsável da tarefa
    -- 2. O insertor também é responsável da tarefa
    (
      EXISTS (
        SELECT 1 FROM public.task_assignees
        WHERE task_id = task_reminders.task_id
          AND user_id = task_reminders.user_id
      )
      AND
      EXISTS (
        SELECT 1 FROM public.task_assignees
        WHERE task_id = task_reminders.task_id
          AND user_id = auth.uid()
      )
    )
  );

-- UPDATE: mesma lógica
CREATE POLICY "Assignees can update reminders for task assignees"
  ON public.task_reminders
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR
    (
      EXISTS (
        SELECT 1 FROM public.task_assignees
        WHERE task_id = task_reminders.task_id
          AND user_id = task_reminders.user_id
      )
      AND
      EXISTS (
        SELECT 1 FROM public.task_assignees
        WHERE task_id = task_reminders.task_id
          AND user_id = auth.uid()
      )
    )
  );
