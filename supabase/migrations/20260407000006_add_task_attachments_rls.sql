-- =============================================
-- RLS POLICIES FOR TASK_ATTACHMENTS
-- =============================================

-- Habilitar RLS
alter table public.task_attachments enable row level security;

-- Policy: Membros do board podem ver anexos
create policy "Board members can view attachments"
on public.task_attachments for select
using (
  -- Master pode ver tudo
  (select role_global from public.profiles where id = auth.uid()) = 'master'
  or
  -- Membros do board podem ver
  exists (
    select 1 from public.tasks t
    join public.board_members bm on bm.board_id = t.board_id
    where t.id = task_attachments.task_id
      and bm.user_id = auth.uid()
  )
);

-- Policy: Owners e editors podem fazer upload
create policy "Owners and editors can upload attachments"
on public.task_attachments for insert
with check (
  -- Master pode fazer upload
  (select role_global from public.profiles where id = auth.uid()) = 'master'
  or
  -- Owners e editors do board podem fazer upload
  exists (
    select 1 from public.tasks t
    join public.board_members bm on bm.board_id = t.board_id
    where t.id = task_attachments.task_id
      and bm.user_id = auth.uid()
      and bm.access_role in ('owner', 'editor')
  )
);

-- Policy: Owners e editors podem atualizar anexos (categoria, descrição)
create policy "Owners and editors can update attachments"
on public.task_attachments for update
using (
  -- Master pode atualizar
  (select role_global from public.profiles where id = auth.uid()) = 'master'
  or
  -- Owners e editors do board podem atualizar
  exists (
    select 1 from public.tasks t
    join public.board_members bm on bm.board_id = t.board_id
    where t.id = task_attachments.task_id
      and bm.user_id = auth.uid()
      and bm.access_role in ('owner', 'editor')
  )
);

-- Policy: Owners e editors podem deletar anexos
create policy "Owners and editors can delete attachments"
on public.task_attachments for delete
using (
  -- Master pode deletar
  (select role_global from public.profiles where id = auth.uid()) = 'master'
  or
  -- Owners e editors do board podem deletar
  exists (
    select 1 from public.tasks t
    join public.board_members bm on bm.board_id = t.board_id
    where t.id = task_attachments.task_id
      and bm.user_id = auth.uid()
      and bm.access_role in ('owner', 'editor')
  )
);
