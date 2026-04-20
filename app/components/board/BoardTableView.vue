<template>
  <div class="flex-1 overflow-y-auto overflow-x-hidden space-y-4">
    <TaskGroup
      v-for="group in visibleGroups"
      :key="group.id"
      :group="group"
      :can-edit="canEdit"
      :is-only-group="groups.length === 1"
      :is-editing="editingGroupId === group.id"
      :is-dragging="draggingId === group.id"
      :is-drag-over="dragOverGroupId === group.id && draggingTaskId"
      @drag-start="$emit('groupDragStart', group.id)"
      @drag-end="$emit('groupDragEnd')"
      @drag-over="$emit('groupDragOver', $event, group.id)"
      @drop="$emit('groupDrop', group.id)"
      @toggle-collapse="$emit('toggleCollapse', group.id)"
      @start-rename="$emit('startRename', group.id)"
      @save-rename="$emit('saveRename', group.id, $event)"
      @cancel-rename="$emit('cancelRename')"
      @share="$emit('shareGroup', group.id)"
      @add-before="$emit('addGroup', 'before', group.id)"
      @add-after="$emit('addGroup', 'after', group.id)"
      @delete="$emit('deleteGroup', group.id)"
    >
      <!-- Cabeçalho das colunas -->
      <TaskGroupHeader :board-id="boardId" />
      
      <!-- Lista de tarefas -->
      <TransitionGroup name="list" tag="div">
        <div
          v-for="task in tasksByGroup[group.id]"
          :key="task.id"
          :data-task-id="task.id"
          class="relative motion-reorder"
          :class="{
            'dragging': draggingTaskId === task.id,
            'border-t-2 border-primary-400': dragOverTaskId === task.id && draggingTaskId !== task.id
          }"
          @dragover.prevent="$emit('taskDragOver', $event, task.id)"
          @drop="$emit('taskDrop', task.id, group.id)"
        >
          <TaskRow
            :task="task"
            :can-edit="canEdit"
            @task-deleted="$emit('taskDeleted', $event)"
            @drag-start="$emit('taskDragStart', task.id)"
            @drag-end="$emit('taskDragEnd')"
          />
        </div>
      </TransitionGroup>

      <!-- Empty state -->
      <div
        v-if="!(tasksByGroup[group.id]?.length)"
        class="px-4 py-8 text-center transition-colors"
        :class="{
          'bg-primary-50 border-2 border-dashed border-primary-300': dragOverGroupId === group.id && draggingTaskId
        }"
      >
        <p class="text-label-sm text-muted italic">Nenhuma tarefa ainda.</p>
        <p v-if="dragOverGroupId === group.id && draggingTaskId" class="text-label-xs text-primary-600 mt-1">
          Solte aqui para mover
        </p>
      </div>

      <!-- Botão Nova tarefa -->
      <div v-if="canEdit" class="border-t border-neutral-100">
        <div
          v-if="creatingInGroup === group.id"
          class="flex items-center gap-2 px-4 py-2"
        >
          <svg class="w-3.5 h-3.5 text-neutral-300 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <input
            :ref="el => { if (el && creatingInGroup === group.id) (el as HTMLInputElement).focus() }"
            v-model="newTaskTitle"
            type="text"
            placeholder="Nome da tarefa..."
            maxlength="500"
            class="flex-1 text-base text-neutral-800 bg-transparent outline-none placeholder:text-neutral-400"
            @keydown.enter="$emit('saveNewTask', group.id, newTaskTitle); newTaskTitle = ''"
            @keydown.esc="$emit('cancelCreateTask')"
            @blur="$emit('cancelCreateTask')"
          />
          <span class="text-xs text-neutral-300">Enter para salvar</span>
        </div>

        <button
          v-else
          type="button"
          class="w-full flex items-center gap-2 px-4 py-2.5 text-label-sm text-muted hover:text-primary-600 hover:bg-primary-50 motion-interactive active-press"
          @click="$emit('openCreateTask', group.id)"
        >
          <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nova tarefa
        </button>
      </div>
    </TaskGroup>

    <!-- Aviso quando grupos estão ocultos -->
    <div v-if="!showEmptyGroups && groups.length > 0 && visibleGroups.length === 0" class="text-center py-8">
      <p class="text-body-sm text-muted mb-2">Todos os grupos estão vazios e estão ocultos.</p>
      <button @click="$emit('toggleEmptyGroups')" class="text-label-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
        Mostrar grupos vazios
      </button>
    </div>

    <!-- Empty state quando não há grupos -->
    <div v-if="groups.length === 0" class="text-center py-12">
      <p class="text-body text-muted mb-3">Nenhum grupo criado.</p>
      <BaseButton v-if="canEdit" variant="primary" @click="$emit('addGroup')">
        Criar primeiro grupo
      </BaseButton>
    </div>

    <!-- Botão adicionar grupo no final -->
    <button
      v-if="canEdit && visibleGroups.length > 0"
      @click="$emit('addGroup')"
      class="w-full flex items-center gap-2 px-4 py-3 text-label-sm text-muted hover:text-primary-600 hover:bg-primary-50 rounded-xl border border-dashed border-neutral-200 hover:border-primary-300 transition-all"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      Adicionar grupo
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Tables } from '#shared/types/database'

defineProps<{
  boardId: string
  groups: Tables<'task_groups'>[]
  visibleGroups: Tables<'task_groups'>[]
  tasksByGroup: Record<string, any[]>
  canEdit: boolean
  showEmptyGroups: boolean
  editingGroupId: string | null
  creatingInGroup: string | null
  draggingId: string | null
  dragOverGroupId: string | null
  draggingTaskId: string | null
  dragOverTaskId: string | null
}>()

const newTaskTitle = ref('')

defineEmits<{
  groupDragStart: [groupId: string]
  groupDragEnd: []
  groupDragOver: [e: DragEvent, groupId: string]
  groupDrop: [groupId: string]
  toggleCollapse: [groupId: string]
  startRename: [groupId: string]
  saveRename: [groupId: string, name: string]
  cancelRename: []
  shareGroup: [groupId: string]
  addGroup: [position?: 'before' | 'after', refGroupId?: string]
  deleteGroup: [groupId: string]
  taskDragStart: [taskId: string]
  taskDragEnd: []
  taskDragOver: [e: DragEvent, taskId: string]
  taskDrop: [taskId: string, groupId: string]
  taskDeleted: [taskId: string]
  openCreateTask: [groupId: string]
  saveNewTask: [groupId: string, title: string]
  cancelCreateTask: []
  toggleEmptyGroups: []
}>()
</script>

<style scoped>
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.list-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.list-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.list-leave-active {
  position: absolute;
  width: 100%;
}

.dragging {
  opacity: 0.5;
}
</style>
