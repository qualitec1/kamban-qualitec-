<template>
  <div 
    class="flex flex-col bg-neutral-50 rounded-xl border border-neutral-200 transition-all min-h-[300px] w-full max-w-full"
    :class="{ 
      'border-primary-400 bg-primary-50': isDragOver,
      'opacity-50 scale-95': draggingColumnId === group.id,
      'ring-2 ring-primary-400': isDragOverColumn
    }"
    @dragover.prevent="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <!-- Cabeçalho da coluna -->
    <div
      class="flex items-center gap-2 px-4 py-3 border-b border-neutral-200 shrink-0 group/header"
      :style="`border-left: 4px solid ${group.color || '#6366f1'}`"
    >
      <!-- Drag handle icon -->
      <div
        v-if="canEdit"
        class="flex-shrink-0 cursor-move"
        draggable="true"
        @dragstart="handleColumnDragStart"
        @dragend="handleColumnDragEnd"
        @dragover.prevent="handleColumnDragOver"
        @drop.stop="handleColumnDrop"
      >
        <svg 
          class="w-4 h-4 text-neutral-400 hover:text-neutral-600" 
          fill="currentColor" 
          viewBox="0 0 16 16"
        >
          <circle cx="4" cy="3" r="1.5" />
          <circle cx="4" cy="8" r="1.5" />
          <circle cx="4" cy="13" r="1.5" />
          <circle cx="12" cy="3" r="1.5" />
          <circle cx="12" cy="8" r="1.5" />
          <circle cx="12" cy="13" r="1.5" />
        </svg>
      </div>
      
      <span class="flex-1 text-heading-sm font-semibold text-neutral-900 truncate">
        {{ group.name }}
      </span>
      
      <span class="text-label-xs text-muted bg-white px-2 py-0.5 rounded-full">
        {{ tasks.length }}
      </span>
      
      <!-- Botão compartilhar (visível no hover) -->
      <button
        v-if="canEdit"
        @click.stop="$emit('share-group', group.id)"
        class="p-1.5 text-neutral-400 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-colors opacity-0 group-hover/header:opacity-100"
        title="Compartilhar grupo por e-mail"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </button>
    </div>

    <!-- Lista de cards -->
    <div 
      class="flex-1 overflow-y-auto p-3 space-y-2"
      @dragover.prevent="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <KanbanCard
        v-for="task in tasks"
        :key="task.id"
        :task="task"
        :statuses="statuses"
        :priorities="priorities"
        :is-dragging="draggingTaskId === task.id"
        @click="$emit('open-task', task.id)"
        @drag-start="handleDragStart(task.id)"
        @drag-end="handleDragEnd"
        @touch-drag-start="handleTouchDragStart"
        @touch-drag-move="handleTouchDragMove"
        @touch-drag-end="handleTouchDragEnd"
      />

      <!-- Empty state / Drop zone -->
      <div 
        v-if="!tasks.length" 
        class="text-center py-8 rounded-lg transition-colors"
        :class="{ 'bg-primary-100 border-2 border-dashed border-primary-400': isDragOver }"
      >
        <p class="text-label-sm text-muted italic">
          {{ isDragOver ? 'Solte aqui para mover' : 'Nenhuma tarefa' }}
        </p>
      </div>
    </div>

    <!-- Botão adicionar tarefa -->
    <div v-if="canEdit" class="border-t border-neutral-200 p-2 shrink-0">
      <button
        v-if="!isCreating"
        @click="$emit('start-create')"
        class="w-full flex items-center gap-2 px-3 py-2 text-label-sm text-muted hover:text-primary-600 hover:bg-white rounded-lg transition-colors"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Nova tarefa
      </button>
      
      <!-- Input inline -->
      <div v-else class="bg-white rounded-lg p-3 border border-primary-400 shadow-sm">
        <input
          ref="inputRef"
          :value="newTaskTitle"
          type="text"
          placeholder="Nome da tarefa..."
          maxlength="500"
          class="w-full text-body-sm text-neutral-800 bg-transparent outline-none placeholder:text-neutral-400"
          @input="$emit('update:newTaskTitle', ($event.target as HTMLInputElement).value)"
          @keydown.enter="$emit('save')"
          @keydown.esc="$emit('cancel')"
          @blur="$emit('cancel')"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { TaskRow } from '~/composables/useTasks'

const props = defineProps<{
  group: {
    id: string
    name: string
    color: string | null
  }
  tasks: TaskRow[]
  statuses: Array<{ id: string; name: string; color: string }>
  priorities: Array<{ id: string; name: string; color: string }>
  canEdit: boolean
  isCreating: boolean
  newTaskTitle: string
  draggingTaskId: string | null
  draggingColumnId?: string | null
  isDragOverColumn?: boolean
}>()

const emit = defineEmits<{
  (e: 'open-task', taskId: string): void
  (e: 'start-create'): void
  (e: 'save'): void
  (e: 'cancel'): void
  (e: 'update:newTaskTitle', value: string): void
  (e: 'drag-start', taskId: string): void
  (e: 'drag-end'): void
  (e: 'drop', groupId: string): void
  (e: 'touch-drag-start', data: { taskId: string; x: number; y: number }): void
  (e: 'touch-drag-move', data: { x: number; y: number }): void
  (e: 'touch-drag-end'): void
  (e: 'column-drag-start'): void
  (e: 'column-drag-end'): void
  (e: 'column-drag-over'): void
  (e: 'column-drop'): void
  (e: 'share-group', groupId: string): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const isDragOver = ref(false)

watch(() => props.isCreating, async (isCreating) => {
  if (isCreating) {
    await nextTick()
    inputRef.value?.focus()
  }
})

function handleDragStart(taskId: string) {
  emit('drag-start', taskId)
}

function handleDragEnd() {
  isDragOver.value = false
  emit('drag-end')
}

function handleTouchDragStart(data: { taskId: string; x: number; y: number }) {
  emit('touch-drag-start', data)
}

function handleTouchDragMove(data: { x: number; y: number }) {
  emit('touch-drag-move', data)
}

function handleTouchDragEnd() {
  isDragOver.value = false
  emit('touch-drag-end')
}

function handleDragOver(e: DragEvent) {
  if (!props.draggingTaskId) return
  e.preventDefault()
  isDragOver.value = true
}

function handleDragLeave(e: DragEvent) {
  // Verificar se realmente saiu da coluna (não apenas de um filho)
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const x = e.clientX
  const y = e.clientY
  
  if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
    isDragOver.value = false
  }
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  isDragOver.value = false
  
  if (props.draggingTaskId) {
    emit('drop', props.group.id)
  }
}

// Column drag handlers
function handleColumnDragStart(e: DragEvent) {
  if (!props.canEdit) {
    e.preventDefault()
    return
  }
  
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', props.group.id)
  }
  emit('column-drag-start')
}

function handleColumnDragEnd() {
  emit('column-drag-end')
}

function handleColumnDragOver(e: DragEvent) {
  if (!props.draggingColumnId) return
  e.preventDefault()
  e.stopPropagation()
  emit('column-drag-over')
}

function handleColumnDrop(e: DragEvent) {
  if (!props.draggingColumnId) return
  e.preventDefault()
  e.stopPropagation()
  emit('column-drop')
}
</script>
