import { ref, computed } from 'vue'
import { useBoardData } from '~/composables/useBoardData'
import { useTaskGroups } from '~/composables/useTaskGroups'
import { useTasks } from '~/composables/useTasks'
import { useTaskStatuses } from '~/composables/useTaskStatuses'
import { useTaskPriorities } from '~/composables/useTaskPriorities'
import { useBoardMembers } from '~/composables/useBoardMembers'

export function useBoardPage(boardId: string) {
  // Validate boardId
  if (!boardId || boardId === 'undefined' || boardId === '[id]') {
    throw new Error('Invalid board ID')
  }

  // Data loading
  const {
    board,
    groups,
    tasksByGroup,
    canEdit,
    loading,
    error,
    fetchAll,
    invalidateCache,
    refreshGroupTasks
  } = useBoardData(boardId)

  // Composables
  const { addGroup, renameGroup, deleteGroup, toggleCollapse, reorderGroups } = useTaskGroups()
  const { createTask, deleteTask, moveTaskToGroup, reorderTasks } = useTasks()
  const { statuses, fetchStatuses } = useTaskStatuses(boardId)
  const { priorities, fetchPriorities } = useTaskPriorities(boardId)
  
  // Board members - initialize with empty state
  const boardMembers = ref<any[]>([])
  
  async function fetchMembers() {
    if (!boardId) return
    const { members, fetchMembers: fetch } = useBoardMembers()
    await fetch(boardId)
    // Extrair apenas os profiles dos membros
    boardMembers.value = members.value.map(m => m.profile)
  }

  // View preferences
  const viewMode = ref<'horizontal' | 'vertical'>('horizontal')
  const showEmptyGroups = ref(true)
  const showArchived = ref(false)

  // UI state
  const editingGroupId = ref<string | null>(null)
  const creatingInGroup = ref<string | null>(null)
  const newTaskTitle = ref('')

  // Drag and drop state
  const draggingId = ref<string | null>(null)
  const dragOverId = ref<string | null>(null)
  const draggingTaskId = ref<string | null>(null)
  const dragOverTaskId = ref<string | null>(null)
  const dragOverGroupId = ref<string | null>(null)

  // Modal state
  const showAddGroupModal = ref(false)
  const showShareGroupModal = ref(false)
  const showDeleteBoardModal = ref(false)
  const selectedGroupId = ref<string | null>(null)
  const addPosition = ref<'before' | 'after' | undefined>(undefined)
  const addRefGroupId = ref<string | undefined>(undefined)

  // Computed
  const taskCountByGroup = computed(() => {
    const counts: Record<string, number> = {}
    for (const groupId in tasksByGroup.value) {
      counts[groupId] = tasksByGroup.value[groupId]?.length ?? 0
    }
    return counts
  })

  const visibleGroups = computed(() => {
    if (showEmptyGroups.value) return groups.value
    return groups.value.filter(g => (taskCountByGroup.value[g.id] ?? 0) > 0)
  })

  // Load preferences from localStorage
  function loadPreferences() {
    if (import.meta.client) {
      const viewModeSaved = localStorage.getItem(`board-view-mode-${boardId}`)
      if (viewModeSaved) viewMode.value = viewModeSaved as 'horizontal' | 'vertical'

      const emptyGroupsSaved = localStorage.getItem(`board-show-empty-${boardId}`)
      if (emptyGroupsSaved !== null) showEmptyGroups.value = emptyGroupsSaved === 'true'

      const archivedSaved = localStorage.getItem(`board-show-archived-${boardId}`)
      if (archivedSaved !== null) showArchived.value = archivedSaved === 'true'
    }
  }

  // Save preferences to localStorage
  function savePreference(key: string, value: string) {
    if (import.meta.client) {
      localStorage.setItem(`board-${key}-${boardId}`, value)
    }
  }

  // Actions
  function toggleShowEmptyGroups() {
    showEmptyGroups.value = !showEmptyGroups.value
    savePreference('show-empty', String(showEmptyGroups.value))
  }

  function toggleShowArchived() {
    showArchived.value = !showArchived.value
    savePreference('show-archived', String(showArchived.value))
    fetchAll(showArchived.value)
  }

  function openAddGroup(position?: 'before' | 'after', refGroupId?: string) {
    addPosition.value = position
    addRefGroupId.value = refGroupId
    showAddGroupModal.value = true
  }

  function openShareGroupModal(groupId: string) {
    selectedGroupId.value = groupId
    showShareGroupModal.value = true
  }

  async function handleAddGroup(data: { name: string; color: string }) {
    console.log('[useBoardPage] handleAddGroup called with:', data)
    const result = await addGroup({
      boardId,
      name: data.name,
      color: data.color,
      position: addPosition.value,
      refGroupId: addRefGroupId.value
    })
    console.log('[useBoardPage] addGroup result:', result)
    if (result) {
      showAddGroupModal.value = false
      await fetchAll(showArchived.value)
    } else {
      console.error('[useBoardPage] Failed to add group')
    }
  }

  async function handleRenameGroup(groupId: string, name: string) {
    if (!name.trim()) {
      editingGroupId.value = null
      return
    }
    await renameGroup(groupId, name)
    editingGroupId.value = null
  }

  async function handleDeleteGroup(groupId: string) {
    if (groups.value.length === 1) return
    const confirmed = confirm('Tem certeza que deseja excluir este grupo? Todas as tarefas serão movidas para o primeiro grupo.')
    if (!confirmed) return
    
    await deleteGroup(groupId, boardId)
    await fetchAll(showArchived.value)
  }

  function openCreateTask(groupId: string) {
    creatingInGroup.value = groupId
    newTaskTitle.value = ''
  }

  async function saveNewTask(groupId: string, title: string) {
    if (!title.trim()) {
      creatingInGroup.value = null
      return
    }
    
    await createTask({
      boardId,
      groupId,
      title: title.trim()
    })
    creatingInGroup.value = null
    newTaskTitle.value = ''
    await refreshGroupTasks(groupId)
  }

  function cancelCreateTask() {
    creatingInGroup.value = null
    newTaskTitle.value = ''
  }

  // Drag and drop handlers
  function onGroupDragStart(groupId: string) {
    draggingId.value = groupId
  }

  function onGroupDragEnd() {
    draggingId.value = null
    dragOverId.value = null
  }

  async function onGroupDrop(targetId: string) {
    if (!draggingId.value || draggingId.value === targetId) {
      onGroupDragEnd()
      return
    }

    const ids = groups.value.map(g => g.id)
    const fromIdx = ids.indexOf(draggingId.value)
    const toIdx = ids.indexOf(targetId)

    if (fromIdx === -1 || toIdx === -1) return

    const newIds = [...ids]
    newIds.splice(fromIdx, 1)
    newIds.splice(toIdx, 0, draggingId.value)

    onGroupDragEnd()
    await reorderGroups(boardId, newIds)
    await fetchAll(showArchived.value)
  }

  function onTaskDragStart(taskId: string) {
    console.log('[useBoardPage] onTaskDragStart called with taskId:', taskId)
    draggingTaskId.value = taskId
    console.log('[useBoardPage] draggingTaskId set to:', draggingTaskId.value)
  }

  function onTaskDragEnd() {
    console.log('[useBoardPage] onTaskDragEnd called')
    draggingTaskId.value = null
    dragOverTaskId.value = null
    dragOverGroupId.value = null
  }

  async function onTaskDrop(targetTaskId: string, groupId: string) {
    console.log('[useBoardPage] onTaskDrop called', { targetTaskId, groupId, draggingTaskId: draggingTaskId.value })
    if (!draggingTaskId.value) {
      console.warn('[useBoardPage] No draggingTaskId, aborting drop')
      return
    }

    const tasks = tasksByGroup.value[groupId] || []
    const draggingTask = Object.values(tasksByGroup.value)
      .flat()
      .find(t => t.id === draggingTaskId.value)
    
    if (!draggingTask) return

    const sourceGroupId = draggingTask.group_id
    
    // If moving to different group (Kanban or Table cross-group drag)
    if (sourceGroupId !== groupId) {
      await moveTaskToGroup({
        taskId: draggingTaskId.value,
        sourceGroupId,
        targetGroupId: groupId
      })
      onTaskDragEnd()
      await Promise.all([
        refreshGroupTasks(sourceGroupId),
        refreshGroupTasks(groupId)
      ])
    } else if (targetTaskId) {
      // Reordering within same group (Table view only - has targetTaskId)
      const targetIdx = tasks.findIndex(t => t.id === targetTaskId)
      if (targetIdx === -1) return
      
      const taskIds = tasks.map(t => t.id)
      const fromIdx = taskIds.indexOf(draggingTaskId.value)
      
      if (fromIdx === -1) return
      
      const newIds = [...taskIds]
      newIds.splice(fromIdx, 1)
      newIds.splice(targetIdx, 0, draggingTaskId.value)
      
      await reorderTasks({ groupId, taskIds: newIds })
      onTaskDragEnd()
      await refreshGroupTasks(groupId)
    } else {
      // Same group but no targetTaskId (Kanban - just end drag)
      onTaskDragEnd()
    }
  }
  return {
    // Data
    board,
    groups,
    tasksByGroup,
    canEdit,
    loading,
    error,
    statuses,
    priorities,
    boardMembers,
    
    // View state
    viewMode,
    showEmptyGroups,
    showArchived,
    visibleGroups,
    
    // UI state
    editingGroupId,
    creatingInGroup,
    newTaskTitle,
    
    // Drag state
    draggingId,
    dragOverId,
    draggingTaskId,
    dragOverTaskId,
    dragOverGroupId,
    
    // Modal state
    showAddGroupModal,
    showShareGroupModal,
    showDeleteBoardModal,
    selectedGroupId,
    
    // Actions
    loadPreferences,
    toggleShowEmptyGroups,
    toggleShowArchived,
    openAddGroup,
    openShareGroupModal,
    handleAddGroup,
    handleRenameGroup,
    handleDeleteGroup,
    openCreateTask,
    saveNewTask,
    cancelCreateTask,
    toggleCollapse,
    
    // Drag handlers
    onGroupDragStart,
    onGroupDragEnd,
    onGroupDrop,
    onTaskDragStart,
    onTaskDragEnd,
    onTaskDrop,
    
    // Data fetching
    fetchAll,
    fetchStatuses,
    fetchPriorities,
    fetchMembers,
    invalidateCache,
    refreshGroupTasks
  }
}
