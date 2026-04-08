-- =============================================
-- ADD CATEGORIZATION FIELDS TO TASK_ATTACHMENTS
-- =============================================
-- Adiciona campos para organizar anexos por categoria/tópico

alter table public.task_attachments
add column category text,
add column description text,
add column sort_order int not null default 0;

-- Comentários explicativos
comment on column public.task_attachments.category is 'Categoria/tópico do anexo (ex: Documentos, Imagens, Contratos)';
comment on column public.task_attachments.description is 'Descrição opcional do anexo';
comment on column public.task_attachments.sort_order is 'Ordem de exibição dentro da categoria';

-- Criar bucket de storage para task attachments (se não existir)
insert into storage.buckets (id, name, public)
values ('task-attachments', 'task-attachments', false)
on conflict (id) do nothing;

-- RLS policies para task_attachments storage
create policy "Users can view attachments from their boards"
on storage.objects for select
using (
  bucket_id = 'task-attachments' 
  and (
    -- Master pode ver tudo
    (select role_global from public.profiles where id = auth.uid()) = 'master'
    or
    -- Membros do board podem ver
    exists (
      select 1 from public.tasks t
      join public.board_members bm on bm.board_id = t.board_id
      where t.id::text = (storage.foldername(name))[1]
        and bm.user_id = auth.uid()
    )
  )
);

create policy "Owners and editors can upload attachments"
on storage.objects for insert
with check (
  bucket_id = 'task-attachments'
  and (
    -- Master pode fazer upload
    (select role_global from public.profiles where id = auth.uid()) = 'master'
    or
    -- Owners e editors do board podem fazer upload
    exists (
      select 1 from public.tasks t
      join public.board_members bm on bm.board_id = t.board_id
      where t.id::text = (storage.foldername(name))[1]
        and bm.user_id = auth.uid()
        and bm.access_role in ('owner', 'editor')
    )
  )
);

create policy "Owners and editors can delete attachments"
on storage.objects for delete
using (
  bucket_id = 'task-attachments'
  and (
    -- Master pode deletar
    (select role_global from public.profiles where id = auth.uid()) = 'master'
    or
    -- Owners e editors do board podem deletar
    exists (
      select 1 from public.tasks t
      join public.board_members bm on bm.board_id = t.board_id
      where t.id::text = (storage.foldername(name))[1]
        and bm.user_id = auth.uid()
        and bm.access_role in ('owner', 'editor')
    )
  )
);
