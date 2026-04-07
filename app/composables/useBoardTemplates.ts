import { ref } from '#imports'
import type { Database, Tables } from '#shared/types/database'
import { createClient } from '@supabase/supabase-js'

type SupabaseClient = ReturnType<typeof createClient<Database>>
type BoardTemplate = Tables<'board_templates'>
type BoardType = Database['public']['Enums']['board_type']

interface TemplateStructure {
  columns: Array<{
    type: string
    label: string
    settings_json?: Record<string, any>
    sort_order: number
  }>
  groups: Array<{
    name: string
    color?: string
    sort_order: number
  }>
}

export function useBoardTemplates() {
  function getClient(): SupabaseClient {
    if (import.meta.server) throw new Error('[useBoardTemplates] SSR not supported')
    return useNuxtApp().$supabase as SupabaseClient
  }

  const templates = ref<BoardTemplate[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** Busca todos os templates disponíveis (públicos + próprios) */
  async function fetchTemplates() {
    loading.value = true
    error.value = null

    try {
      const supabase = getClient()
      const { data, error: fetchError } = await supabase
        .from('board_templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      templates.value = data || []
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  /** Salva um board existente como template */
  async function saveAsTemplate(params: {
    boardId: string
    name: string
    description?: string
    isPublic?: boolean
  }): Promise<boolean> {
    try {
      const supabase = getClient()

      // 1. Buscar estrutura do board (columns + groups)
      const [columnsRes, groupsRes, boardRes] = await Promise.all([
        supabase.from('board_columns').select('*').eq('board_id', params.boardId).order('sort_order'),
        supabase.from('task_groups').select('id, name, color, sort_order').eq('board_id', params.boardId).order('sort_order'),
        supabase.from('boards').select('board_type, cover_color, organization_id').eq('id', params.boardId).single() as any
      ])

      if (columnsRes.error) throw columnsRes.error
      if (groupsRes.error) throw groupsRes.error
      if (boardRes.error) throw boardRes.error

      const structure: TemplateStructure = {
        columns: (columnsRes.data || []).map(c => ({
          type: c.type,
          label: c.label,
          settings_json: c.settings_json as Record<string, any> | undefined,
          sort_order: c.sort_order
        })),
        groups: (groupsRes.data || []).map(g => ({
          name: g.name,
          color: g.color ?? undefined,
          sort_order: g.sort_order
        }))
      }

      // 2. Criar template
      const { error: insertError } = await supabase.from('board_templates').insert({
        organization_id: boardRes.data.organization_id,
        name: params.name,
        description: params.description,
        board_type: boardRes.data.board_type,
        cover_color: boardRes.data.cover_color,
        structure_json: structure as any,
        is_public: params.isPublic ?? false
      })

      if (insertError) throw insertError

      await fetchTemplates()
      return true
    } catch (e: any) {
      error.value = e.message
      return false
    }
  }

  /** Cria um novo board a partir de um template */
  async function createFromTemplate(params: {
    templateId: string
    name: string
    description?: string
    workspaceId: string
    visibility?: Database['public']['Enums']['visibility_type']
  }): Promise<string | null> {
    try {
      const supabase = getClient()

      // 1. Buscar template
      const { data: template, error: templateError } = await supabase
        .from('board_templates')
        .select('*')
        .eq('id', params.templateId)
        .single()

      if (templateError) throw templateError

      const structure = template.structure_json as unknown as TemplateStructure

      // 2. Criar board
      const { data: newBoard, error: boardError } = await supabase
        .from('boards')
        .insert({
          workspace_id: params.workspaceId,
          name: params.name,
          description: params.description,
          board_type: template.board_type,
          cover_color: template.cover_color,
          visibility: params.visibility ?? 'org'
        })
        .select()
        .single()

      if (boardError) throw boardError

      // 3. Criar colunas
      if (structure.columns && structure.columns.length > 0) {
        const { error: columnsError } = await supabase.from('board_columns').insert(
          structure.columns.map(c => ({
            board_id: newBoard.id,
            type: c.type as any,
            label: c.label,
            settings_json: c.settings_json as any,
            sort_order: c.sort_order
          }))
        )
        if (columnsError) throw columnsError
      }

      // 4. Criar grupos (ou grupo padrão se template não tiver)
      if (structure.groups && structure.groups.length > 0) {
        const { error: groupsError } = await supabase.from('task_groups').insert(
          structure.groups.map(g => ({
            board_id: newBoard.id,
            name: g.name,
            color: g.color,
            sort_order: g.sort_order
          }))
        )
        if (groupsError) throw groupsError
      } else {
        // Template sem grupos — garantir grupo padrão
        await supabase.from('task_groups').insert({
          board_id: newBoard.id,
          name: 'Tarefas',
          color: '#6366f1',
          sort_order: 0,
          is_collapsed: false
        })
      }

      return newBoard.id
    } catch (e: any) {
      error.value = e.message
      return null
    }
  }

  /** Deleta um template */
  async function deleteTemplate(templateId: string): Promise<boolean> {
    try {
      const supabase = getClient()
      const { error: deleteError } = await supabase
        .from('board_templates')
        .delete()
        .eq('id', templateId)

      if (deleteError) throw deleteError

      const remaining: typeof templates.value = []
      for (const t of templates.value) {
        if (t.id !== templateId) remaining.push(t)
      }
      templates.value = remaining
      return true
    } catch (e: any) {
      error.value = e.message
      return false
    }
  }

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    saveAsTemplate,
    createFromTemplate,
    deleteTemplate
  }
}
