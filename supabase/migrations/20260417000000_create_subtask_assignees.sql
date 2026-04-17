-- =============================================
-- SUBTASK_ASSIGNEES
-- =============================================
create table public.subtask_assignees (
  subtask_id  uuid not null references public.subtasks(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (subtask_id, user_id)
);

-- Índices
create index idx_subtask_assignees_subtask on public.subtask_assignees(subtask_id);
create index idx_subtask_assignees_user on public.subtask_assignees(user_id);

-- RLS
alter table public.subtask_assignees enable row level security;

-- Políticas RLS para subtask_assignees (seguindo o mesmo padrão de task_assignees)
create policy "subtask_assignees: read if board member" 
  on public.subtask_assignees for select 
  using (public.my_role() in ('master','collaborator') or user_id = auth.uid());

create policy "subtask_assignees: collaborator+ manages" 
  on public.subtask_assignees for all 
  using (public.my_role() in ('master','collaborator'));
