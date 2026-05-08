-- Migration: Criar triggers para notificações automáticas de tarefas
-- Descrição: Notifica usuários sobre comentários, curtidas, mudanças de status, atribuições e menções

-- =====================================================
-- 1. FUNÇÃO AUXILIAR: Obter responsáveis de uma tarefa
-- =====================================================
CREATE OR REPLACE FUNCTION get_task_assignees(p_task_id UUID)
RETURNS TABLE(user_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT ta.user_id
  FROM task_assignees ta
  WHERE ta.task_id = p_task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. FUNÇÃO AUXILIAR: Obter criador da tarefa
-- =====================================================
CREATE OR REPLACE FUNCTION get_task_creator(p_task_id UUID)
RETURNS UUID AS $$
DECLARE
  v_creator_id UUID;
BEGIN
  SELECT created_by INTO v_creator_id
  FROM tasks
  WHERE id = p_task_id;
  
  RETURN v_creator_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. FUNÇÃO AUXILIAR: Obter nome da tarefa
-- =====================================================
CREATE OR REPLACE FUNCTION get_task_title(p_task_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_title TEXT;
BEGIN
  SELECT title INTO v_title
  FROM tasks
  WHERE id = p_task_id;
  
  RETURN v_title;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. FUNÇÃO AUXILIAR: Obter nome do usuário
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_name(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_name TEXT;
BEGIN
  SELECT COALESCE(full_name, email) INTO v_name
  FROM profiles
  WHERE id = p_user_id;
  
  RETURN v_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. TRIGGER: Notificar sobre novos comentários
-- =====================================================
CREATE OR REPLACE FUNCTION notify_task_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_task_title TEXT;
  v_author_name TEXT;
  v_assignee_id UUID;
  v_creator_id UUID;
BEGIN
  -- Apenas para comentários principais (não respostas)
  IF NEW.parent_id IS NULL THEN
    v_task_title := get_task_title(NEW.task_id);
    v_author_name := get_user_name(NEW.author_id);
    v_creator_id := get_task_creator(NEW.task_id);
    
    -- Notificar responsáveis (exceto o autor do comentário)
    FOR v_assignee_id IN SELECT user_id FROM get_task_assignees(NEW.task_id)
    LOOP
      IF v_assignee_id != NEW.author_id THEN
        INSERT INTO notifications (user_id, type, title, body, link)
        VALUES (
          v_assignee_id,
          'task_comment',
          'Novo comentário',
          v_author_name || ' comentou em "' || v_task_title || '"',
          '/tasks/' || NEW.task_id
        );
      END IF;
    END LOOP;
    
    -- Notificar criador da tarefa (se não for responsável e não for o autor)
    IF v_creator_id IS NOT NULL 
       AND v_creator_id != NEW.author_id 
       AND NOT EXISTS (SELECT 1 FROM task_assignees WHERE task_id = NEW.task_id AND user_id = v_creator_id) THEN
      INSERT INTO notifications (user_id, type, title, body, link)
      VALUES (
        v_creator_id,
        'task_comment',
        'Novo comentário',
        v_author_name || ' comentou em "' || v_task_title || '"',
        '/tasks/' || NEW.task_id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_task_comment ON task_updates;
CREATE TRIGGER trigger_notify_task_comment
  AFTER INSERT ON task_updates
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_comment();

-- =====================================================
-- 6. TRIGGER: Notificar sobre curtidas em comentários
-- =====================================================
CREATE OR REPLACE FUNCTION notify_comment_like()
RETURNS TRIGGER AS $$
DECLARE
  v_update_author_id UUID;
  v_liker_name TEXT;
  v_task_id UUID;
  v_task_title TEXT;
BEGIN
  -- Obter autor do comentário
  SELECT author_id, task_id INTO v_update_author_id, v_task_id
  FROM task_updates
  WHERE id = NEW.update_id;
  
  -- Não notificar se o autor curtiu o próprio comentário
  IF v_update_author_id != NEW.user_id THEN
    v_liker_name := get_user_name(NEW.user_id);
    v_task_title := get_task_title(v_task_id);
    
    INSERT INTO notifications (user_id, type, title, body, link)
    VALUES (
      v_update_author_id,
      'comment_like',
      'Curtida no comentário',
      v_liker_name || ' curtiu seu comentário em "' || v_task_title || '"',
      '/tasks/' || v_task_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_comment_like ON task_update_likes;
CREATE TRIGGER trigger_notify_comment_like
  AFTER INSERT ON task_update_likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_comment_like();

-- =====================================================
-- 7. TRIGGER: Notificar sobre mudança de status
-- =====================================================
CREATE OR REPLACE FUNCTION notify_task_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_task_title TEXT;
  v_new_status_name TEXT;
  v_assignee_id UUID;
  v_creator_id UUID;
BEGIN
  -- Apenas se o status mudou
  IF OLD.status_id IS DISTINCT FROM NEW.status_id AND NEW.status_id IS NOT NULL THEN
    v_task_title := NEW.title;
    v_creator_id := NEW.created_by;
    
    -- Obter nome do novo status
    SELECT name INTO v_new_status_name
    FROM task_statuses
    WHERE id = NEW.status_id;
    
    -- Notificar responsáveis
    FOR v_assignee_id IN SELECT user_id FROM get_task_assignees(NEW.id)
    LOOP
      INSERT INTO notifications (user_id, type, title, body, link)
      VALUES (
        v_assignee_id,
        'task_status_change',
        'Status atualizado',
        'Status de "' || v_task_title || '" mudou para ' || v_new_status_name,
        '/tasks/' || NEW.id
      );
    END LOOP;
    
    -- Notificar criador (se não for responsável)
    IF v_creator_id IS NOT NULL 
       AND NOT EXISTS (SELECT 1 FROM task_assignees WHERE task_id = NEW.id AND user_id = v_creator_id) THEN
      INSERT INTO notifications (user_id, type, title, body, link)
      VALUES (
        v_creator_id,
        'task_status_change',
        'Status atualizado',
        'Status de "' || v_task_title || '" mudou para ' || v_new_status_name,
        '/tasks/' || NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_task_status_change ON tasks;
CREATE TRIGGER trigger_notify_task_status_change
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_status_change();

-- =====================================================
-- 8. TRIGGER: Notificar sobre nova atribuição
-- =====================================================
CREATE OR REPLACE FUNCTION notify_task_assignment()
RETURNS TRIGGER AS $$
DECLARE
  v_task_title TEXT;
  v_assigner_name TEXT;
BEGIN
  v_task_title := get_task_title(NEW.task_id);
  
  -- Obter quem atribuiu (usuário atual)
  v_assigner_name := get_user_name(auth.uid());
  
  -- Notificar o novo responsável
  INSERT INTO notifications (user_id, type, title, body, link)
  VALUES (
    NEW.user_id,
    'task_assigned',
    'Nova tarefa atribuída',
    CASE 
      WHEN v_assigner_name IS NOT NULL THEN v_assigner_name || ' atribuiu você à tarefa "' || v_task_title || '"'
      ELSE 'Você foi atribuído à tarefa "' || v_task_title || '"'
    END,
    '/tasks/' || NEW.task_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_task_assignment ON task_assignees;
CREATE TRIGGER trigger_notify_task_assignment
  AFTER INSERT ON task_assignees
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_assignment();

-- =====================================================
-- 9. TRIGGER: Notificar sobre menções
-- =====================================================
CREATE OR REPLACE FUNCTION notify_task_mention()
RETURNS TRIGGER AS $$
DECLARE
  v_task_id UUID;
  v_task_title TEXT;
  v_author_name TEXT;
BEGIN
  -- Obter task_id do update
  SELECT task_id INTO v_task_id
  FROM task_updates
  WHERE id = NEW.update_id;
  
  v_task_title := get_task_title(v_task_id);
  
  -- Obter autor do comentário
  SELECT get_user_name(author_id) INTO v_author_name
  FROM task_updates
  WHERE id = NEW.update_id;
  
  -- Notificar usuário mencionado
  INSERT INTO notifications (user_id, type, title, body, link)
  VALUES (
    NEW.mentioned_user_id,
    'task_mention',
    'Você foi mencionado',
    v_author_name || ' mencionou você em "' || v_task_title || '"',
    '/tasks/' || v_task_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_task_mention ON task_update_mentions;
CREATE TRIGGER trigger_notify_task_mention
  AFTER INSERT ON task_update_mentions
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_mention();

-- =====================================================
-- 10. Adicionar tasks à publicação realtime
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

COMMENT ON TRIGGER trigger_notify_task_comment ON task_updates IS 'Notifica responsáveis e criador sobre novos comentários';
COMMENT ON TRIGGER trigger_notify_comment_like ON task_update_likes IS 'Notifica autor do comentário sobre curtidas';
COMMENT ON TRIGGER trigger_notify_task_status_change ON tasks IS 'Notifica responsáveis e criador sobre mudanças de status';
COMMENT ON TRIGGER trigger_notify_task_assignment ON task_assignees IS 'Notifica usuário sobre nova atribuição';
COMMENT ON TRIGGER trigger_notify_task_mention ON task_update_mentions IS 'Notifica usuário sobre menções em comentários';
