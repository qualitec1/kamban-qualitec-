-- Migration: Sistema de Atualizações de Tarefas
-- Cria tabelas para atualizações, anexos, menções, curtidas e leituras

-- 1. Renomear task_comments para task_updates (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_comments') THEN
    ALTER TABLE task_comments RENAME TO task_updates;
  END IF;
END $$;

-- 2. Criar tabela task_updates (se não existir)
CREATE TABLE IF NOT EXISTS task_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES task_updates(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edited_at TIMESTAMPTZ
);

-- 3. Adicionar coluna parent_id se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'task_updates' AND column_name = 'parent_id'
  ) THEN
    ALTER TABLE task_updates ADD COLUMN parent_id UUID REFERENCES task_updates(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 4. Criar tabela task_update_attachments
CREATE TABLE IF NOT EXISTS task_update_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id UUID NOT NULL REFERENCES task_updates(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_data BYTEA NOT NULL, -- Armazenar arquivo como BLOB
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Criar tabela task_update_mentions
CREATE TABLE IF NOT EXISTS task_update_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id UUID NOT NULL REFERENCES task_updates(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(update_id, mentioned_user_id)
);

-- 6. Criar tabela task_update_likes
CREATE TABLE IF NOT EXISTS task_update_likes (
  update_id UUID NOT NULL REFERENCES task_updates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (update_id, user_id)
);

-- 7. Criar tabela task_update_reads
CREATE TABLE IF NOT EXISTS task_update_reads (
  update_id UUID NOT NULL REFERENCES task_updates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (update_id, user_id)
);

-- 8. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_task_updates_task_id ON task_updates(task_id);
CREATE INDEX IF NOT EXISTS idx_task_updates_author_id ON task_updates(author_id);
CREATE INDEX IF NOT EXISTS idx_task_updates_parent_id ON task_updates(parent_id);
CREATE INDEX IF NOT EXISTS idx_task_updates_created_at ON task_updates(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_task_update_attachments_update_id ON task_update_attachments(update_id);
CREATE INDEX IF NOT EXISTS idx_task_update_mentions_update_id ON task_update_mentions(update_id);
CREATE INDEX IF NOT EXISTS idx_task_update_mentions_mentioned_user_id ON task_update_mentions(mentioned_user_id);
CREATE INDEX IF NOT EXISTS idx_task_update_likes_update_id ON task_update_likes(update_id);
CREATE INDEX IF NOT EXISTS idx_task_update_likes_user_id ON task_update_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_task_update_reads_update_id ON task_update_reads(update_id);
CREATE INDEX IF NOT EXISTS idx_task_update_reads_user_id ON task_update_reads(user_id);

-- 9. Habilitar RLS em todas as tabelas
ALTER TABLE task_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_update_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_update_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_update_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_update_reads ENABLE ROW LEVEL SECURITY;

-- 10. Policies para task_updates
-- Usuários podem ver atualizações de tarefas que têm acesso (via board_members)
CREATE POLICY "Users can view updates of accessible tasks"
  ON task_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      INNER JOIN board_members bm ON bm.board_id = t.board_id
      WHERE t.id = task_updates.task_id
        AND bm.user_id = auth.uid()
    )
  );

-- Membros do board podem criar atualizações
CREATE POLICY "Board members can create updates"
  ON task_updates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks t
      INNER JOIN board_members bm ON bm.board_id = t.board_id
      WHERE t.id = task_updates.task_id
        AND bm.user_id = auth.uid()
    )
  );

-- Apenas autor pode editar sua atualização
CREATE POLICY "Authors can update their updates"
  ON task_updates FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Apenas autor pode deletar sua atualização
CREATE POLICY "Authors can delete their updates"
  ON task_updates FOR DELETE
  USING (author_id = auth.uid());

