import { ref } from '#imports'
import type { Tables } from '#shared/types/database'

export type TaskPriority = Tables<'task_priorities'>

export function useTaskPriorities(boardId: string) {
  const supabase = useNuxtApp().$supabase as any

  const priorities = ref<TaskPriority[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchPriorities() {
    loading.value = true
    error.value = null
    try {
      const { data, error: fetchError } = await supabase
        .from('task_priorities')
        .select('id, board_id, name, color, sort_order')
        .eq('board_id', boardId)
        .order('sort_order', { ascending: true })

      if (fetchError) throw fetchError
      priorities.value = data ?? []
    } catch (e: any) {
      error.value = e.message ?? 'Unknown error'
      priorities.value = []
    } finally {
      loading.value = false
    }
  }

  async function updateTaskPriority(taskId: string, priorityId: string | null) {
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ priority_id: priorityId })
      .eq('id', taskId)
    if (updateError) throw updateError
  }

  async function createPriority(name: string, color: string) {
    if (!name.trim()) {
      error.value = 'Nome da prioridade não pode ser vazio'
      return null
    }

    loading.value = true
    error.value = null

    try {
      const maxSortOrder = priorities.value.length > 0
        ? Math.max(...priorities.value.map(p => p.sort_order || 0))
        : 0

      const { data, error: createError } = await supabase
        .from('task_priorities')
        .insert({
          board_id: boardId,
          name: name.trim(),
          color: color.toLowerCase(),
          sort_order: maxSortOrder + 1,
        })
        .select()
        .single()

      if (createError) throw createError

      if (data) {
        priorities.value.push(data)
      }

      return data
    } catch (e: any) {
      error.value = e.message ?? 'Erro ao criar prioridade'
      return null
    } finally {
      loading.value = false
    }
  }

  async function updatePriority(priorityId: string, name: string, color: string) {
    if (!name.trim()) {
      error.value = 'Nome da prioridade não pode ser vazio'
      return false
    }

    loading.value = true
    error.value = null

    try {
      const { data, error: updateError } = await supabase
        .from('task_priorities')
        .update({
          name: name.trim(),
          color: color.toLowerCase(),
        })
        .eq('id', priorityId)
        .select()
        .single()

      if (updateError) throw updateError

      if (data) {
        const index = priorities.value.findIndex(p => p.id === priorityId)
        if (index !== -1) {
          priorities.value[index] = data
        }
      }

      return true
    } catch (e: any) {
      error.value = e.message ?? 'Erro ao atualizar prioridade'
      return false
    } finally {
      loading.value = false
    }
  }

  async function reorderPriorities(priorityIds: string[]) {
    loading.value = true
    error.value = null

    try {
      // Atualizar sort_order para cada prioridade
      for (let i = 0; i < priorityIds.length; i++) {
        const { error: updateError } = await supabase
          .from('task_priorities')
          .update({ sort_order: i })
          .eq('id', priorityIds[i])

        if (updateError) throw updateError
      }

      // Recarregar prioridades
      await fetchPriorities()
      return true
    } catch (e: any) {
      error.value = e.message ?? 'Erro ao reordenar prioridades'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    priorities,
    loading,
    error,
    fetchPriorities,
    updateTaskPriority,
    createPriority,
    updatePriority,
    reorderPriorities,
  }
}
