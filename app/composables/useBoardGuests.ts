import { ref } from '#imports'
import type { Database } from '#shared/types/database'
import { createClient } from '@supabase/supabase-js'

type SupabaseClient = ReturnType<typeof createClient<Database>>
type AccessRole = Database['public']['Enums']['board_access_role']

export function useBoardGuests() {
  function getClient(): SupabaseClient {
    if (import.meta.server) throw new Error('[useBoardGuests] SSR not supported')
    return useNuxtApp().$supabase as SupabaseClient
  }

  const orgUsers = ref<{ id: string; full_name: string | null; email: string }[]>([])
  const loadingOrgUsers = ref(false)

  /** Carrega todos os usuários da organização para o seletor de convite */
  async function fetchOrgUsers() {
    loadingOrgUsers.value = true
    try {
      const supabase = getClient()
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name')

      orgUsers.value = data || []
    } finally {
      loadingOrgUsers.value = false
    }
  }

  /**
   * Retorna o papel do usuário atual em um board específico.
   * Retorna null se não for membro.
   */
  async function getMyRole(boardId: string): Promise<AccessRole | null> {
    try {
      const supabase = getClient()
      const { data } = await supabase
        .from('board_members')
        .select('access_role')
        .eq('board_id', boardId)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id ?? '')
        .single()

      return (data?.access_role as AccessRole) ?? null
    } catch {
      return null
    }
  }

  /** Verifica se o usuário atual é convidado (guest) neste board */
  async function isGuest(boardId: string): Promise<boolean> {
    const role = await getMyRole(boardId)
    return role === 'guest'
  }

  /** Verifica se o usuário atual é observador neste board */
  async function isObserver(boardId: string): Promise<boolean> {
    const role = await getMyRole(boardId)
    return role === 'observer'
  }

  /** Verifica se o usuário é somente leitura (guest ou observer) */
  async function isReadOnly(boardId: string): Promise<boolean> {
    const role = await getMyRole(boardId)
    return role === 'guest' || role === 'observer' || role === 'viewer'
  }

  /** Verifica se o usuário pode editar (owner ou editor) */
  async function canEdit(boardId: string): Promise<boolean> {
    const role = await getMyRole(boardId)
    return role === 'owner' || role === 'editor'
  }

  return {
    orgUsers,
    loadingOrgUsers,
    fetchOrgUsers,
    getMyRole,
    isGuest,
    isObserver,
    isReadOnly,
    canEdit
  }
}