-- 11. Policies para task_update_attachments
-- Usuários podem ver anexos de atualizações que têm acesso
CREATE POLICY "Users can view attachments of accessible updates"
  ON task_update_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM task_updates tu
      INNER JOIN tasks t ON t.id = tu.task_id
      INNER JOIN board_members bm ON bm.board_id = t.board_id
      WHERE tu.id = task_update_attachments.update_id
        AND bm.user_id = auth.uid()
    )
  );

-- Membros do board podem criar anexos
CREATE POLICY "Board members can create attachments"
  ON task_update_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM task_updates tu
      INNER JOIN tasks t ON t.id = tu.task_id
      INNER JOIN board_members bm ON bm.board_id = t.board_id
      WHERE tu.id = task_update_attachments.update_id
        AND bm.user_id = auth.uid()
    )
  );

-- Autor da atualização pode deletar anexos
CREATE POLICY "Update authors can delete attachments"
  ON task_update_attachments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM task_updates tu
      WHERE tu.id = task_update_attachments.update_id
        AND tu.author_id = auth.uid()
    )
  );

-- 12. Policies para task_update_mentions
-- Usuários podem ver menções de atualizações que têm acesso
CREATE POLICY "Users can view mentions of accessible updates"
  ON task_update_mentions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM task_updates tu
      INNER JOIN tasks t ON t.id = tu.task_id
      INNER JOIN board_members bm ON bm.board_id = t.board_id
      WHERE tu.id = task_update_mentions.update_id
        AND bm.user_id = auth.uid()
    )
  );

-- Sistema pode criar menções (via trigger ou API)
CREATE POLICY "System can create mentions"
  ON task_update_mentions FOR INSERT
  WITH CHECK (true);

-- 13. Policies para task_update_likes
-- Usuários podem ver curtidas de atualizações que têm acesso
CREATE POLICY "Users can view likes of accessible updates"
  ON task_update_likes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM task_updates tu
      INNER JOIN tasks t ON t.id = tu.task_id
      INNER JOIN board_members bm ON bm.board_id = t.board_id
      WHERE tu.id = task_update_likes.update_id
        AND bm.user_id = auth.uid()
    )
  );

-- Membros do board podem curtir
CREATE POLICY "Board members can like updates"
  ON task_update_likes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM task_updates tu
      INNER JOIN tasks t ON t.id = tu.task_id
      INNER JOIN board_members bm ON bm.board_id = t.board_id
      WHERE tu.id = task_update_likes.update_id
        AND bm.user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Usuários podem descurtir suas próprias curtidas
CREATE POLICY "Users can unlike their likes"
  ON task_update_likes FOR DELETE
  USING (user_id = auth.uid());

-- 14. Policies para task_update_reads
-- Usuários podem ver leituras de atualizações que têm acesso
CREATE POLICY "Users can view reads of accessible updates"
  ON task_update_reads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM task_updates tu
      INNER JOIN tasks t ON t.id = tu.task_id
      INNER JOIN board_members bm ON bm.board_id = t.board_id
      WHERE tu.id = task_update_reads.update_id
        AND bm.user_id = auth.uid()
    )
  );

-- Membros do board podem marcar como lida
CREATE POLICY "Board members can mark updates as read"
  ON task_update_reads FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM task_updates tu
      INNER JOIN tasks t ON t.id = tu.task_id
      INNER JOIN board_members bm ON bm.board_id = t.board_id
      WHERE tu.id = task_update_reads.update_id
        AND bm.user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- 15. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_task_updates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_updates_updated_at
  BEFORE UPDATE ON task_updates
  FOR EACH ROW
  EXECUTE FUNCTION update_task_updates_updated_at();

-- 16. Comentários
COMMENT ON TABLE task_updates IS 'Atualizações/comentários de tarefas';
COMMENT ON TABLE task_update_attachments IS 'Anexos de atualizações (arquivos, áudios, imagens) armazenados como BLOB';
COMMENT ON TABLE task_update_mentions IS 'Menções de usuários em atualizações';
COMMENT ON TABLE task_update_likes IS 'Curtidas em atualizações';
COMMENT ON TABLE task_update_reads IS 'Registro de leitura de atualizações';
