import { ref } from '#imports'
import type { Database, Tables } from '#shared/types/database'
import { createClient } from '@supabase/supabase-js'

type SupabaseClient = ReturnType<typeof createClient<Database>>
type TaskGroup = Tables<'task_groups'>

export function useTaskGroups() {
  function getClient(): SupabaseClient {
    if (import.meta.server) throw new Error('[useTaskGroups] SSR not supported')
    return useNuxtApp().$supabase as SupabaseClient
  }

  const groups = ref<TaskGroup[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** Busca todos os grupos de um board, ordenados por sort_order */
  async function fetchGroups(boardId: string) {
    loading.value = true
    error.value = null
    try {
      const supabase = getClient()
      const { data, error: fetchError } = await supabase
        .from('task_groups')
        .select('*')
        .eq('board_id', boardId)
        .order('sort_order', { ascending: true })

      if (fetchError) throw fetchError
      groups.value = data || []
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  /**
   * Adiciona um novo grupo em uma posição específica.
   * position: 'after' insere abaixo do grupo de referência (ou no final se nenhum)
   * position: 'before' insere acima do grupo de referência
   * refGroupId: id do grupo de referência (opcional — se omitido, insere no final)
   */
  async function addGroup(params: {
    boardId: string
    name: string
    color?: string
    position?: 'before' | 'after'
    refGroupId?: string
  }): Promise<TaskGroup | null> {
    try {
      const supabase = getClient()

      let targetSortOrder = groups.value.length // padrão: final da lista

      if (params.refGroupId) {
        const refIdx = groups.value.findIndex(g => g.id === params.refGroupId)
        if (refIdx !== -1) {
          const refGroup = groups.value[refIdx]!
          targetSortOrder = params.position === 'before'
            ? refGroup.sort_order
            : refGroup.sort_order + 1
        }
      }

      // Abrir espaço: incrementar sort_order de todos os grupos >= targetSortOrder
      const toShift = groups.value.filter(g => g.sort_order >= targetSortOrder)
      if (toShift.length > 0) {
        await Promise.all(
          toShift.map(g =>
            supabase
              .from('task_groups')
              .update({ sort_order: g.sort_order + 1 })
              .eq('id', g.id)
          )
        )
      }

      // Inserir novo grupo
      const { data, error: insertError } = await supabase
        .from('task_groups')
        .insert({
          board_id: params.boardId,
          name: params.name.trim(),
          color: params.color ?? '#6366f1',
          sort_order: targetSortOrder,
          is_collapsed: false
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Recarregar lista para refletir nova ordem
      await fetchGroups(params.boardId)
      return data
    } catch (e: any) {
      error.value = e.message
      return null
    }
  }

  /** Renomeia um grupo */
  async function renameGroup(groupId: string, name: string): Promise<boolean> {
    try {
      const supabase = getClient()
      const { error: updateError } = await supabase
        .from('task_groups')
        .update({ name: name.trim() })
        .eq('id', groupId)

      if (updateError) throw updateError

      const idx = groups.value.findIndex(g => g.id === groupId)
      if (idx !== -1) groups.value[idx]!.name = name.trim()
      return true
    } catch (e: any) {
      error.value = e.message
      return false
    }
  }

  /** Remove um grupo */
  async function deleteGroup(groupId: string, boardId: string): Promise<boolean> {
    try {
      const supabase = getClient()
      const { error: deleteError } = await supabase
        .from('task_groups')
        .delete()
        .eq('id', groupId)

      if (deleteError) throw deleteError

      groups.value = groups.value.filter(g => g.id !== groupId)
      // Renormalizar sort_order localmente
      groups.value.forEach((g, i) => { g.sort_order = i })
      return true
    } catch (e: any) {
      error.value = e.message
      return false
    }
  }

  /** Alterna colapso de um grupo */
  async function toggleCollapse(groupId: string): Promise<void> {
    const idx = groups.value.findIndex(g => g.id === groupId)
    if (idx === -1) return

    const newVal = !groups.value[idx]!.is_collapsed
    groups.value[idx]!.is_collapsed = newVal

    const supabase = getClient()
    await supabase
      .from('task_groups')
      .update({ is_collapsed: newVal })
      .eq('id', groupId)
  }

  /** Reordena grupos — persiste os novos sort_order no banco */
  async function reorderGroups(boardId: string, orderedIds: string[]): Promise<void> {
    // Atualizar localmente primeiro (otimista)
    const reordered = orderedIds
      .map((id, idx) => {
        const g = groups.value.find(g => g.id === id)
        return g ? { ...g, sort_order: idx } : null
      })
      .filter(Boolean) as typeof groups.value
    groups.value = reordered

    // Persistir no banco
    const supabase = getClient()
    await Promise.all(
      orderedIds.map((id, idx) =>
        supabase.from('task_groups').update({ sort_order: idx }).eq('id', id)
      )
    )
  }

  return {
    groups,
    loading,
    error,
    fetchGroups,
    addGroup,
    renameGroup,
    deleteGroup,
    toggleCollapse,
    reorderGroups
  }
}
