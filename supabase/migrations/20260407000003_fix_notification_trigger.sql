-- =============================================
-- FIX: Notificações devem ser enviadas para TODOS os owners/editors
-- =============================================
-- Problema: Notificações não eram criadas quando havia apenas 1 membro no board
-- Solução: Remover filtro que exclui o próprio ator

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
  
  -- Criar notificação para TODOS os owners/editors do board (incluindo o ator)
  -- Isso garante que mesmo em boards com 1 único membro, a notificação seja criada
  if v_action IN ('task_deleted', 'task_archived') then
    insert into public.notifications (user_id, type, title, body, link)
    select 
      bm.user_id,
      v_action,
      case 
        when v_action = 'task_deleted' then 'Tarefa excluída'
        when v_action = 'task_archived' then 'Tarefa arquivada'
      end,
      case 
        when bm.user_id = v_actor_id then 
          'Você ' || 
          case 
            when v_action = 'task_deleted' then 'excluiu a tarefa "' || v_task_title || '"'
            when v_action = 'task_archived' then 'arquivou a tarefa "' || v_task_title || '"'
          end
        else
          coalesce((select full_name from public.profiles where id = v_actor_id), 'Um usuário') || ' ' ||
          case 
            when v_action = 'task_deleted' then 'excluiu a tarefa "' || v_task_title || '"'
            when v_action = 'task_archived' then 'arquivou a tarefa "' || v_task_title || '"'
          end
      end,
      '/boards/' || v_board_id
    from public.board_members bm
    where bm.board_id = v_board_id
      and bm.access_role in ('owner', 'editor');
  end if;
  
  if (TG_OP = 'DELETE') then
    return OLD;
  else
    return NEW;
  end if;
end;
$$;
