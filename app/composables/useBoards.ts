import { ref, useState } from '#imports'
import type { Database, Tables } from '#shared/types/database'
import { createClient } from '@supabase/supabase-js'
import type { AuthUser } from '#shared/types/auth'

type SupabaseClient = ReturnType<typeof createClient<Database>>
type Board = Tables<'boards'>

export function useBoards() {
  function getClient(): SupabaseClient {
    if (import.meta.server) throw new Error('[useBoards] SSR not supported')
    return useNuxtApp().$supabase as SupabaseClient
  }

  const authUser = useState<AuthUser | null>('auth:user', () => null)

  const boards = ref<Board[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchBoards(workspaceId?: string) {
    if (!authUser.value?.organizationId) return

    loading.value = true
    error.value = null

    try {
      const supabase = getClient()
      let query = supabase
        .from('boards')
        .select('*')
        .order('created_at', { ascending: false })

      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId)
      }

      const { data, error: fetchError } = await query
      if (fetchError) throw fetchError
      boards.value = data || []
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function createBoard(payload: {
    name: string
    description?: string
    workspace_id: string
    board_type: Database['public']['Enums']['board_type']
    visibility: Database['public']['Enums']['visibility_type']
    cover_color?: string
  }) {
    if (!authUser.value) {
      error.value = 'Usuário não autenticado'
      return null
    }

    try {
      const supabase = getClient()

      // Validar se o workspace existe e pertence à organização do usuário
      const { data: workspaceCheck, error: workspaceError } = await supabase
        .from('workspaces')
        .select('id, name, organization_id')
        .eq('id', payload.workspace_id)
        .eq('organization_id', authUser.value.organizationId)
        .single()

      if (workspaceError || !workspaceCheck) {
        console.error('[useBoards] Workspace validation failed:', workspaceError)
        error.value = 'Área de trabalho inválida ou não encontrada'
        return null
      }

      console.log('[useBoards] Workspace validated:', workspaceCheck)

      // Gerar UUID no cliente para saber o board_id antes de inserir
      const boardId = crypto.randomUUID()

      console.log('[useBoards] Creating board:', {
        boardId,
        payload,
        userId: authUser.value.id,
        userOrg: authUser.value.organizationId,
        userRole: authUser.value.role
      })

      // Log do token JWT para debug
      const session = await supabase.auth.getSession()
      console.log('[useBoards] Session check:', {
        hasSession: !!session.data.session,
        userId: session.data.session?.user?.id,
        tokenPresent: !!session.data.session?.access_token
      })

      // Criar o board primeiro
      const { error: insertError } = await supabase
        .from('boards')
        .insert({ 
          id: boardId, 
          ...payload, 
          created_by: authUser.value.id 
        })

      if (insertError) {
        console.error('[useBoards] Insert error:', insertError)
        error.value = insertError.message || 'Erro ao criar quadro'
        throw insertError
      }

      console.log('[useBoards] Board created:', boardId)

      // SEMPRE adicionar o criador como owner (independente de ser público ou privado)
      // Isso garante que o criador tenha permissões completas de edição
      const { error: memberError } = await supabase
        .from('board_members')
        .insert({ 
          board_id: boardId, 
          user_id: authUser.value.id, 
          access_role: 'owner' 
        })

      if (memberError) {
        console.error('[useBoards] Member error:', memberError)
        // Não falhar se já existir (pode ser que a policy já tenha criado)
        if (!memberError.message.includes('duplicate')) {
          error.value = 'Erro ao adicionar membro ao quadro'
          throw memberError
        }
      }

      console.log('[useBoards] Creator added as owner')

      // Criar grupo padrão
      const { error: groupError } = await supabase
        .from('task_groups')
        .insert({ board_id: boardId, name: 'Tarefas', color: '#6366f1', sort_order: 0, is_collapsed: false })

      if (groupError) {
        console.error('[useBoards] Group error:', groupError)
      }

      await fetchBoards(payload.workspace_id)

      // Retornar o board da lista já atualizada
      return boards.value.find(b => b.id === boardId) ?? null
    } catch (e: any) {
      console.error('[useBoards] Create board error:', e)
      error.value = e.message || 'Erro ao criar quadro'
      return null
    }
  }

  async function updateBoard(id: string, updates: Partial<Pick<Board, 'name' | 'description' | 'visibility' | 'cover_color' | 'board_type'>>) {
    try {
      const supabase = getClient()
      const { error: updateError } = await supabase
        .from('boards')
        .update(updates)
        .eq('id', id)

      if (updateError) throw updateError

      const idx = boards.value.findIndex(b => b.id === id)
      if (idx !== -1) boards.value[idx] = { ...boards.value[idx], ...updates }
      return true
    } catch (e: any) {
      error.value = e.message
      return false
    }
  }

  async function deleteBoard(id: string) {
    try {
      const supabase = getClient()
      const { error: deleteError } = await supabase
        .from('boards')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      boards.value = boards.value.filter(b => b.id !== id)
      return true
    } catch (e: any) {
      error.value = e.message
      return false
    }
  }

  async function fetchBoardsByWorkspace(workspaceId: string) {
    return fetchBoards(workspaceId)
  }

  return { 
    boards, 
    loading, 
    error, 
    fetchBoards, 
    fetchBoardsByWorkspace,
    createBoard, 
    updateBoard, 
    deleteBoard 
  }
}
