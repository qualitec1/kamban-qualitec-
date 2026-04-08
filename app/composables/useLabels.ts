import { ref, computed } from 'vue'
import type { Database } from '#shared/types/database'

type Label = Database['public']['Tables']['labels']['Row']
type LabelInsert = Database['public']['Tables']['labels']['Insert']
type LabelUpdate = Database['public']['Tables']['labels']['Update']

export function useLabels(boardId: string) {
  const { $supabase } = useNuxtApp()
  const labels = ref<Label[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Cores padrão para labels (inspirado no Monday.com e Trello)
  const defaultColors = [
    '#ef4444', // red
    '#f97316', // orange
    '#f59e0b', // amber
    '#eab308', // yellow
    '#84cc16', // lime
    '#22c55e', // green
    '#10b981', // emerald
    '#14b8a6', // teal
    '#06b6d4', // cyan
    '#0ea5e9', // sky
    '#3b82f6', // blue
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#a855f7', // purple
    '#d946ef', // fuchsia
    '#ec4899', // pink
    '#f43f5e', // rose
    '#64748b', // slate
  ]

  const sortedLabels = computed(() => {
    return [...labels.value].sort((a, b) => a.name.localeCompare(b.name))
  })

  async function fetchLabels(): Promise<void> {
    if (!boardId) return
    
    isLoading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await $supabase
        .from('labels')
        .select('*')
        .eq('board_id', boardId)
        .order('name')

      if (fetchError) throw fetchError
      labels.value = data || []
    } catch (e: any) {
      error.value = e.message
      console.error('[useLabels] Erro ao buscar labels:', e)
    } finally {
      isLoading.value = false
    }
  }

  async function createLabel(name: string, color: string): Promise<Label | null> {
    if (!boardId || !name.trim()) return null

    // Validação de segurança
    const trimmedName = name.trim()
    
    // Validar tamanho do nome
    if (trimmedName.length > 50) {
      error.value = 'Nome da etiqueta não pode ter mais de 50 caracteres'
      return null
    }

    // Prevenir caracteres perigosos (XSS)
    const dangerousChars = /<|>|&|"|'|`/
    if (dangerousChars.test(trimmedName)) {
      error.value = 'Nome da etiqueta contém caracteres inválidos'
      return null
    }

    // Validar formato de cor hexadecimal
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/
    const normalizedColor = color.toLowerCase()
    if (!hexColorRegex.test(normalizedColor)) {
      error.value = 'Cor inválida. Use o formato #RRGGBB'
      return null
    }

    isLoading.value = true
    error.value = null

    try {
      const newLabel: LabelInsert = {
        board_id: boardId,
        name: trimmedName,
        color: normalizedColor,
      }

      const { data, error: createError } = await $supabase
        .from('labels')
        .insert(newLabel)
        .select()
        .single()

      if (createError) throw createError
      
      if (data) {
        labels.value.push(data)
      }

      return data
    } catch (e: any) {
      error.value = e.message
      console.error('[useLabels] Erro ao criar label:', e)
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function updateLabel(labelId: string, name?: string, color?: string): Promise<boolean> {
    if (!labelId) return false

    const updates: LabelUpdate = {}

    // Validação de segurança para nome
    if (name !== undefined) {
      const trimmedName = name.trim()
      
      if (trimmedName.length === 0) {
        error.value = 'Nome da etiqueta não pode ser vazio'
        return false
      }

      if (trimmedName.length > 50) {
        error.value = 'Nome da etiqueta não pode ter mais de 50 caracteres'
        return false
      }

      const dangerousChars = /<|>|&|"|'|`/
      if (dangerousChars.test(trimmedName)) {
        error.value = 'Nome da etiqueta contém caracteres inválidos'
        return false
      }

      updates.name = trimmedName
    }

    // Validação de segurança para cor
    if (color !== undefined) {
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/
      const normalizedColor = color.toLowerCase()
      
      if (!hexColorRegex.test(normalizedColor)) {
        error.value = 'Cor inválida. Use o formato #RRGGBB'
        return false
      }

      updates.color = normalizedColor
    }

    isLoading.value = true
    error.value = null

    try {
      const { data, error: updateError } = await $supabase
        .from('labels')
        .update(updates)
        .eq('id', labelId)
        .select()
        .single()

      if (updateError) throw updateError

      if (data) {
        const index = labels.value.findIndex(l => l.id === labelId)
        if (index !== -1) {
          labels.value[index] = data
        }
      }

      return true
    } catch (e: any) {
      error.value = e.message
      console.error('[useLabels] Erro ao atualizar label:', e)
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function deleteLabel(labelId: string): Promise<boolean> {
    if (!labelId) return false

    isLoading.value = true
    error.value = null

    try {
      const { error: deleteError } = await $supabase
        .from('labels')
        .delete()
        .eq('id', labelId)

      if (deleteError) throw deleteError

      labels.value = labels.value.filter(l => l.id !== labelId)
      return true
    } catch (e: any) {
      error.value = e.message
      console.error('[useLabels] Erro ao deletar label:', e)
      return false
    } finally {
      isLoading.value = false
    }
  }

  return {
    labels: readonly(labels),
    sortedLabels,
    isLoading: readonly(isLoading),
    error: readonly(error),
    defaultColors,
    fetchLabels,
    createLabel,
    updateLabel,
    deleteLabel,
  }
}
