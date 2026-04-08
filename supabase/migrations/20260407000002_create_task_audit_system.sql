-- =============================================
-- SISTEMA DE AUDITORIA E NOTIFICAÇÕES PARA TAREFAS
-- =============================================

-- Função para registrar atividades de tarefas
create or replace function public.log_task_activity()
returns trigger language plpgsql security definer as $$
declare
  v_actor_id uuid;
  v_action text;
  v_meta jsonb;
  v_board_id uuid;
  v_task_title text;
begin
  v_actor_id := auth.uid();
  
  -- Determinar ação e metadados
  if (TG_OP = 'INSERT') then
    v_action := 'task_created';
    v_board_id := NEW.board_id;
    v_task_title := NEW.title;
    v_meta := jsonb_build_object(
      'task_id', NEW.id,
      'task_title', NEW.title,
      'board_id', NEW.board_id
    );
    
  elsif (TG_OP = 'UPDATE') then
    v_board_id := NEW.board_id;
    v_task_title := NEW.title;
    
    -- Detectar qual campo foi alterado
    if (OLD.title IS DISTINCT FROM NEW.title) then
      v_action := 'task_title_changed';
      v_meta := jsonb_build_object(
        'task_id', NEW.id,
        'task_title', NEW.title,
        'old_value', OLD.title,
        'new_value', NEW.title,
        'board_id', NEW.board_id
      );
      
    elsif (OLD.status_id IS DISTINCT FROM NEW.status_id) then
      v_action := 'task_status_changed';
      v_meta := jsonb_build_object(
        'task_id', NEW.id,
        'task_title', NEW.title,
        'old_status_id', OLD.status_id,
        'new_status_id', NEW.status_id,
        'board_id', NEW.board_id
      );
      
    elsif (OLD.priority_id IS DISTINCT FROM NEW.priority_id) then
      v_action := 'task_priority_changed';
      v_meta := jsonb_build_object(
        'task_id', NEW.id,
        'task_title', NEW.title,
        'old_priority_id', OLD.priority_id,
        'new_priority_id', NEW.priority_id,
        'board_id', NEW.board_id
      );
      
    elsif (OLD.due_date IS DISTINCT FROM NEW.due_date) then
      v_action := 'task_due_date_changed';
      v_meta := jsonb_build_object(
        'task_id', NEW.id,
        'task_title', NEW.title,
        'old_value', OLD.due_date,
        'new_value', NEW.due_date,
        'board_id', NEW.board_id
      );
      
    elsif (OLD.start_date IS DISTINCT FROM NEW.start_date) then
      v_action := 'task_start_date_changed';
      v_meta := jsonb_build_object(
        'task_id', NEW.id,
        'task_title', NEW.title,
        'old_value', OLD.start_date,
        'new_value', NEW.start_date,
        'board_id', NEW.board_id
      );
      
    elsif (OLD.description IS DISTINCT FROM NEW.description) then
      v_action := 'task_description_changed';
      v_meta := jsonb_build_object(
        'task_id', NEW.id,
        'task_title', NEW.title,
        'board_id', NEW.board_id
      );
      
    elsif (OLD.budget IS DISTINCT FROM NEW.budget) then
      v_action := 'task_budget_changed';
      v_meta := jsonb_build_object(
        'task_id', NEW.id,
        'task_title', NEW.title,
        'old_value', OLD.budget,
        'new_value', NEW.budget,
        'board_id', NEW.board_id
      );
      
    elsif (OLD.archived_at IS DISTINCT FROM NEW.archived_at) then
      if NEW.archived_at IS NOT NULL then
        v_action := 'task_archived';
      else
        v_action := 'task_unarchived';
      end if;
      v_meta := jsonb_build_object(
        'task_id', NEW.id,
        'task_title', NEW.title,
        'board_id', NEW.board_id
      );
      
    else
      -- Outra alteração genérica
      return NEW;
    end if;
    
  elsif (TG_OP = 'DELETE') then
    v_action := 'task_deleted';
    v_board_id := OLD.board_id;
    v_task_title := OLD.title;
    v_meta := jsonb_build_object(
      'task_id', OLD.id,
      'task_title', OLD.title,
      'board_id', OLD.board_id
    );
  end if;
  
  -- Registrar no activity_log
  insert into public.activity_logs (actor_id, entity_type, entity_id, action, meta_json)
  values (
    v_actor_id,
    'task',
    coalesce(NEW.id, OLD.id),
    v_action,
    v_meta
  );
  
  -- Criar notificação para owners/editors do board (exceto o próprio ator)
  if v_action IN ('task_deleted', 'task_archived') then
    insert into public.notifications (user_id, type, title, body, link)
    select 
      bm.user_id,
      v_action,
      case 
        when v_action = 'task_deleted' then 'Tarefa excluída'
        when v_action = 'task_archived' then 'Tarefa arquivada'
      end,
      (select full_name from public.profiles where id = v_actor_id) || ' ' ||
      case 
        when v_action = 'task_deleted' then 'excluiu a tarefa "' || v_task_title || '"'
        when v_action = 'task_archived' then 'arquivou a tarefa "' || v_task_title || '"'
      end,
      '/boards/' || v_board_id
    from public.board_members bm
    where bm.board_id = v_board_id
      and bm.access_role in ('owner', 'editor')
      and bm.user_id != v_actor_id;
  end if;
  
  if (TG_OP = 'DELETE') then
    return OLD;
  else
    return NEW;
  end if;
