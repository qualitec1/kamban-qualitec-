import { ref } from '#imports'

export interface UpdateLike {
  update_id: string
  user_id: string
  created_at: string
}

export interface UpdateReply {
  id: string
  update_id: string
  parent_id: string
  author_id: string
  content: string
  created_at: string
  updated_at: string
  edited_at: string | null
  author?: {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
  }
}

export function useUpdateInteractions(updateId: string) {
  const supabase = useNuxtApp().$supabase as any
  const { user } = useAuth()
  
  const likes = ref<UpdateLike[]>([])
  const replies = ref<UpdateReply[]>([])
  const likeCount = ref(0)
  const replyCount = ref(0)
  const isLiked = ref(false)
  const loading = ref(false)

  // Curtidas
  async function fetchLikes() {
    try {
      const { data, error } = await supabase
        .from('task_update_likes')
        .select('*')
        .eq('update_id', updateId)

      if (!error && data) {
        likes.value = data
        likeCount.value = data.length
        isLiked.value = data.some((like: UpdateLike) => like.user_id === user.value?.id)
      }
    } catch (err) {
      console.error('Erro ao buscar curtidas:', err)
    }
  }

  async function toggleLike(): Promise<boolean> {
    if (!user.value) return false

    try {
      if (isLiked.value) {
        // Descurtir
        const { error } = await supabase
          .from('task_update_likes')
          .delete()
          .eq('update_id', updateId)
          .eq('user_id', user.value.id)

        if (!error) {
          isLiked.value = false
          likeCount.value--
          likes.value = likes.value.filter(like => like.user_id !== user.value?.id)
          return true
        }
      } else {
        // Curtir
        const { error } = await supabase
          .from('task_update_likes')
          .insert({
            update_id: updateId,
            user_id: user.value.id
          })

        if (!error) {
          isLiked.value = true
          likeCount.value++
          likes.value.push({
            update_id: updateId,
            user_id: user.value.id,
            created_at: new Date().toISOString()
          })
          return true
        }
      }
    } catch (err) {
      console.error('Erro ao curtir/descurtir:', err)
    }

    return false
  }

  // Respostas/Comentários
  async function fetchReplies() {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('task_updates')
        .select(`
          *,
          author:author_id (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('parent_id', updateId)
        .order('created_at', { ascending: true })

      if (!error && data) {
        replies.value = data
        replyCount.value = data.length
      }
    } catch (err) {
      console.error('Erro ao buscar respostas:', err)
    } finally {
      loading.value = false
    }
  }

  async function addReply(content: string): Promise<boolean> {
    if (!user.value || !content.trim()) return false

    try {
      const { data, error } = await supabase
        .from('task_updates')
        .insert({
          task_id: (await getTaskIdFromUpdate(updateId)),
          parent_id: updateId,
          author_id: user.value.id,
          content: content.trim()
        })
        .select(`
          *,
          author:author_id (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .single()

      if (!error && data) {
        replies.value.push(data)
        replyCount.value++
        return true
      }
    } catch (err) {
      console.error('Erro ao adicionar resposta:', err)
    }

    return false
  }

  async function deleteReply(replyId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('task_updates')
        .delete()
        .eq('id', replyId)

      if (!error) {
        replies.value = replies.value.filter(r => r.id !== replyId)
        replyCount.value--
        return true
      }
    } catch (err) {
      console.error('Erro ao deletar resposta:', err)
    }

    return false
  }

  async function updateReply(replyId: string, content: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('task_updates')
        .update({
          content: content.trim(),
          edited_at: new Date().toISOString()
        })
        .eq('id', replyId)

      if (!error) {
        const index = replies.value.findIndex(r => r.id === replyId)
        if (index !== -1) {
          replies.value[index].content = content.trim()
          replies.value[index].edited_at = new Date().toISOString()
        }
        return true
      }
    } catch (err) {
      console.error('Erro ao atualizar resposta:', err)
    }

    return false
  }

  // Helper para obter task_id do update
  async function getTaskIdFromUpdate(updateId: string): Promise<string> {
    const { data } = await supabase
      .from('task_updates')
      .select('task_id')
      .eq('id', updateId)
      .single()

    return data?.task_id
  }

  return {
    likes,
    replies,
    likeCount,
    replyCount,
    isLiked,
    loading,
    fetchLikes,
    toggleLike,
    fetchReplies,
    addReply,
    deleteReply,
    updateReply
  }
}
