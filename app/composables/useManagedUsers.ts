import { ref, useNuxtApp } from '#imports'
import { createClient } from '@supabase/supabase-js'
import type { Database, Tables } from '#shared/types/database'

type SupabaseClient = ReturnType<typeof createClient<Database>>
type Profile = Tables<'profiles'>

export interface ManagedRelation {
  master_user_id: string
  managed_user_id: string
  created_at: string
}

export function useManagedUsers() {
  const members        = ref<Profile[]>([])
  const relations      = ref<ManagedRelation[]>([])
  const isLoading      = ref(false)
  const error          = ref<string | null>(null)

  function getClient(): SupabaseClient {
    return useNuxtApp().$supabase as SupabaseClient
  }

  async function fetchMembers(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const sb = getClient()
      const { data, error: err } = await sb
        .from('profiles')
        .select('id, full_name, email, avatar_url, role_global, status, job_title')
        .order('full_name')
      if (err) throw err
      members.value = (data ?? []) as Profile[]
    } catch (e: any) {
      error.value = e.message ?? 'Erro ao carregar membros'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchRelations(masterUserId: string): Promise<void> {
    const sb = getClient()
    const { data, error: err } = await sb
      .from('user_managed_users')
      .select('master_user_id, managed_user_id, created_at')
      .eq('master_user_id', masterUserId)
    if (err) throw err
    relations.value = (data ?? []) as ManagedRelation[]
  }

  async function addRelation(masterUserId: string, managedUserId: string): Promise<void> {
    const sb = getClient()
    const { error: err } = await sb
      .from('user_managed_users')
      .insert({ master_user_id: masterUserId, managed_user_id: managedUserId })
    if (err) throw err
    await fetchRelations(masterUserId)
  }

  async function removeRelation(masterUserId: string, managedUserId: string): Promise<void> {
    const sb = getClient()
    const { error: err } = await sb
      .from('user_managed_users')
      .delete()
      .eq('master_user_id', masterUserId)
      .eq('managed_user_id', managedUserId)
    if (err) throw err
    relations.value = relations.value.filter(r => r.managed_user_id !== managedUserId)
  }

  async function updateRole(userId: string, role: Database['public']['Enums']['user_role']): Promise<void> {
    const sb = getClient()
    const { error: err } = await sb
      .from('profiles')
      .update({ role_global: role })
      .eq('id', userId)
    if (err) throw err
    const idx = members.value.findIndex(m => m.id === userId)
    if (idx !== -1) members.value[idx] = { ...members.value[idx], role_global: role } as Profile
  }

  async function updateStatus(userId: string, status: Database['public']['Enums']['user_status']): Promise<void> {
    const sb = getClient()
    const { error: err } = await sb
      .from('profiles')
      .update({ status })
      .eq('id', userId)
    if (err) throw err
    const idx = members.value.findIndex(m => m.id === userId)
    if (idx !== -1) members.value[idx] = { ...members.value[idx], status } as Profile
  }

  async function updateJobTitle(userId: string, jobTitle: string): Promise<void> {
    const sb = getClient()
    const { error: err } = await sb
      .from('profiles')
      .update({ job_title: jobTitle || null })
      .eq('id', userId)
    if (err) throw err
    const idx = members.value.findIndex(m => m.id === userId)
    if (idx !== -1) members.value[idx] = { ...members.value[idx], job_title: jobTitle || null } as Profile
  }

  function getManagedIds(masterUserId: string): string[] {
    return relations.value
      .filter(r => r.master_user_id === masterUserId)
      .map(r => r.managed_user_id)
  }

  return {
    members,
    relations,
    isLoading,
    error,
    fetchMembers,
    fetchRelations,
    addRelation,
    removeRelation,
    getManagedIds,
    updateRole,
    updateStatus,
    updateJobTitle,
  }
}
