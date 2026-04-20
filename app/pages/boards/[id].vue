<template>
  <div class="flex flex-col h-full">
    <!-- Board header -->
    <BoardHeader :board="board">
      <template #actions>
        <BoardToolbar
          :board-id="boardId"
          :view-mode="viewMode"
          :show-archived="showArchived"
          :show-empty-groups="showEmptyGroups"
          :can-edit="canEdit"
          @update:view-mode="viewMode = $event; savePreference('view-mode', $event)"
          @toggle-archived="toggleShowArchived"
          @toggle-empty-groups="toggleShowEmptyGroups"
          @add-group="openAddGroup()"
          @delete-board="showDeleteBoardModal = true"
        />
      </template>
    </BoardHeader>

    <!-- Loading / Error states -->
    <LoadingState v-if="loading" />
    <ErrorState v-else-if="error" :message="error" @retry="fetchAll(showArchived)" />

    <!-- Table view -->
    <BoardTableView
      v-else-if="viewMode === 'horizontal'"
      :board-id="boardId"
      :groups="groups"
      :visible-groups="visibleGroups"
      :tasks-by-group="tasksByGroup"
      :can-edit="canEdit"
      :show-empty-groups="showEmptyGroups"
      :editing-group-id="editingGroupId"
      :creating-in-group="creatingInGroup"
      :dragging-id="draggingId"
      :drag-over-group-id="dragOverGroupId"
      :dragging-task-id="draggingTaskId"
      :drag-over-task-id="dragOverTaskId"
      @group-drag-start="onGroupDragStart"
      @group-drag-end="onGroupDragEnd"
      @group-drag-over="(e: DragEvent, groupId: string) => dragOverGroupId = groupId"
      @group-drop="onGroupDrop"
      @toggle-collapse="toggleCollapse"
      @start-rename="editingGroupId = $event"
      @save-rename="handleRenameGroup"
      @cancel-rename="editingGroupId = null"
      @share-group="openShareGroupModal"
      @add-group="openAddGroup"
      @delete-group="handleDeleteGroup"
      @task-drag-start="onTaskDragStart"
      @task-drag-end="onTaskDragEnd"
      @task-drag-over="(e: DragEvent, taskId: string) => dragOverTaskId = taskId"
      @task-drop="(taskId: string, groupId: string) => onTaskDrop(taskId, groupId)"
      @task-deleted="(groupId: string) => refreshGroupTasks(groupId)"
      @open-create-task="openCreateTask"
      @save-new-task="(groupId: string, title: string) => saveNewTask(groupId, title)"
      @cancel-create-task="cancelCreateTask"
      @toggle-empty-groups="toggleShowEmptyGroups"
    />

    <!-- Kanban view -->
    <KanbanView
      v-else-if="viewMode === 'vertical'"
      :visible-groups="visibleGroups"
      :tasks-by-group="tasksByGroup"
      :statuses="statuses"
      :priorities="priorities"
      :can-edit="canEdit"
      @open-task="(taskId: string) => { selectedTaskId = taskId; showTaskModal = true }"
      @add-group="openAddGroup()"
      @create-task="(data: { groupId: string; title: string }) => saveNewTask(data.groupId, data.title)"
      @move-task="(data: { taskId: string; sourceGroupId: string; targetGroupId: string }) => onTaskDrop(data.taskId, data.targetGroupId)"
      @reorder-groups="(data: { fromGroupId: string; toGroupId: string }) => onGroupDrop(data.toGroupId)"
      @share-group="openShareGroupModal"
    />

    <!-- Modals -->
    <AddGroupModal
      v-model="showAddGroupModal"
      @submit="handleAddGroup"
    />

    <ShareGroupModal
      v-model="showShareGroupModal"
      :members="boardMembers"
      @submit="handleShareGroup"
    />

    <DeleteBoardModal
      v-model="showDeleteBoardModal"
      :board-name="(board as any)?.name ?? 'este quadro'"
      @confirm="handleDeleteBoard"
    />

    <TaskModal
      v-if="selectedTaskId"
      :key="selectedTaskId"
      v-model="showTaskModal"
      :task-id="selectedTaskId"
      :board-id="boardId"
      @updated="handleTaskUpdated"
      @deleted="handleTaskDeleted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from '#imports'
import { useBoardPage } from '~/composables/useBoardPage'
import { useBoards } from '~/composables/useBoards'

const route = useRoute()
const boardId = route.params.id as string

// Validate board ID
if (!boardId || boardId === '[id]' || boardId.includes('[')) {
  console.error('[boards/[id].vue] Invalid board ID, redirecting to /boards')
  navigateTo('/boards')
}

// Use board page composable
const {
  board,
  groups,
  tasksByGroup,
  canEdit,
  loading,
  error,
  statuses,
  priorities,
  boardMembers,
  viewMode,
  showEmptyGroups,
  showArchived,
  visibleGroups,
  editingGroupId,
  creatingInGroup,
  draggingId,
  dragOverGroupId,
  draggingTaskId,
  dragOverTaskId,
  showAddGroupModal,
  showShareGroupModal,
  showDeleteBoardModal,
  selectedGroupId,
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
  onGroupDragStart,
  onGroupDragEnd,
  onGroupDrop,
  onTaskDragStart,
  onTaskDragEnd,
  onTaskDrop,
  fetchAll,
  fetchStatuses,
  fetchPriorities,
  fetchMembers,
  refreshGroupTasks
} = useBoardPage(boardId)

const { deleteBoard } = useBoards()

// Task modal state
const selectedTaskId = ref<string | null>(null)
const showTaskModal = ref(false)

// Save preference helper
function savePreference(key: string, value: string) {
  if (import.meta.client) {
    localStorage.setItem(`board-${key}-${boardId}`, value)
  }
}

// Share group handler
async function handleShareGroup(data: { memberIds: string[]; message: string }) {
  // TODO: Implement share group API call
  console.log('Share group:', selectedGroupId.value, data)
  showShareGroupModal.value = false
}

// Delete board handler
async function handleDeleteBoard() {
  const success = await deleteBoard(boardId)
  if (success) {
    navigateTo('/boards')
  }
}

// Task handlers
function handleTaskUpdated() {
  if (selectedTaskId.value) {
    const task = Object.values(tasksByGroup.value)
      .flat()
      .find(t => t.id === selectedTaskId.value)
    if (task?.group_id) {
      refreshGroupTasks(task.group_id)
    }
  }
}

function handleTaskDeleted() {
  showTaskModal.value = false
  selectedTaskId.value = null
  fetchAll(showArchived.value)
}

// Initialize
onMounted(async () => {
  loadPreferences()
  await Promise.all([
    fetchAll(showArchived.value),
    fetchStatuses(),
    fetchPriorities(),
    fetchMembers()
  ])
})

// Watch view mode changes
watch(viewMode, (newMode) => {
  savePreference('view-mode', newMode)
})
</script>