end;
$$;

-- Trigger para tarefas
drop trigger if exists task_activity_trigger on public.tasks;
create trigger task_activity_trigger
  after insert or update or delete on public.tasks
  for each row execute function public.log_task_activity();

-- Função para registrar alterações de assignees
create or replace function public.log_assignee_activity()
returns trigger language plpgsql security definer as $$
declare
  v_actor_id uuid;
  v_action text;
  v_meta jsonb;
  v_task_title text;
  v_board_id uuid;
  v_assignee_name text;
begin
  v_actor_id := auth.uid();
  
  -- Buscar informações da tarefa
  select t.title, t.board_id into v_task_title, v_board_id
  from public.tasks t
  where t.id = coalesce(NEW.task_id, OLD.task_id);
  
  -- Buscar nome do assignee
  select p.full_name into v_assignee_name
  from public.profiles p
  where p.id = coalesce(NEW.user_id, OLD.user_id);
  
  if (TG_OP = 'INSERT') then
    v_action := 'assignee_added';
    v_meta := jsonb_build_object(
      'task_id', NEW.task_id,
      'task_title', v_task_title,
      'user_id', NEW.user_id,
      'user_name', v_assignee_name,
      'board_id', v_board_id
    );
    
  elsif (TG_OP = 'DELETE') then
    v_action := 'assignee_removed';
    v_meta := jsonb_build_object(
      'task_id', OLD.task_id,
      'task_title', v_task_title,
      'user_id', OLD.user_id,
      'user_name', v_assignee_name,
      'board_id', v_board_id
    );
  end if;
  
  -- Registrar no activity_log
  insert into public.activity_logs (actor_id, entity_type, entity_id, action, meta_json)
  values (
    v_actor_id,
    'task',
    coalesce(NEW.task_id, OLD.task_id),
    v_action,
    v_meta
  );
  
  if (TG_OP = 'DELETE') then
    return OLD;
  else
    return NEW;
  end if;
end;
$$;

-- Trigger para assignees
drop trigger if exists assignee_activity_trigger on public.task_assignees;
create trigger assignee_activity_trigger
  after insert or delete on public.task_assignees
  for each row execute function public.log_assignee_activity();

-- Índices para performance
create index if not exists idx_activity_logs_entity on public.activity_logs(entity_type, entity_id);
create index if not exists idx_activity_logs_created_at on public.activity_logs(created_at desc);
create index if not exists idx_notifications_user_unread on public.notifications(user_id, read_at) where read_at is null;
create index if not exists idx_notifications_created_at on public.notifications(created_at desc);

-- Atualizar políticas RLS para activity_logs
drop policy if exists "activity_logs: read in org" on public.activity_logs;

create policy "activity_logs: board members can read"
  on public.activity_logs
  for select
  using (
    entity_type = 'task' and
    meta_json->>'board_id' in (
      select board_id::text from public.board_members
      where user_id = auth.uid()
    )
  );

-- Atualizar políticas RLS para notifications
drop policy if exists "notifications: own only" on public.notifications;

create policy "notifications: user can read own"
  on public.notifications
  for select
  using (user_id = auth.uid());

create policy "notifications: user can update own"
  on public.notifications
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "notifications: user can delete own"
  on public.notifications
  for delete
  using (user_id = auth.uid());
