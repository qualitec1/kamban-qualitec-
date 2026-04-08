import { ref } from '#imports'
import type { Database } from '#shared/types/database'
import { createClient } from '@supabase/supabase-js'

type SupabaseClient = ReturnType<typeof createClient<Database>>
type ActivityLog = Database['public']['Tables']['activity_logs']['Row']

export interface ActivityLogWithActor extends ActivityLog {
  actor: {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
  } | null
}

export function useTaskActivity(taskId: string) {
  function getClient(): SupabaseClient {
    if (import.meta.server) throw new Error('[useTaskActivity] SSR not supported')
    return useNuxtApp().$supabase as SupabaseClient
  }

  const activities = ref<ActivityLogWithActor[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchActivities() {
    loading.value = true
    error.value = null
    try {
      const supabase = getClient()
      const { data, error: fetchError } = await supabase
        .from('activity_logs')
        .select(`
          *,
          actor:actor_id (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('entity_type', 'task')
        .eq('entity_id', taskId)
        .order('created_at', { ascending: false })
        .limit(100)

      if (fetchError) throw fetchError

      activities.value = (data ?? []).map((item: any) => ({
        ...item,
        actor: item.actor || null
      })) as ActivityLogWithActor[]
    } catch (e: any) {
      error.value = e.message ?? 'Erro ao carregar histórico'
      activities.value = []
    } finally {
      loading.value = false
    }
  }

  function getActionLabel(action: string): string {
    const labels: Record<string, string> = {
      'task_created': 'criou a tarefa',
      'task_title_changed': 'alterou o título',
      'task_status_changed': 'alterou o status',
      'task_priority_changed': 'alterou a prioridade',
      'task_due_date_changed': 'alterou o prazo',
      'task_start_date_changed': 'alterou a data de início',
      'task_description_changed': 'alterou a descrição',
      'task_budget_changed': 'alterou o orçamento',
      'task_archived': 'arquivou a tarefa',
      'task_unarchived': 'desarquivou a tarefa',
      'task_deleted': 'excluiu a tarefa',
      'assignee_added': 'adicionou um responsável',
      'assignee_removed': 'removeu um responsável'
    }
    return labels[action] || action
  }

  function formatActivityMessage(activity: ActivityLogWithActor): string {
    const actorName = activity.actor?.full_name || activity.actor?.email || 'Usuário desconhecido'
    const action = getActionLabel(activity.action)
    const meta = activity.meta_json as any

    let message = `${actorName} ${action}`

    // Adicionar detalhes específicos
    if (activity.action === 'task_title_changed' && meta.old_value && meta.new_value) {
      message += ` de "${meta.old_value}" para "${meta.new_value}"`
    } else if (activity.action === 'assignee_added' && meta.user_name) {
      message += `: ${meta.user_name}`
    } else if (activity.action === 'assignee_removed' && meta.user_name) {
      message += `: ${meta.user_name}`
    } else if (activity.action === 'task_budget_changed' && meta.old_value !== undefined && meta.new_value !== undefined) {
      message += ` de R$ ${meta.old_value || '0,00'} para R$ ${meta.new_value || '0,00'}`
    }

    return message
  }

  function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diff < 60) return 'agora há pouco'
    if (diff < 3600) return `há ${Math.floor(diff / 60)}min`
    if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
    if (diff < 604800) return `há ${Math.floor(diff / 86400)}d`
    
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return {
    activities,
    loading,
    error,
    fetchActivities,
    getActionLabel,
    formatActivityMessage,
    formatRelativeTime
  }
}
