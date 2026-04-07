-- ============================================================
-- FIX 1: task_comments — leitura vazava para boards privados
-- ============================================================
DROP POLICY IF EXISTS "task_comments: read all in org" ON public.task_comments;

CREATE POLICY "task_comments: read if board member"
  ON public.task_comments FOR SELECT
  USING (
    task_id IN (
      SELECT t.id FROM public.tasks t
      WHERE t.board_id IN (SELECT my_board_ids())
    )
  );

-- ============================================================
-- FIX 2: board_members — usuário podia se adicionar a board privado
-- ============================================================
DROP POLICY IF EXISTS "board_members: user can add self" ON public.board_members;

CREATE POLICY "board_members: user can add self to non-private board"
  ON public.board_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND board_id IN (
      SELECT b.id FROM public.boards b
      JOIN public.workspaces w ON w.id = b.workspace_id
      WHERE w.organization_id = my_org()
        AND b.visibility != 'private'
    )
  );

-- ============================================================
-- FIX 3: tasks — collaborator sem verificação de org
-- ============================================================
DROP POLICY IF EXISTS "tasks: collaborator+ manages" ON public.tasks;

CREATE POLICY "tasks: collaborator+ manages in org boards"
  ON public.tasks FOR ALL
  USING (
    my_role() = ANY (ARRAY['master'::user_role, 'collaborator'::user_role])
    AND board_id IN (
      SELECT b.id FROM public.boards b
      JOIN public.workspaces w ON w.id = b.workspace_id
      WHERE w.organization_id = my_org()
    )
  )
  WITH CHECK (
    my_role() = ANY (ARRAY['master'::user_role, 'collaborator'::user_role])
    AND board_id IN (
      SELECT b.id FROM public.boards b
      JOIN public.workspaces w ON w.id = b.workspace_id
      WHERE w.organization_id = my_org()
    )
  );

-- ============================================================
-- FIX 4: subtasks — sem verificação de org
-- ============================================================
DROP POLICY IF EXISTS "subtasks: collaborator+ manages" ON public.subtasks;

CREATE POLICY "subtasks: collaborator+ manages in org boards"
  ON public.subtasks FOR ALL
  USING (
    my_role() = ANY (ARRAY['master'::user_role, 'collaborator'::user_role])
    AND task_id IN (
      SELECT t.id FROM public.tasks t
      JOIN public.boards b ON b.id = t.board_id
      JOIN public.workspaces w ON w.id = b.workspace_id
      WHERE w.organization_id = my_org()
    )
  )
  WITH CHECK (
    my_role() = ANY (ARRAY['master'::user_role, 'collaborator'::user_role])
    AND task_id IN (
      SELECT t.id FROM public.tasks t
      JOIN public.boards b ON b.id = t.board_id
      JOIN public.workspaces w ON w.id = b.workspace_id
      WHERE w.organization_id = my_org()
    )
  );

-- ============================================================
-- FIX 5: task_statuses e task_priorities — inconsistência de modelo
-- ============================================================
DROP POLICY IF EXISTS "task_statuses: editors can insert" ON public.task_statuses;
DROP POLICY IF EXISTS "task_statuses: editors can update" ON public.task_statuses;
DROP POLICY IF EXISTS "task_statuses: editors can delete" ON public.task_statuses;

CREATE POLICY "task_statuses: collaborator+ manages"
  ON public.task_statuses FOR ALL
  USING (
    my_role() = ANY (ARRAY['master'::user_role, 'collaborator'::user_role])
    AND board_id IN (
      SELECT b.id FROM public.boards b
      JOIN public.workspaces w ON w.id = b.workspace_id
      WHERE w.organization_id = my_org()
    )
  )
  WITH CHECK (
    my_role() = ANY (ARRAY['master'::user_role, 'collaborator'::user_role])
    AND board_id IN (
      SELECT b.id FROM public.boards b
      JOIN public.workspaces w ON w.id = b.workspace_id
      WHERE w.organization_id = my_org()
    )
  );

DROP POLICY IF EXISTS "task_priorities: editors can insert" ON public.task_priorities;
DROP POLICY IF EXISTS "task_priorities: editors can update" ON public.task_priorities;
DROP POLICY IF EXISTS "task_priorities: editors can delete" ON public.task_priorities;

CREATE POLICY "task_priorities: collaborator+ manages"
  ON public.task_priorities FOR ALL
  USING (
    my_role() = ANY (ARRAY['master'::user_role, 'collaborator'::user_role])
    AND board_id IN (
      SELECT b.id FROM public.boards b
      JOIN public.workspaces w ON w.id = b.workspace_id
      WHERE w.organization_id = my_org()
    )
  )
  WITH CHECK (
    my_role() = ANY (ARRAY['master'::user_role, 'collaborator'::user_role])
    AND board_id IN (
      SELECT b.id FROM public.boards b
      JOIN public.workspaces w ON w.id = b.workspace_id
      WHERE w.organization_id = my_org()
    )
  );

-- ============================================================
-- FIX 6: activity_logs — INSERT bloqueado para clientes
-- Logs só via service_role (Edge Functions)
-- ============================================================
-- Sem CREATE POLICY para INSERT = bloqueado por padrão com RLS habilitado
