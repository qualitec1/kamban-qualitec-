import { ref, computed } from '#imports'
import type { Database } from '#shared/types/database'
import { createClient } from '@supabase/supabase-js'

type SupabaseClient = ReturnType<typeof createClient<Database>>
type AccessRole = Database['public']['Enums']['board_access_role']

export function useBoardPermissions(boardId: string) {
  function getClient(): SupabaseClient {
    if (import.meta.server) throw new Error('[useBoardPermissions] SSR not supported')
    return useNuxtApp().$supabase as SupabaseClient
  }

  const userRole = ref<AccessRole | null>(null)
  const loading = ref(false)

  const canEdit = computed(() => {
    return userRole.value === 'owner' || userRole.value === 'editor'
  })

  const canView = computed(() => {
    return userRole.value !== null
  })

  const isOwner = computed(() => {
    return userRole.value === 'owner'
  })

  const isEditor = computed(() => {
    return userRole.value === 'editor'
  })

  const isViewer = computed(() => {
    return userRole.value === 'viewer'
  })

  const isGuest = computed(() => {
    return userRole.value === 'guest'
  })

  async function fetchUserRole() {
    loading.value = true
    try {
      const supabase = getClient()
      const { data } = await supabase
        .from('board_members')
        .select('access_role')
        .eq('board_id', boardId)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id ?? '')
        .single()

      userRole.value = data?.access_role ?? null
    } catch {
      userRole.value = null
    } finally {
      loading.value = false
    }
  }

  return {
    userRole,
    loading,
    canEdit,
    canView,
    isOwner,
    isEditor,
    isViewer,
    isGuest,
    fetchUserRole
  }
}
