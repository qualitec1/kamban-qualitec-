-- Migration: Fix task_update_attachments column names
-- Renomeia colunas para corresponder ao código TypeScript

-- 1. Renomear file_size para size_bytes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'task_update_attachments' AND column_name = 'file_size'
  ) THEN
    ALTER TABLE task_update_attachments RENAME COLUMN file_size TO size_bytes;
  END IF;
END $$;

-- 2. Renomear file_type para attachment_type
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'task_update_attachments' AND column_name = 'file_type'
  ) THEN
    ALTER TABLE task_update_attachments RENAME COLUMN file_type TO attachment_type;
  END IF;
END $$;

-- 3. Adicionar coluna file_path se não existir (para compatibilidade)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'task_update_attachments' AND column_name = 'file_path'
  ) THEN
    ALTER TABLE task_update_attachments ADD COLUMN file_path TEXT DEFAULT '';
  END IF;
END $$;

-- 4. Adicionar coluna uploaded_by se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'task_update_attachments' AND column_name = 'uploaded_by'
  ) THEN
    ALTER TABLE task_update_attachments ADD COLUMN uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

COMMENT ON COLUMN task_update_attachments.size_bytes IS 'Tamanho do arquivo em bytes';
COMMENT ON COLUMN task_update_attachments.attachment_type IS 'Tipo de anexo: image, audio, file';
COMMENT ON COLUMN task_update_attachments.file_path IS 'Caminho do arquivo (vazio quando usando BLOB)';
COMMENT ON COLUMN task_update_attachments.uploaded_by IS 'Usuário que fez upload do anexo';
