-- =============================================
-- FIX: Todas as permissões relacionadas a tarefas
-- =============================================
-- Problema: Viewers, guests e observers conseguem editar tarefas e campos relacionados
-- Solução: Apenas owner e editor do board podem modificar qualquer coisa relacionada a tarefas

-- =============================================
-- SUBTASKS
-- =============================================
drop policy if exists "subtasks: collaborator+ manages in org boards" on public.subtasks;
drop policy if exists "subtasks: collaborator+ manages" on public.subtasks;

create policy "subtasks: owner/editor can manage"
  on public.subtasks
  for all
  using (
    task_id in (
      select t.id from public.tasks t
      inner join public.board_members bm on bm.board_id = t.board_id
      where bm.user_id = auth.uid() and bm.access_role in ('owner','editor')
    )
  )
  with check (
    task_id in (
      select t.id from public.tasks t
      inner join public.board_members bm on bm.board_id = t.board_id
      where bm.user_id = auth.uid() and bm.access_role in ('owner','editor')
    )
  );

-- =============================================
-- TASK_ATTACHMENTS
-- =============================================
drop policy if exists "task_attachments: collaborator+ manages" on public.task_attachments;

create policy "task_attachments: owner/editor can manage"
  on public.task_attachments
  for all
  using (
    task_id in (
      select t.id from public.tasks t
      inner join public.board_members bm on bm.board_id = t.board_id
      where bm.user_id = auth.uid() and bm.access_role in ('owner','editor')
    )
  )
  with check (
    task_id in (
      select t.id from public.tasks t
      inner join public.board_members bm on bm.board_id = t.board_id
      where bm.user_id = auth.uid() and bm.access_role in ('owner','editor')
    )
  );

-- =============================================
-- TASK_COMMENTS
-- =============================================
drop policy if exists "task_comments: author or master manages" on public.task_comments;

-- Leitura: qualquer membro do board
create policy "task_comments: owner/editor can insert"
  on public.task_comments
  for insert
  with check (
    task_id in (
      select t.id from public.tasks t
      inner join public.board_members bm on bm.board_id = t.board_id
      where bm.user_id = auth.uid() and bm.access_role in ('owner','editor')
    )
  );

-- Apenas autor ou owner/editor podem atualizar/deletar
create policy "task_comments: author or owner/editor can modify"
  on public.task_comments
  for update
  using (
    author_id = auth.uid() or
    task_id in (
      select t.id from public.tasks t
      inner join public.board_members bm on bm.board_id = t.board_id
      where bm.user_id = auth.uid() and bm.access_role in ('owner','editor')
    )
  )
  with check (
    author_id = auth.uid() or
    task_id in (
      select t.id from public.tasks t
      inner join public.board_members bm on bm.board_id = t.board_id
      where bm.user_id = auth.uid() and bm.access_role in ('owner','editor')
    )
  );

create policy "task_comments: author or owner/editor can delete"
  on public.task_comments
  for delete
  using (
    author_id = auth.uid() or
    task_id in (
      select t.id from public.tasks t
      inner join public.board_members bm on bm.board_id = t.board_id
      where bm.user_id = auth.uid() and bm.access_role in ('owner','editor')
    )
  );

-- =============================================
-- TASK_LABELS
-- =============================================
drop policy if exists "task_labels: collaborator+ manages" on public.task_labels;

create policy "task_labels: owner/editor can manage"
  on public.task_labels
  for all
  using (
    task_id in (
      select t.id from public.tasks t
      inner join public.board_members bm on bm.board_id = t.board_id
      where bm.user_id = auth.uid() and bm.access_role in ('owner','editor')
    )
  )
  with check (
    task_id in (
      select t.id from public.tasks t
      inner join public.board_members bm on bm.board_id = t.board_id
      where bm.user_id = auth.uid() and bm.access_role in ('owner','editor')
    )
  );

-- =============================================
-- TASK_PRIORITIES (configuração do board)
-- =============================================
drop policy if exists "task_priorities: collaborator+ manages" on public.task_priorities;

create policy "task_priorities: owner/editor can manage"
  on public.task_priorities
  for all
  using (
    board_id in (
      select board_id from public.board_members
      where user_id = auth.uid() and access_role in ('owner','editor')
    )
  )
  with check (
    board_id in (
      select board_id from public.board_members
      where user_id = auth.uid() and access_role in ('owner','editor')
    )
  );

-- =============================================
-- TASK_STATUSES (configuração do board)
-- =============================================
drop policy if exists "task_statuses: collaborator+ manages" on public.task_statuses;

create policy "task_statuses: owner/editor can manage"
  on public.task_statuses
  for all
  using (
    board_id in (
      select board_id from public.board_members
      where user_id = auth.uid() and access_role in ('owner','editor')
    )
  )
  with check (
    board_id in (
      select board_id from public.board_members
      where user_id = auth.uid() and access_role in ('owner','editor')
    )
  );
