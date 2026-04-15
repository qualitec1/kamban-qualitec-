import { createClient } from '@supabase/supabase-js'
import type { Database } from '#shared/types/database'

export default defineEventHandler(async (event) => {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw createError({
      statusCode: 500,
      message: 'Supabase configuration missing'
    })
  }

  // Get authenticated user token
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader) {
    throw createError({
      statusCode: 401,
      message: 'Não autenticado'
    })
  }

  const token = authHeader.replace('Bearer ', '')
  
  // Create client with user token
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  })

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw createError({
      statusCode: 401,
      message: 'Não autenticado'
    })
  }

  const taskId = getRouterParam(event, 'id')
  if (!taskId) {
    throw createError({
      statusCode: 400,
      message: 'ID da tarefa não fornecido'
    })
  }

  // Query params para paginação
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 0
  const pageSize = parseInt(query.pageSize as string) || 20
  const from = page * pageSize
  const to = from + pageSize - 1

  console.log('[GET /api/tasks/:id/updates] Fetching updates:', {
    taskId,
    userId: user.id,
    page,
    pageSize
  })

  try {
    // Verificar se usuário tem acesso à tarefa (via board_members)
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, board_id')
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      throw createError({
        statusCode: 404,
        message: 'Tarefa não encontrada'
      })
    }

    const { data: member, error: memberError } = await supabase
      .from('board_members')
      .select('user_id')
      .eq('board_id', task.board_id)
      .eq('user_id', user.id)
      .single()

    if (memberError || !member) {
      throw createError({
        statusCode: 403,
        message: 'Você não tem acesso a esta tarefa'
      })
    }

    // Buscar atualizações (apenas top-level, sem respostas)
    const { data: updates, error: updatesError, count } = await supabase
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
      .is('parent_id', null)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (updatesError) throw updatesError

    const updateIds = updates?.map(u => u.id) || []

    // Buscar contadores em paralelo
    const [replyData, likeData, myLikeData, myReadData] = await Promise.all([
      // Contar respostas
      updateIds.length > 0
        ? supabase
            .from('task_updates')
            .select('parent_id')
            .in('parent_id', updateIds)
            .not('parent_id', 'is', null)
        : Promise.resolve({ data: [] }),

      // Contar curtidas
      updateIds.length > 0
        ? supabase
            .from('task_update_likes')
            .select('update_id')
            .in('update_id', updateIds)
        : Promise.resolve({ data: [] }),

      // Verificar curtidas do usuário
      updateIds.length > 0
        ? supabase
            .from('task_update_likes')
            .select('update_id')
            .in('update_id', updateIds)
            .eq('user_id', user.id)
        : Promise.resolve({ data: [] }),

      // Verificar leituras do usuário
      updateIds.length > 0
        ? supabase
            .from('task_update_reads')
            .select('update_id')
            .in('update_id', updateIds)
            .eq('user_id', user.id)
        : Promise.resolve({ data: [] })
    ])

    // Processar contadores
    const replyCounts: Record<string, number> = {}
    replyData.data?.forEach((r: any) => {
      if (r.parent_id) {
        replyCounts[r.parent_id] = (replyCounts[r.parent_id] || 0) + 1
      }
    })

    const likeCounts: Record<string, number> = {}
    likeData.data?.forEach((l: any) => {
      likeCounts[l.update_id] = (likeCounts[l.update_id] || 0) + 1
    })

    const myLikes = new Set(myLikeData.data?.map((l: any) => l.update_id) || [])
    const myReads = new Set(myReadData.data?.map((r: any) => r.update_id) || [])

    // Mapear dados com contadores
    const mappedUpdates = (updates || []).map(update => ({
      ...update,
      reply_count: replyCounts[update.id] || 0,
      like_count: likeCounts[update.id] || 0,
      is_liked_by_me: myLikes.has(update.id),
      is_read_by_me: myReads.has(update.id)
    }))

    console.log('[GET /api/tasks/:id/updates] Success:', {
      count: mappedUpdates.length,
      total: count
    })

    return {
      updates: mappedUpdates,
      total: count || 0,
      page,
      pageSize,
      hasMore: (page + 1) * pageSize < (count || 0)
    }
  } catch (error: any) {
    console.error('[GET /api/tasks/:id/updates] Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Erro ao buscar atualizações'
    })
  }
})
