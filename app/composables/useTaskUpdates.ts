import { ref } from 'vue'

export interface TaskUpdate {
  id: string
  task_id: string
  author_id: string | null
  content: string
  parent_id: string | null
  created_at: string
  updated_at: string
  edited_at: string | null
  
  // Relações (via join)
  author?: {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
  }
  reply_count?: number
  like_count?: number
  is_liked_by_me?: boolean
  is_read_by_me?: boolean
}

export function useTaskUpdates(taskId: string) {
  const supabase = useNuxtApp().$supabase as any
  const { user } = useAuth()
  
  const updates = ref<TaskUpdate[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const hasMore = ref(true)
  const page = ref(0)
  const pageSize = 20

  /**
   * Buscar atualizações da tarefa
   */
  async function fetchUpdates(reset = false) {
    if (loading.value) return
    if (!reset && !hasMore.value) return
    
    if (!taskId) {
      console.error('[useTaskUpdates] taskId is required')
      error.value = 'ID da tarefa não fornecido'
      return
    }

    try {
      loading.value = true
      error.value = null

      if (reset) {
        page.value = 0
        hasMore.value = true
      }

      const from = page.value * pageSize
      const to = from + pageSize - 1

      console.log('[useTaskUpdates] Fetching updates:', { taskId, from, to })

      // Query principal: buscar atualizações (apenas top-level, sem respostas)
      const { data, error: fetchError, count } = await supabase
        .from('task_updates')
        .select(`
          *,
          author:profiles!task_comments_author_id_fkey(
            id,
            full_name,
            email,
            avatar_url
          )
        `, { count: 'exact' })
        .eq('task_id', taskId)
        .is('parent_id', null) // Apenas atualizações principais (não respostas)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (fetchError) {
        console.error('[useTaskUpdates] Supabase error:', fetchError)
        throw fetchError
      }

      // Buscar contadores de respostas e curtidas para cada atualização
      const updateIds = data?.map(u => u.id) || []
      
      let replyCounts: Record<string, number> = {}
      let likeCounts: Record<string, number> = {}
      let myLikes: Set<string> = new Set()
      let myReads: Set<string> = new Set()

      if (updateIds.length > 0) {
        // Contar respostas
        const { data: replyData } = await supabase
          .from('task_updates')
          .select('parent_id')
          .in('parent_id', updateIds)
          .not('parent_id', 'is', null)

        replyData?.forEach(r => {
          if (r.parent_id) {
            replyCounts[r.parent_id] = (replyCounts[r.parent_id] || 0) + 1
          }
        })

        // Contar curtidas
        const { data: likeData } = await supabase
          .from('task_update_likes')
          .select('update_id')
          .in('update_id', updateIds)

        likeData?.forEach(l => {
          likeCounts[l.update_id] = (likeCounts[l.update_id] || 0) + 1
        })

        // Verificar se o usuário curtiu
        if (user.value) {
          const { data: myLikeData } = await supabase
            .from('task_update_likes')
            .select('update_id')
            .in('update_id', updateIds)
            .eq('user_id', user.value.id)

          myLikeData?.forEach(l => myLikes.add(l.update_id))

          // Verificar se o usuário leu
          const { data: myReadData } = await supabase
            .from('task_update_reads')
            .select('update_id')
            .in('update_id', updateIds)
            .eq('user_id', user.value.id)

          myReadData?.forEach(r => myReads.add(r.update_id))
        }
      }

      // Mapear dados com contadores
      const mappedData: TaskUpdate[] = (data || []).map(update => ({
        ...update,
        reply_count: replyCounts[update.id] || 0,
        like_count: likeCounts[update.id] || 0,
        is_liked_by_me: myLikes.has(update.id),
        is_read_by_me: myReads.has(update.id)
      }))

      if (reset) {
        updates.value = mappedData
      } else {
        updates.value = [...updates.value, ...mappedData]
      }

      // Verificar se tem mais páginas
      const totalCount = count || 0
      const loadedCount = (page.value + 1) * pageSize
      hasMore.value = loadedCount < totalCount

      page.value++

      console.log('[useTaskUpdates] Fetched updates:', {
        count: mappedData.length,
        total: totalCount,
        hasMore: hasMore.value
      })
    } catch (err) {
      console.error('[useTaskUpdates] Error fetching updates:', err)
      error.value = err instanceof Error ? err.message : 'Erro ao carregar atualizações'
    } finally {
      loading.value = false
    }
  }

  /**
   * Criar nova atualização
   */
  async function createUpdate(content: string, parentId: string | null = null) {
    if (!user.value) {
      error.value = 'Usuário não autenticado'
      return null
    }

    if (!taskId) {
      console.error('[useTaskUpdates] taskId is required')
      error.value = 'ID da tarefa não fornecido'
      return null
    }

    if (!content.trim()) {
      error.value = 'Conteúdo não pode ser vazio'
      return null
    }

    try {
      loading.value = true
      error.value = null

      console.log('[useTaskUpdates] Creating update:', { taskId, content, parentId })

      const { data, error: createError } = await supabase
        .from('task_updates')
        .insert({
          task_id: taskId,
          author_id: user.value.id,
          content: content.trim(),
          parent_id: parentId
        })
        .select(`
          *,
          author:profiles!task_comments_author_id_fkey(
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .single()

      if (createError) {
        console.error('[useTaskUpdates] Supabase error:', createError)
        throw createError
      }

      const newUpdate: TaskUpdate = {
        ...data,
        reply_count: 0,
        like_count: 0,
        is_liked_by_me: false,
        is_read_by_me: true
      }

      // Se é uma atualização principal (não resposta), adicionar no início da lista
      if (!parentId) {
        updates.value = [newUpdate, ...updates.value]
      }

      console.log('[useTaskUpdates] Update created:', newUpdate.id)

      return newUpdate
    } catch (err) {
      console.error('[useTaskUpdates] Error creating update:', err)
      error.value = err instanceof Error ? err.message : 'Erro ao criar atualização'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Deletar atualização
   */
  async function deleteUpdate(updateId: string) {
    if (!user.value) {
      error.value = 'Usuário não autenticado'
      return false
    }

    try {
      loading.value = true
      error.value = null

      console.log('[useTaskUpdates] Deleting update:', updateId)

      const { error: deleteError } = await supabase
        .from('task_updates')
        .delete()
        .eq('id', updateId)
        .eq('author_id', user.value.id) // Apenas autor pode deletar

      if (deleteError) throw deleteError

      // Remover da lista
      updates.value = updates.value.filter(u => u.id !== updateId)

      console.log('[useTaskUpdates] Update deleted')

      return true
    } catch (err) {
      console.error('[useTaskUpdates] Error deleting update:', err)
      error.value = err instanceof Error ? err.message : 'Erro ao deletar atualização'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Atualizar conteúdo de uma atualização
   */
  async function updateContent(updateId: string, newContent: string) {
    if (!user.value) {
      error.value = 'Usuário não autenticado'
      return false
    }

    if (!newContent.trim()) {
      error.value = 'Conteúdo não pode ser vazio'
      return false
    }

    try {
      loading.value = true
      error.value = null

      console.log('[useTaskUpdates] Updating content:', updateId)

      const { error: updateError } = await supabase
        .from('task_updates')
        .update({
          content: newContent.trim(),
          edited_at: new Date().toISOString()
        })
        .eq('id', updateId)
        .eq('author_id', user.value.id) // Apenas autor pode editar

      if (updateError) throw updateError

      // Atualizar na lista
      const index = updates.value.findIndex(u => u.id === updateId)
      if (index !== -1) {
        updates.value[index].content = newContent.trim()
        updates.value[index].edited_at = new Date().toISOString()
      }

      console.log('[useTaskUpdates] Content updated')

      return true
    } catch (err) {
      console.error('[useTaskUpdates] Error updating content:', err)
      error.value = err instanceof Error ? err.message : 'Erro ao atualizar conteúdo'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Buscar última atualização (para preview na célula)
   */
  async function fetchLatestUpdate() {
    try {
      const { data, error: fetchError } = await supabase
        .from('task_updates')
        .select(`
          *,
          author:profiles!task_comments_author_id_fkey(
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('task_id', taskId)
        .is('parent_id', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (fetchError) {
        // Se não encontrou nenhuma atualização, não é erro
        if (fetchError.code === 'PGRST116') return null
        console.error('[useTaskUpdates] Supabase error:', fetchError)
        throw fetchError
      }

      return data as TaskUpdate
    } catch (err) {
      console.error('[useTaskUpdates] Error fetching latest update:', err)
      return null
    }
  }

  return {
    updates,
    loading,
    error,
    hasMore,
    fetchUpdates,
    createUpdate,
    deleteUpdate,
    updateContent,
    fetchLatestUpdate
  }
}
