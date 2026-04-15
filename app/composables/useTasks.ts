import { ref } from '#imports'
import type { Tables } from '#shared/types/database'

export type TaskRow = Pick<
  Tables<'tasks'>,
  'id' | 'title' | 'group_id' | 'board_id' | 'status_id' | 'priority_id' |
  'due_date' | 'start_date' | 'description' | 'notes' | 'budget' | 'updated_at' | 'position'
>

export function useTasks() {
  const supabase = useNuxtApp().$supabase as any

  async function createTask(params: {
    boardId: string
    groupId: string
    title: string
  }): Promise<TaskRow | null> {
    // Get max position in group
    const { data: existing } = await supabase
      .from('tasks')
      .select('position')
      .eq('group_id', params.groupId)
      .order('position', { ascending: false })
      .limit(1)

    const position = existing?.[0]?.position != null ? existing[0].position + 1 : 0

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: params.title.trim(),
        board_id: params.boardId,
        group_id: params.groupId,
        position,
      })
      .select('id, title, group_id, board_id, status_id, priority_id, due_date, start_date, description, budget, updated_at')
      .single()

    if (error) throw error
    return data as TaskRow
  }

  async function reorderTasks(params: {
    groupId: string
    taskIds: string[]
  }): Promise<boolean> {
    try {
      console.log('[useTasks] Calling /api/tasks/reorder with:', params)
      
      // Get Supabase client to access session
      const supabase = useNuxtApp().$supabase as any
      const { data: { session } } = await supabase.auth.getSession()
      
      console.log('[useTasks] Session check:', {
        hasSession: !!session,
        hasToken: !!session?.access_token,
        userId: session?.user?.id
      })
      
      if (!session?.access_token) {
        console.error('[useTasks] No access token found')
        alert('Erro: Sessão expirada. Faça login novamente.')
        return false
      }
      
      // Call server API to reorder tasks
      const response = await $fetch('/api/tasks/reorder', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: {
          group_id: params.groupId,
          task_ids: params.taskIds
        }
      })
      
      console.log('[useTasks] Reorder response:', response)
      return true
    } catch (error: any) {
      console.error('[useTasks] Error reordering tasks:', error)
      console.error('[useTasks] Error details:', {
        status: error?.statusCode,
        statusCode: error?.status,
        message: error?.message,
        data: error?.data,
        cause: error?.cause
      })
      
      // Show user-friendly error
      if (error?.statusCode === 401 || error?.status === 401) {
        alert('Erro: Sessão expirada. Faça login novamente.')
      } else if (error?.statusCode === 403 || error?.status === 403) {
        alert('Erro: Você não tem permissão para reordenar tarefas neste quadro.')
      } else {
        alert('Erro ao reordenar tarefas. Verifique o console para mais detalhes.')
      }
      
      return false
    }
  }

  async function moveTaskToGroup(params: {
    taskId: string
    sourceGroupId: string
    targetGroupId: string
  }): Promise<boolean> {
    try {
      console.log('Calling /api/tasks/move-to-group with:', params)
      
      // Get Supabase client to access session
      const supabase = useNuxtApp().$supabase as any
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        console.error('No access token found')
        return false
      }
      
      await $fetch('/api/tasks/move-to-group', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: {
          task_id: params.taskId,
          source_group_id: params.sourceGroupId,
          target_group_id: params.targetGroupId
        }
      })
      
      console.log('Move to group API call succeeded')
      return true
    } catch (error: any) {
      console.error('Error moving task to group:', error)
      console.error('Error details:', {
        status: error?.statusCode,
        message: error?.message,
        data: error?.data
      })
      return false
    }
  }

  async function deleteTask(taskId: string): Promise<boolean> {
    try {
      console.log('[useTasks] Deleting task:', taskId)
      
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) {
        console.error('[useTasks] Error deleting task:', error)
        throw error
      }

      console.log('[useTasks] Task deleted successfully')
      return true
    } catch (error: any) {
      console.error('[useTasks] Error deleting task:', error)
      return false
    }
  }

  return { createTask, reorderTasks, moveTaskToGroup, deleteTask }
}