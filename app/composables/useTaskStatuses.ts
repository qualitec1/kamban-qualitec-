import { ref } from '#imports'
import type { Tables } from '#shared/types/database'

export type TaskStatus = Tables<'task_statuses'>

// Cache global compartilhado entre todas as instâncias
const statusesCache = new Map<string, {
  data: TaskStatus[]
  timestamp: number
  loading: Promise<void> | null
}>()

const CACHE_TTL = 60000 // 1 minuto

export function useTaskStatuses(boardId: string) {
  const supabase = useNuxtApp().$supabase as any

  const statuses = ref<TaskStatus[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Carregar do cache imediatamente se disponível
  const cached = statusesCache.get(boardId)
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    statuses.value = cached.data
  }

  async function fetchStatuses() {
    // Verificar cache primeiro
    const cached = statusesCache.get(boardId)
    if (cached) {
      const age = Date.now() - cached.timestamp
      if (age < CACHE_TTL) {
        // Cache válido
        statuses.value = cached.data
        return
      }
      
      // Se já está carregando, aguardar
      if (cached.loading) {
        await cached.loading
        statuses.value = statusesCache.get(boardId)?.data ?? []
        return
      }
    }
    
    // Criar promise de loading para evitar requisições duplicadas
    let resolveLoading: () => void
    const loadingPromise = new Promise<void>((resolve) => {
      resolveLoading = resolve
    })
    
    statusesCache.set(boardId, {
      data: cached?.data ?? [],
      timestamp: cached?.timestamp ?? 0,
      loading: loadingPromise
    })
    
    loading.value = true
    error.value = null
    try {
      const { data, error: fetchError } = await supabase
        .from('task_statuses')
        .select('id, board_id, name, color, sort_order')
        .eq('board_id', boardId)
        .order('sort_order', { ascending: true })

      if (fetchError) throw fetchError
      
      statuses.value = data ?? []
      
      // Atualizar cache
      statusesCache.set(boardId, {
        data: data ?? [],
        timestamp: Date.now(),
        loading: null
      })
    } catch (e: any) {
      error.value = e.message ?? 'Unknown error'
      statuses.value = []
    } finally {
      loading.value = false
      resolveLoading!()
    }
  }

  async function updateTaskStatus(taskId: string, statusId: string | null) {
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ status_id: statusId })
      .eq('id', taskId)
    if (updateError) throw updateError
  }

  async function createStatus(name: string, color: string) {
    if (!name.trim()) {
      error.value = 'Nome do status não pode ser vazio'
      return null
    }

    loading.value = true
    error.value = null

    try {
      const maxSortOrder = statuses.value.length > 0
        ? Math.max(...statuses.value.map(s => s.sort_order || 0))
        : 0

      const { data, error: createError } = await supabase
        .from('task_statuses')
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
        statuses.value.push(data)
        // Invalidar cache
        statusesCache.delete(boardId)
      }

      return data
    } catch (e: any) {
      error.value = e.message ?? 'Erro ao criar status'
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateStatus(statusId: string, name: string, color: string) {
    if (!name.trim()) {
      error.value = 'Nome do status não pode ser vazio'
      return false
    }

    loading.value = true
    error.value = null

    try {
      const { data, error: updateError } = await supabase
        .from('task_statuses')
        .update({
          name: name.trim(),
          color: color.toLowerCase(),
        })
        .eq('id', statusId)
        .select()
        .single()

      if (updateError) throw updateError

      if (data) {
        const index = statuses.value.findIndex(s => s.id === statusId)
        if (index !== -1) {
          statuses.value[index] = data
        }
        // Invalidar cache
        statusesCache.delete(boardId)
      }

      return true
    } catch (e: any) {
      error.value = e.message ?? 'Erro ao atualizar status'
      return false
    } finally {
      loading.value = false
    }
  }

  async function reorderStatuses(statusIds: string[]) {
    loading.value = true
    error.value = null

    try {
      // Atualizar sort_order para cada status
      for (let i = 0; i < statusIds.length; i++) {
        const { error: updateError } = await supabase
          .from('task_statuses')
          .update({ sort_order: i })
          .eq('id', statusIds[i])

        if (updateError) throw updateError
      }

      // Invalidar cache e recarregar
      statusesCache.delete(boardId)
      await fetchStatuses()
      return true
    } catch (e: any) {
      error.value = e.message ?? 'Erro ao reordenar status'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    statuses,
    loading,
    error,
    fetchStatuses,
    updateTaskStatus,
    createStatus,
    updateStatus,
    reorderStatuses,
  }
}

// Exportar cache para acesso externo
export { statusesCache }
