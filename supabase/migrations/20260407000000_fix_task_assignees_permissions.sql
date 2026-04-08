-- =============================================
-- FIX: task_assignees permissions
-- =============================================
-- Problema: Viewers, guests e observers conseguem editar responsáveis
-- Solução: Apenas owner e editor do board podem gerenciar assignees

-- Drop políticas antigas
drop policy if exists "task_assignees: read if board member" on public.task_assignees;
drop policy if exists "task_assignees: collaborator+ manages" on public.task_assignees;

-- Nova política de leitura: qualquer membro do board pode ver assignees
create policy "task_assignees: board members can read"
  on public.task_assignees
  for select
  using (
    task_id in (
      select t.id from public.tasks t
      inner join public.board_members bm on bm.board_id = t.board_id
      where bm.user_id = auth.uid()
    )
  );

-- Nova política de insert: apenas owner/editor do board podem adicionar assignees
create policy "task_assignees: owner/editor can insert"
  on public.task_assignees
  for insert
  with check (
    task_id in (
      select t.id from public.tasks t
      inner join public.board_members bm on bm.board_id = t.board_id
      where bm.user_id = auth.uid() and bm.access_role in ('owner','editor')
    )
  );

-- Nova política de delete: apenas owner/editor do board podem remover assignees
create policy "task_assignees: owner/editor can delete"
  on public.task_assignees
  for delete
  using (
    task_id in (
      select t.id from public.tasks t
      inner join public.board_members bm on bm.board_id = t.board_id
      where bm.user_id = auth.uid() and bm.access_role in ('owner','editor')
    )
  );
