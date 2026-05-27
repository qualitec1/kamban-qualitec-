-- =============================================================================
-- GRANT explícito para todas as tabelas do schema public
-- Necessário a partir de outubro/2026 (Supabase changelog May 2026)
-- Garante acesso via PostgREST / supabase-js para roles anon e authenticated
-- =============================================================================

-- Tabelas de organização e perfis
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations       TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles            TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_managed_users  TO anon, authenticated;

-- Workspaces e boards
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspaces          TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.boards              TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.board_columns       TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.board_members       TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.board_views         TO anon, authenticated;

-- Tarefas e relacionados
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks               TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_groups         TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_assignees      TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_attachments    TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_comments       TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_labels         TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_statuses       TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_priorities     TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_reminders      TO anon, authenticated;

-- Subtarefas
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subtasks            TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subtask_assignees   TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subtask_attachments TO anon, authenticated;

-- Labels, filtros e automações
GRANT SELECT, INSERT, UPDATE, DELETE ON public.labels              TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_filters       TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automations         TO anon, authenticated;

-- Notificações e logs
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications       TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_logs       TO anon, authenticated;

-- Email
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_preferences   TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_sent_log      TO anon, authenticated;

-- Workspace members (tabela mais recente)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_members   TO anon, authenticated;

-- Garantir uso do schema public
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Sequences (necessário para INSERT com serial/identity)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
