import { ref } from '#imports'
import type { Database, Tables } from '#shared/types/database'
import { createClient } from '@supabase/supabase-js'

type SupabaseClient = ReturnType<typeof createClient<Database>>
type BoardCollection = Tables<'board_collections'>
type Board = Tables<'boards'>

export interface CollectionWithBoards extends BoardCollection {
  boards: Board[]
}

export function useBoardCollections() {
  function getClient(): SupabaseClient {
    if (import.meta.server) throw new Error('[useBoardCollections] SSR not supported')
    return useNuxtApp().$supabase as SupabaseClient
  }

  const collections = ref<CollectionWithBoards[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** Busca todas as coleções com seus boards associados */
  async function fetchCollections() {
    loading.value = true
    error.value = null
    try {
      const supabase = getClient()

      const { data, error: fetchError } = await supabase
        .from('board_collections')
        .select(`
          id, organization_id, name, description, color, created_by, created_at, updated_at,
          board_collection_items (
            sort_order,
            boards (
              id, name, description, board_type, visibility, cover_color, workspace_id, created_at, created_by
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      collections.value = (data || []).map(c => ({
        id: c.id,
        organization_id: c.organization_id,
        name: c.name,
        description: c.description,
        color: c.color,
        created_by: c.created_by,
        created_at: c.created_at,
        updated_at: c.updated_at,
        boards: (c.board_collection_items || [])
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((item: any) => item.boards)
          .filter(Boolean)
      }))
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  /** Cria uma nova coleção */
  async function createCollection(params: {
    name: string
    description?: string
    color?: string
  }): Promise<string | null> {
    try {
      const supabase = getClient()
      const orgId = (await supabase.from('profiles').select('organization_id').eq('id', (await supabase.auth.getUser()).data.user?.id ?? '').single()).data?.organization_id
      if (!orgId) throw new Error('Organização não encontrada')

      const { data, error: insertError } = await supabase
        .from('board_collections')
        .insert({ name: params.name, description: params.description, color: params.color, organization_id: orgId })
        .select()
        .single()

      if (insertError) throw insertError
      await fetchCollections()
      return data.id
    } catch (e: any) {
      error.value = e.message
      return null
    }
  }

  /** Atualiza nome/descrição/cor de uma coleção */
  async function updateCollection(id: string, params: { name?: string; description?: string; color?: string }): Promise<boolean> {
    try {
      const supabase = getClient()
      const { error: updateError } = await supabase
        .from('board_collections')
        .update(params)
        .eq('id', id)

      if (updateError) throw updateError

      const idx = collections.value.findIndex(c => c.id === id)
      if (idx !== -1) Object.assign(collections.value[idx]!, params)
      return true
    } catch (e: any) {
      error.value = e.message
      return false
    }
  }

  /** Remove uma coleção (boards não são deletados) */
  async function deleteCollection(id: string): Promise<boolean> {
    try {
      const supabase = getClient()
      const { error: deleteError } = await supabase
        .from('board_collections')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
      collections.value = collections.value.filter(c => c.id !== id)
      return true
    } catch (e: any) {
      error.value = e.message
      return false
    }
  }

  /** Adiciona um board a uma coleção */
  async function addBoard(collectionId: string, boardId: string): Promise<boolean> {
    try {
      const supabase = getClient()
      const col = collections.value.find(c => c.id === collectionId)
      const sortOrder = col ? col.boards.length : 0

      const { error: insertError } = await supabase
        .from('board_collection_items')
        .insert({ collection_id: collectionId, board_id: boardId, sort_order: sortOrder })

      if (insertError) throw insertError
      await fetchCollections()
      return true
    } catch (e: any) {
      error.value = e.message
      return false
    }
  }

  /** Remove um board de uma coleção */
  async function removeBoard(collectionId: string, boardId: string): Promise<boolean> {
    try {
      const supabase = getClient()
      const { error: deleteError } = await supabase
        .from('board_collection_items')
        .delete()
        .eq('collection_id', collectionId)
        .eq('board_id', boardId)

      if (deleteError) throw deleteError

      const col = collections.value.find(c => c.id === collectionId)
      if (col) col.boards = col.boards.filter(b => b.id !== boardId)
      return true
    } catch (e: any) {
      error.value = e.message
      return false
    }
  }

  return {
    collections,
    loading,
    error,
    fetchCollections,
    createCollection,
    updateCollection,
    deleteCollection,
    addBoard,
    removeBoard
  }
}
