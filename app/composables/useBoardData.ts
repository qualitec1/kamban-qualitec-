import { ref, computed } from '#imports'
import type { Tables } from '#shared/types/database'
import type { TaskRow } from './useTasks'

type Board = Tables<'boards'>
type TaskGroup = Tables<'task_groups'>

interface BoardDataCache {
  board: Board | null
  groups: TaskGroup[]
  tasksByGroup: Record<string, TaskRow[]>
  accessRole: string | null
  timestamp: number
}

// Cache global com TTL de 30 segundos
const cache = new Map<string, BoardDataCache>()
const CACHE_TTL = 30000 // 30 segundos

/**
 * Composable otimizado para carregar dados do board de forma eficiente
 * - Carrega tudo em paralelo (não sequencial)
 * - Usa cache com stale-while-revalidate
 * - Reduz N+1 queries
 */
export function useBoardData(boardId: string) {
  const supabase = useNuxtApp().$supabase as any
  const { user, isMaster } = useAuth()

  const board = ref<Board | null>(null)
  const groups = ref<TaskGroup[]>([])
  const tasksByGroup = ref<Record<string, TaskRow[]>>({})
  const accessRole = ref<string | null>(null)
  
  const loading = ref(false)
  const error = ref<string | null>(null)

  const canEdit = computed(() =>
    isMaster.value ||
    accessRole.value === 'owner' ||
    accessRole.value === 'editor'
  )

  /**
   * Carrega dados do cache se disponível e válido
   */
  function loadFromCache(): boolean {
    const cached = cache.get(boardId)
    if (!cached) return false

    const age = Date.now() - cached.timestamp
    if (age > CACHE_TTL) return false

    board.value = cached.board
    groups.value = cached.groups
    tasksByGroup.value = cached.tasksByGroup
    accessRole.value = cached.accessRole
    
    return true
  }

  /**
   * Salva dados no cache
   */
  function saveToCache() {
    cache.set(boardId, {
      board: board.value,
      groups: groups.value,
      tasksByGroup: tasksByGroup.value,
      accessRole: accessRole.value,
      timestamp: Date.now()
    })
  }

  /**
   * Carrega todos os dados em paralelo (otimizado)
   */
  async function fetchAll(showArchived = false) {
    console.log('[useBoardData] fetchAll chamado para boardId:', boardId, 'showArchived:', showArchived)
    loading.value = true
    error.value = null

    try {
      // Carregar do cache primeiro (stale-while-revalidate)
      const hasCache = loadFromCache()
      if (hasCache) {
        console.log('[useBoardData] Dados carregados do cache')
        loading.value = false
        // Revalidar em background
        revalidateInBackground(showArchived)
        return
      }

      console.log('[useBoardData] Cache não encontrado, carregando dados frescos')
      // Se não tem cache, carregar tudo em paralelo
      await loadFreshData(showArchived)
      console.log('[useBoardData] Dados frescos carregados com sucesso')
    } catch (e: any) {
      error.value = e.message
      console.error('[useBoardData] ERRO CRÍTICO ao carregar board:', e)
      console.error('[useBoardData] Stack trace:', e.stack)
    } finally {
      loading.value = false
      console.log('[useBoardData] fetchAll finalizado - loading:', loading.value, 'error:', error.value)
    }
  }

  /**
   * Carrega dados frescos do banco (usado quando não há cache)
   */
  async function loadFreshData(showArchived = false) {
    console.log('[useBoardData] Iniciando loadFreshData para boardId:', boardId)
    console.log('[useBoardData] User:', user.value?.id, 'isMaster:', isMaster.value)
    
    // Executar TODAS as queries em paralelo (incluindo status, prioridades e membros)
    const [boardResult, groupsResult, roleResult, statusesResult, prioritiesResult, membersResult] = await Promise.all([
      // Query 1: Board
      supabase
        .from('boards')
        .select('*')
        .eq('id', boardId)
        .single(),

      // Query 2: Grupos
      supabase
        .from('task_groups')
        .select('*')
        .eq('board_id', boardId)
        .order('sort_order', { ascending: true }),

      // Query 3: Role do usuário
      user.value && !isMaster.value
        ? supabase
            .from('board_members')
            .select('access_role')
            .eq('board_id', boardId)
            .eq('user_id', user.value.id)
            .single()
        : Promise.resolve({ data: null, error: null }),
      
      // Query 4: Status (pré-carregar para cache)
      supabase
        .from('task_statuses')
        .select('id, board_id, name, color, sort_order')
        .eq('board_id', boardId)
        .order('sort_order', { ascending: true }),
      
      // Query 5: Prioridades (pré-carregar para cache)
      supabase
        .from('task_priorities')
        .select('id, board_id, name, color, sort_order')
        .eq('board_id', boardId)
        .order('sort_order', { ascending: true }),
      
      // Query 6: Membros do board (pré-carregar para cache)
      supabase
        .from('board_members')
        .select(`
          board_id,
          user_id,
          access_role,
          profiles:user_id (
            id, full_name, email, avatar_url, role_global
          )
        `)
        .eq('board_id', boardId)
    ])

    console.log('[useBoardData] Board result:', { data: boardResult.data, error: boardResult.error })
    console.log('[useBoardData] Groups result:', { count: groupsResult.data?.length, error: groupsResult.error })
    console.log('[useBoardData] Role result:', { data: roleResult.data, error: roleResult.error })
    console.log('[useBoardData] Statuses result:', { count: statusesResult.data?.length, error: statusesResult.error })
    console.log('[useBoardData] Priorities result:', { count: prioritiesResult.data?.length, error: prioritiesResult.error })
    console.log('[useBoardData] Members result:', { count: membersResult.data?.length, error: membersResult.error })

    // Processar resultados
    if (boardResult.error) {
      console.error('[useBoardData] Erro ao carregar board:', boardResult.error)
      throw boardResult.error
    }
    if (groupsResult.error) {
      console.error('[useBoardData] Erro ao carregar grupos:', groupsResult.error)
      throw groupsResult.error
    }
    if (roleResult.error) {
      console.error('[useBoardData] Erro ao carregar role (não crítico):', roleResult.error)
    }

    board.value = boardResult.data
    groups.value = groupsResult.data || []
    accessRole.value = isMaster.value ? 'owner' : (roleResult.data?.access_role ?? null)
    
    // Pré-popular cache de status e prioridades
    if (!statusesResult.error && statusesResult.data) {
      const { statusesCache } = await import('./useTaskStatuses')
      statusesCache.set(boardId, {
        data: statusesResult.data,
        timestamp: Date.now(),
        loading: null
      })
      console.log('[useBoardData] Cache de status populado com', statusesResult.data.length, 'itens')
    }
    
    if (!prioritiesResult.error && prioritiesResult.data) {
      const { prioritiesCache } = await import('./useTaskPriorities')
      prioritiesCache.set(boardId, {
        data: prioritiesResult.data,
        timestamp: Date.now(),
        loading: null
      })
      console.log('[useBoardData] Cache de prioridades populado com', prioritiesResult.data.length, 'itens')
    }
    
    if (!membersResult.error && membersResult.data) {
      const { membersCache } = await import('./useBoardMembers')
      const membersData = (membersResult.data || []).map((item: any) => ({
        board_id: item.board_id,
        user_id: item.user_id,
        access_role: item.access_role,
        profile: item.profiles
      }))
      membersCache.set(boardId, {
        data: membersData,
        timestamp: Date.now(),
        loading: null
      })
      console.log('[useBoardData] Cache de membros populado com', membersData.length, 'itens')
    }
    
    console.log('[useBoardData] Dados carregados - Board:', board.value?.name, 'Groups:', groups.value.length, 'Role:', accessRole.value)

    // Query 6: Tarefas de TODOS os grupos em UMA ÚNICA query (incluindo responsáveis)
    if (groups.value.length > 0) {
      console.log('[useBoardData] Carregando tarefas para', groups.value.length, 'grupos')
      const groupIds = groups.value.map(g => g.id)
      
      const tasksQuery = supabase
        .from('tasks')
        .select(`
          id, 
          title, 
          group_id, 
          board_id, 
          status_id, 
          priority_id, 
          due_date, 
          start_date, 
          description, 
          notes, 
          budget, 
          updated_at, 
          position,
          task_assignees (
            user_id,
            profiles:user_id (
              id,
              full_name,
              email,
              avatar_url
            )
          )
        `)
        .in('group_id', groupIds)
        .order('position', { ascending: true })

      if (showArchived) {
        tasksQuery.not('archived_at', 'is', null)
      } else {
        tasksQuery.is('archived_at', null)
      }

      const { data: tasksData, error: tasksError } = await tasksQuery

      console.log('[useBoardData] Tasks result:', { count: tasksData?.length, error: tasksError })

      if (tasksError) {
        console.error('[useBoardData] Erro ao carregar tarefas:', tasksError)
      }

      if (!tasksError && tasksData) {
        // Agrupar tarefas por group_id e processar assignees
        const grouped: Record<string, TaskRow[]> = {}
        groups.value.forEach(g => { grouped[g.id] = [] })
        
        tasksData.forEach((task: any) => {
          if (grouped[task.group_id]) {
            // Processar assignees
            const assignees = (task.task_assignees || [])
              .map((ta: any) => ta.profiles)
              .filter(Boolean)
            
            // Adicionar tarefa com assignees processados
            grouped[task.group_id].push({
              ...task,
              assignees // Adicionar assignees diretamente na tarefa
            })
          }
        })

        tasksByGroup.value = grouped
        console.log('[useBoardData] Tarefas agrupadas:', Object.keys(grouped).length, 'grupos com tarefas')
      }
    } else {
      console.log('[useBoardData] Nenhum grupo encontrado, pulando carregamento de tarefas')
    }

    // Salvar no cache
    saveToCache()
  }

  /**
   * Revalida dados em background (stale-while-revalidate)
   */
  async function revalidateInBackground(showArchived = false) {
    try {
      await loadFreshData(showArchived)
    } catch (e) {
      console.error('Erro ao revalidar cache:', e)
    }
  }

  /**
   * Invalida cache (usar após mutações)
   */
  function invalidateCache() {
    cache.delete(boardId)
  }

  /**
   * Atualiza tarefas de um grupo específico (após criar/deletar tarefa)
   */
  async function refreshGroupTasks(groupId: string, showArchived = false) {
    const query = supabase
      .from('tasks')
      .select('id, title, group_id, board_id, status_id, priority_id, due_date, start_date, description, notes, budget, updated_at, position')
      .eq('group_id', groupId)
      .order('position', { ascending: true })

    if (showArchived) {
      query.not('archived_at', 'is', null)
    } else {
      query.is('archived_at', null)
    }

    const { data, error: fetchError } = await query

    if (!fetchError && data) {
      tasksByGroup.value[groupId] = data as TaskRow[]
      saveToCache() // Atualizar cache
    }
  }

  return {
    board,
    groups,
    tasksByGroup,
    accessRole,
    canEdit,
    loading,
    error,
    fetchAll,
    invalidateCache,
    refreshGroupTasks
  }
}
