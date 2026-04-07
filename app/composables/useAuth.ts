import { useState, useNuxtApp, useRuntimeConfig, navigateTo, computed, readonly } from '#imports'
import { createClient } from '@supabase/supabase-js'
import type { AuthUser } from '#shared/types/auth'
import type { Database } from '#shared/types/database'

type SupabaseClient = ReturnType<typeof createClient<Database>>

export function useAuth() {
  const user      = useState<AuthUser | null>('auth:user',    () => null)
  const isLoading = useState<boolean>('auth:loading', () => false)

  const isAuthenticated = computed(() => user.value !== null)
  const isMaster        = computed(() => user.value?.role === 'master')
  const isCollaborator  = computed(() => user.value?.role === 'collaborator')

  function getClient(): SupabaseClient {
    if (import.meta.server) {
      throw new Error('[useAuth] Supabase client não disponível no SSR')
    }
    return useNuxtApp().$supabase as SupabaseClient
  }

  function edgeFnUrl(fn: string): string {
    const config = useRuntimeConfig()
    return `${config.public.supabaseUrl}/functions/v1/${fn}`
  }

  async function loadProfile(userId: string): Promise<void> {
    const sb = getClient()
    const { data, error } = await sb
      .from('profiles')
      .select('id, email, role_global, organization_id, full_name, avatar_url')
      .eq('id', userId)
      .single()

    if (error || !data) {
      user.value = null
      return
    }

    user.value = {
      id:             data.id,
      email:          data.email,
      role:           data.role_global,
      organizationId: data.organization_id,
      fullName:       data.full_name ?? undefined,
      avatarUrl:      data.avatar_url ?? undefined,
    }
  }

  async function initSession(): Promise<void> {
    if (import.meta.server) return
    const sb = getClient()
    const { data: { session } } = await sb.auth.getSession()
    if (session?.user) {
      await loadProfile(session.user.id)
    }
  }

  async function register(email: string, password: string, fullName: string): Promise<void> {
    isLoading.value = true
    try {
      const res = await fetch(edgeFnUrl('auth-register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName }),
      })
      const json = await res.json()
      if (!res.ok || res.status >= 400) {
        throw new Error(json.error ?? 'Erro ao criar conta')
      }
      // After register, sign in to get session
      await login(email, password)
    } finally {
      isLoading.value = false
    }
  }

  async function login(email: string, password: string): Promise<void> {
    isLoading.value = true
    try {
      const res = await fetch(edgeFnUrl('auth-login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error ?? 'Credenciais inválidas')
      }

      // Set session manually from tokens returned by edge function
      const sb = getClient()
      const { data, error } = await sb.auth.setSession({
        access_token: json.access_token,
        refresh_token: json.refresh_token,
      })
      if (error || !data.user) throw new Error('Credenciais inválidas')
      await loadProfile(data.user.id)
    } finally {
      isLoading.value = false
    }
  }

  async function logout(): Promise<void> {
    isLoading.value = true
    try {
      const sb = getClient()
      await sb.auth.signOut()
      user.value = null
      await navigateTo('/login')
    } finally {
      isLoading.value = false
    }
  }

  async function sendPasswordReset(email: string): Promise<void> {
    await fetch(edgeFnUrl('auth-recovery'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        redirect_to: `${window.location.origin}/reset-password`,
      }),
    })
    // Always resolves — never throws (silent lockout on server side)
  }

  async function updatePassword(newPassword: string): Promise<void> {
    const sb = getClient()
    const { error } = await sb.auth.updateUser({ password: newPassword })
    if (error) throw error
  }

  return {
    user:            readonly(user),
    isAuthenticated,
    isLoading:       readonly(isLoading),
    isMaster,
    isCollaborator,
    initSession,
    register,
    login,
    logout,
    sendPasswordReset,
    updatePassword,
  }
}
