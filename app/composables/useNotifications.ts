import { ref } from '#imports'
import type { Database } from '#shared/types/database'
import { createClient } from '@supabase/supabase-js'

type SupabaseClient = ReturnType<typeof createClient<Database>>
type Notification = Database['public']['Tables']['notifications']['Row']

export interface NotificationWithProfile extends Notification {
  // Adicionar campos extras se necessário
}

export function useNotifications() {
  function getClient(): SupabaseClient {
    if (import.meta.server) throw new Error('[useNotifications] SSR not supported')
    return useNuxtApp().$supabase as SupabaseClient
  }

  const notifications = ref<NotificationWithProfile[]>([])
  const unreadCount = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchNotifications() {
    loading.value = true
    error.value = null
    try {
      const supabase = getClient()
      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (fetchError) throw fetchError

      notifications.value = (data ?? []) as NotificationWithProfile[]
      unreadCount.value = notifications.value.filter(n => !n.read_at).length
    } catch (e: any) {
      error.value = e.message ?? 'Erro ao carregar notificações'
      notifications.value = []
    } finally {
      loading.value = false
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      const supabase = getClient()
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)

      if (updateError) throw updateError

      // Atualizar localmente
      const notification = notifications.value.find(n => n.id === notificationId)
      if (notification) {
        notification.read_at = new Date().toISOString()
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
    } catch (e: any) {
      error.value = e.message ?? 'Erro ao marcar como lida'
    }
  }

  async function markAllAsRead() {
    try {
      const supabase = getClient()
      const unreadIds = notifications.value
        .filter(n => !n.read_at)
        .map(n => n.id)

      if (unreadIds.length === 0) return

      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadIds)

      if (updateError) throw updateError

      // Atualizar localmente
      notifications.value.forEach(n => {
        if (!n.read_at) {
          n.read_at = new Date().toISOString()
        }
      })
      unreadCount.value = 0
    } catch (e: any) {
      error.value = e.message ?? 'Erro ao marcar todas como lidas'
    }
  }

  async function deleteNotification(notificationId: string) {
    try {
      const supabase = getClient()
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (deleteError) throw deleteError

      // Remover localmente
      const index = notifications.value.findIndex(n => n.id === notificationId)
      if (index !== -1) {
        const wasUnread = !notifications.value[index].read_at
        notifications.value.splice(index, 1)
        if (wasUnread) {
          unreadCount.value = Math.max(0, unreadCount.value - 1)
        }
      }
    } catch (e: any) {
      error.value = e.message ?? 'Erro ao deletar notificação'
    }
  }

  // Subscrever a mudanças em tempo real
  async function subscribeToNotifications() {
    const supabase = getClient()
    const user = await supabase.auth.getUser()
    const userId = user.data.user?.id
    
    if (!userId) return () => {}
    
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          notifications.value.unshift(payload.new as NotificationWithProfile)
          unreadCount.value++
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    subscribeToNotifications
  }
}
