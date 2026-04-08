import { ref, useState } from '#imports'
import type { Database, Tables } from '#shared/types/database'
import { createClient } from '@supabase/supabase-js'
import type { AuthUser } from '#shared/types/auth'

type SupabaseClient = ReturnType<typeof createClient<Database>>
type BoardMember = Tables<'board_members'>
type AccessRole = Database['public']['Enums']['board_access_role']

export interface BoardMemberWithProfile extends BoardMember {
  profile: {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
    role_global: Database['public']['Enums']['user_role']
  }
}

export function useBoardMembers() {
  function getClient(): SupabaseClient {
    if (import.meta.server) throw new Error('[useBoardMembers] SSR not supported')
    return useNuxtApp().$supabase as SupabaseClient
  }

  const authUser = useState<AuthUser | null>('auth:user', () => null)

  const members = ref<BoardMemberWithProfile[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchMembers(boardId: string) {
    loading.value = true
    error.value = null

    try {
      const supabase = getClient()
      const { data, error: fetchError } = await supabase
        .from('board_members')
        .select(`
          board_id,
          user_id,
          access_role,
          profiles:user_id (
            id, full_name, email, avatar_url, role_global
          )
        `)
        .eq('board_id', boardId)

      if (fetchError) throw fetchError

      members.value = (data || []).map(item => ({
        board_id: item.board_id,
        user_id: item.user_id,
        access_role: item.access_role,
        profile: item.profiles as any
      }))
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function addMember(boardId: string, userId: string, role: AccessRole = 'viewer') {
    try {
      const supabase = getClient()
      const { error: insertError } = await supabase
        .from('board_members')
        .insert({ board_id: boardId, user_id: userId, access_role: role })

      if (insertError) throw insertError

      await fetchMembers(boardId)
      return true
    } catch (e: any) {
      error.value = e.message
      return false
    }
  }

  async function updateRole(boardId: string, userId: string, role: AccessRole) {
    try {
      const supabase = getClient()
      const { error: updateError } = await supabase
        .from('board_members')
        .update({ access_role: role })
        .eq('board_id', boardId)
        .eq('user_id', userId)

      if (updateError) throw updateError

      const idx = members.value.findIndex(m => m.user_id === userId)
      if (idx !== -1 && members.value[idx]) {
        members.value[idx].access_role = role
      }
      return true
    } catch (e: any) {
      error.value = e.message
      return false
    }
  }

  async function removeMember(boardId: string, userId: string) {
    try {
      const supabase = getClient()
      const { error: deleteError } = await supabase
        .from('board_members')
        .delete()
        .eq('board_id', boardId)
        .eq('user_id', userId)

      if (deleteError) throw deleteError

      members.value = members.value.filter(m => m.user_id !== userId)
      return true
    } catch (e: any) {
      error.value = e.message
      return false
    }
  }

  async function isMember(boardId: string, userId?: string): Promise<boolean> {
    const uid = userId || authUser.value?.id
    if (!uid) return false

    try {
      const supabase = getClient()
      const { data } = await supabase
        .from('board_members')
        .select('user_id')
        .eq('board_id', boardId)
        .eq('user_id', uid)
        .single()

      return !!data
    } catch {
      return false
    }
  }

  async function getUserRole(boardId: string, userId?: string): Promise<AccessRole | null> {
    const uid = userId || authUser.value?.id
    if (!uid) return null

    try {
      const supabase = getClient()
      const { data } = await supabase
        .from('board_members')
        .select('access_role')
        .eq('board_id', boardId)
        .eq('user_id', uid)
        .single()

      return data?.access_role ?? null
    } catch {
      return null
    }
  }

  function canEdit(role: AccessRole | null): boolean {
    return role === 'owner' || role === 'editor'
  }

  return {
    members,
    loading,
    error,
    fetchMembers,
    addMember,
    updateRole,
    removeMember,
    isMember,
    getUserRole,
    canEdit
  }
}
