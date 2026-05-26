-- Função RPC para criar/atualizar lembretes para todos os responsáveis de uma tarefa.
-- SECURITY DEFINER: executa com permissões do owner (bypassa RLS),
-- mas valida internamente que o chamador é responsável da tarefa.

CREATE OR REPLACE FUNCTION public.upsert_reminders_for_assignees(
  p_task_id       UUID,
  p_days_before   INTEGER,
  p_reminder_time TIME,
  p_notify_all    BOOLEAN
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID := auth.uid();
  v_user_id   UUID;
BEGIN
  -- Validar: chamador deve ser responsável da tarefa
  IF NOT EXISTS (
    SELECT 1 FROM task_assignees
    WHERE task_id = p_task_id AND user_id = v_caller_id
  ) THEN
    -- Chamador não é responsável: salva apenas para ele mesmo
    INSERT INTO task_reminders (task_id, user_id, enabled, days_before, reminder_time, notify_all_assignees)
    VALUES (p_task_id, v_caller_id, true, p_days_before, p_reminder_time, p_notify_all)
    ON CONFLICT (task_id, user_id) DO UPDATE SET
      enabled              = true,
      days_before          = EXCLUDED.days_before,
      reminder_time        = EXCLUDED.reminder_time,
      notify_all_assignees = EXCLUDED.notify_all_assignees,
      updated_at           = NOW();
    RETURN;
  END IF;

  IF p_notify_all THEN
    -- Upsert para todos os responsáveis da tarefa
    FOR v_user_id IN
      SELECT user_id FROM task_assignees WHERE task_id = p_task_id
    LOOP
      INSERT INTO task_reminders (task_id, user_id, enabled, days_before, reminder_time, notify_all_assignees)
      VALUES (p_task_id, v_user_id, true, p_days_before, p_reminder_time, p_notify_all)
      ON CONFLICT (task_id, user_id) DO UPDATE SET
        enabled              = true,
        days_before          = EXCLUDED.days_before,
        reminder_time        = EXCLUDED.reminder_time,
        notify_all_assignees = EXCLUDED.notify_all_assignees,
        updated_at           = NOW();
    END LOOP;
  ELSE
    -- Upsert apenas para o chamador
    INSERT INTO task_reminders (task_id, user_id, enabled, days_before, reminder_time, notify_all_assignees)
    VALUES (p_task_id, v_caller_id, true, p_days_before, p_reminder_time, p_notify_all)
    ON CONFLICT (task_id, user_id) DO UPDATE SET
      enabled              = true,
      days_before          = EXCLUDED.days_before,
      reminder_time        = EXCLUDED.reminder_time,
      notify_all_assignees = EXCLUDED.notify_all_assignees,
      updated_at           = NOW();
  END IF;
END;
$$;

-- Garantir que apenas usuários autenticados podem chamar
REVOKE ALL ON FUNCTION public.upsert_reminders_for_assignees FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_reminders_for_assignees TO authenticated;
