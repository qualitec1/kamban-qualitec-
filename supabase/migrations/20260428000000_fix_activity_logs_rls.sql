-- Adicionar política de INSERT para activity_logs
-- Permite que colaboradores e masters insiram logs de atividade
create policy "activity_logs: collaborator+ can insert" 
  on public.activity_logs 
  for insert 
  with check (public.my_role() in ('master','collaborator'));

-- Adicionar política de INSERT para notifications
create policy "notifications: system can insert" 
  on public.notifications 
  for insert 
  with check (true);
