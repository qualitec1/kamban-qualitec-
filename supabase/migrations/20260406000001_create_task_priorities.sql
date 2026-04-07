create table public.task_priorities (
  id         uuid primary key default gen_random_uuid(),
  board_id   uuid not null references public.boards(id) on delete cascade,
  name       text not null,
  color      text not null default '#6366f1',
  sort_order int not null default 0
);

alter table public.task_priorities enable row level security;

create policy "task_priorities: members can read"
  on public.task_priorities for select
  using (
    board_id in (select id from public.boards where visibility in ('public','org'))
    or board_id in (select board_id from public.board_members where user_id = auth.uid())
  );

create policy "task_priorities: editors can insert"
  on public.task_priorities for insert
  with check (
    board_id in (
      select board_id from public.board_members
      where user_id = auth.uid() and access_role in ('owner','editor')
    )
  );

create policy "task_priorities: editors can update"
  on public.task_priorities for update
  using (
    board_id in (
      select board_id from public.board_members
      where user_id = auth.uid() and access_role in ('owner','editor')
    )
  );

create policy "task_priorities: editors can delete"
  on public.task_priorities for delete
  using (
    board_id in (
      select board_id from public.board_members
      where user_id = auth.uid() and access_role in ('owner','editor')
    )
  );
