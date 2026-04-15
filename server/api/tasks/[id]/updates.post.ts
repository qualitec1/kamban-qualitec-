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

  const body = await readBody(event)
  const { content, parent_id } = body

  if (!content || !content.trim()) {
    throw createError({
      statusCode: 400,
      message: 'Conteúdo não pode ser vazio'
    })
  }

  console.log('[POST /api/tasks/:id/updates] Creating update:', {
    taskId,
    userId: user.id,
    hasParent: !!parent_id
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
      .select('user_id, access_role')
      .eq('board_id', task.board_id)
      .eq('user_id', user.id)
      .single()

    if (memberError || !member) {
      throw createError({
        statusCode: 403,
        message: 'Você não tem acesso a esta tarefa'
      })
    }

    // Guests e observers não podem criar atualizações
    if (member.access_role === 'observer') {
      throw createError({
        statusCode: 403,
        message: 'Observadores não podem criar atualizações'
      })
    }

    // Se é uma resposta, verificar se parent existe
    if (parent_id) {
      const { data: parentUpdate, error: parentError } = await supabase
        .from('task_updates')
        .select('id, task_id')
        .eq('id', parent_id)
        .single()

      if (parentError || !parentUpdate) {
        throw createError({
          statusCode: 404,
          message: 'Atualização pai não encontrada'
        })
      }

      if (parentUpdate.task_id !== taskId) {
        throw createError({
          statusCode: 400,
          message: 'Atualização pai pertence a outra tarefa'
        })
      }
    }

    // Criar atualização
    const { data: newUpdate, error: createError } = await supabase
      .from('task_updates')
      .insert({
        task_id: taskId,
        author_id: user.id,
        content: content.trim(),
        parent_id: parent_id || null
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

    if (createError) throw createError

    console.log('[POST /api/tasks/:id/updates] Update created:', newUpdate.id)

    // TODO Fase 2: Extrair menções e criar notificações
    // TODO Fase 2: Enviar emails para mencionados

    return {
      update: {
        ...newUpdate,
        reply_count: 0,
        like_count: 0,
        is_liked_by_me: false,
        is_read_by_me: true
      }
    }
  } catch (error: any) {
    console.error('[POST /api/tasks/:id/updates] Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Erro ao criar atualização'
    })
  }
})
