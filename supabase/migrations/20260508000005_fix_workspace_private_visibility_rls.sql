-- Corrigir RLS de workspaces: workspaces privados só visíveis para quem tem acesso

-- 1. Remover política atual que permite todos verem tudo
DROP POLICY IF EXISTS "workspaces: org members read" ON workspaces;

-- 2. Criar função auxiliar para verificar acesso a workspace privado
-- Um usuário tem acesso se for membro de pelo menos um board dentro do workspace
CREATE OR REPLACE FUNCTION has_workspace_access(p_workspace_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM boards b
    WHERE b.workspace_id = p_workspace_id
      AND b.id IN (SELECT my_board_ids())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Nova política: workspaces não-privados visíveis para todos da org
CREATE POLICY "workspaces: org members read non-private"
  ON workspaces
  FOR SELECT
  USING (
    visibility <> 'private'
    AND organization_id = my_org()
  );

-- 4. Nova política: workspaces privados visíveis apenas para criador, master ou quem tem board lá
CREATE POLICY "workspaces: private read if access"
  ON workspaces
  FOR SELECT
  USING (
    visibility = 'private'
    AND organization_id = my_org()
    AND (
      created_by = auth.uid()
      OR my_role() = 'master'
      OR has_workspace_access(id)
    )
  );
