<template>
  <div class="flex-1 overflow-x-auto overflow-y-hidden">
    <div class="flex gap-4 h-full pb-4">
      <!-- Coluna para cada grupo -->
      <KanbanColumn
        v-for="group in visibleGroups"
        :key="group.id"
        :group="group"
        :tasks="tasksByGroup[group.id] || []"
        :statuses="statuses"
        :priorities="priorities"
        :can-edit="canEdit"
        :is-creating="creatingInGroup === group.id"
        :new-task-title="newTaskTitle"
        :dragging-task-id="draggingTaskId"
        @open-task="$emit('open-task', $event)"
        @start-create="handleStartCreate(group.id)"
        @save="handleSaveTask(group.id)"
        @cancel="handleCancelCreate"
        @update:newTaskTitle="newTaskTitle = $event"
        @drag-start="handleDragStart"
        @drag-end="handleDragEnd"
        @drop="handleDrop(group.id)"
      />

      <!-- Botão adicionar coluna -->
      <div v-if="canEdit" class="flex-shrink-0 w-80">
        <button
          @click="$emit('add-group')"
          class="w-full h-full min-h-[200px] flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 hover:border-primary-400 hover:bg-primary-50 text-muted hover:text-primary-600 transition-all"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span class="text-label-sm font-medium">Adicionar grupo</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { TaskRow } from '~/composables/useTasks'

const props = defineProps<{
  visibleGroups: Array<{
    id: string
    name: string
    color: string | null
  }>
  tasksByGroup: Record<string, TaskRow[]>
  statuses: Array<{ id: string; name: string; color: string }>
  priorities: Array<{ id: string; name: string; color: string }>
  canEdit: boolean
}>()

const emit = defineEmits<{
  (e: 'open-task', taskId: string): void
  (e: 'add-group'): void
  (e: 'create-task', data: { groupId: string; title: string }): void
  (e: 'move-task', data: { taskId: string; sourceGroupId: string; targetGroupId: string }): void
}>()

const creatingInGroup = ref<string | null>(null)
const newTaskTitle = ref('')
const draggingTaskId = ref<string | null>(null)
const sourceGroupId = ref<string | null>(null)

function handleStartCreate(groupId: string) {
  newTaskTitle.value = ''
  creatingInGroup.value = groupId
}

function handleCancelCreate() {
  creatingInGroup.value = null
  newTaskTitle.value = ''
}

function handleSaveTask(groupId: string) {
  const title = newTaskTitle.value.trim()
  if (!title) {
    handleCancelCreate()
    return
  }
  
  emit('create-task', { groupId, title })
  handleCancelCreate()
}

function handleDragStart(taskId: string) {
  draggingTaskId.value = taskId
  
  // Encontrar o grupo de origem
  for (const groupId in props.tasksByGroup) {
    const tasks = props.tasksByGroup[groupId]
    if (tasks?.some(t => t.id === taskId)) {
      sourceGroupId.value = groupId
      break
    }
  }
}

function handleDragEnd() {
  draggingTaskId.value = null
  sourceGroupId.value = null
}

function handleDrop(targetGroupId: string) {
  if (!draggingTaskId.value || !sourceGroupId.value) return
  
  // Se for o mesmo grupo, não fazer nada
  if (sourceGroupId.value === targetGroupId) {
    handleDragEnd()
    return
  }
  
  emit('move-task', {
    taskId: draggingTaskId.value,
    sourceGroupId: sourceGroupId.value,
    targetGroupId
  })
  
  handleDragEnd()
}
</script>
