create table public.task_statuses (
  id         uuid primary key default gen_random_uuid(),
  board_id   uuid not null references public.boards(id) on delete cascade,
  name       text not null,
  color      text not null default '#6366f1',
  sort_order int not null default 0
);

alter table public.task_statuses enable row level security;

create policy "task_statuses: members can read"
  on public.task_statuses for select
  using (
    board_id in (select id from public.boards where visibility in ('public','org'))
    or board_id in (select board_id from public.board_members where user_id = auth.uid())
  );

create policy "task_statuses: editors can insert"
  on public.task_statuses for insert
  with check (
    board_id in (
      select board_id from public.board_members
      where user_id = auth.uid() and access_role in ('owner','editor')
    )
  );

create policy "task_statuses: editors can update"
  on public.task_statuses for update
  using (
    board_id in (
      select board_id from public.board_members
      where user_id = auth.uid() and access_role in ('owner','editor')
    )
  );

create policy "task_statuses: editors can delete"
  on public.task_statuses for delete
  using (
    board_id in (
      select board_id from public.board_members
      where user_id = auth.uid() and access_role in ('owner','editor')
    )
  );
