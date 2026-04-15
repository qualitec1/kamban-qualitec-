<template>
  <div 
    class="border-b border-neutral-100 hover:bg-blue-50/30 relative group"
    :class="{ 
      'bg-blue-50/50': isSelected,
      'opacity-50': isDragging,
      'border-t-2 border-t-primary-500': isDropTarget
    }"
    :data-subtask-id="subtask.id"
    draggable="true"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @dragover.prevent="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <!-- Scroll horizontal em mobile -->
    <div class="flex items-center gap-2 px-4 py-2.5 min-h-[44px] overflow-x-auto overflow-y-visible scrollbar-mobile snap-x snap-mandatory touch-pan-x">
      
      <!-- Drag handle -->
      <div class="flex-shrink-0 snap-start cursor-move touch-manipulation" title="Arrastar para reordenar">
        <svg class="w-4 h-4 text-neutral-400 hover:text-neutral-600" fill="currentColor" viewBox="0 0 16 16">
          <circle cx="4" cy="3" r="1.5" />
          <circle cx="4" cy="8" r="1.5" />
          <circle cx="4" cy="13" r="1.5" />
          <circle cx="12" cy="3" r="1.5" />
          <circle cx="12" cy="8" r="1.5" />
          <circle cx="12" cy="13" r="1.5" />
        </svg>
      </div>
      <!-- Checkbox -->
      <div class="flex-shrink-0 snap-start">
        <input
          type="checkbox"
          :checked="subtask.is_done"
          :disabled="!canEdit"
          class="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-2 focus:ring-primary-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          @change="$emit('toggle', subtask.id, !subtask.is_done)"
        />
      </div>

      <!-- Título editável inline -->
      <div class="flex-1 min-w-[200px] snap-start">
        <input
          v-if="isEditingTitle"
          ref="titleInputRef"
          v-model="localTitle"
          type="text"
          class="w-full text-sm px-2 py-1 border border-primary-400 rounded focus:outline-none focus:ring-2 focus:ring-primary-400"
          :class="{ 'line-through text-neutral-400': subtask.is_done }"
          @blur="saveTitle"
          @keydown.enter="saveTitle"
          @keydown.esc="cancelEdit"
        />
        <div
          v-else
          class="text-sm px-2 py-1 cursor-text hover:bg-neutral-100 rounded transition-colors"
          :class="{ 'line-through text-neutral-400': subtask.is_done }"
          @click="startEditTitle"
        >
          {{ subtask.title }}
        </div>
      </div>

      <!-- Colunas dinâmicas usando os mesmos componentes das tarefas -->
      <template v-for="col in orderedColumns" :key="col.key">
        <template v-if="isVisible(col.key) && isSubtaskColumn(col.key)">
          <div class="flex-shrink-0 snap-start">
            <!-- Status Cell -->
            <StatusCell
              v-if="col.key === 'status'"
              :task-id="subtask.id"
              :board-id="boardId"
              :status-id="localStatusId"
              @update:status-id="handleStatusUpdate"
            />
            
            <!-- Assignee Cell -->
            <AssigneeCell
              v-else-if="col.key === 'assignee'"
              :task-id="subtask.id"
              :board-id="boardId"
            />
            
            <!-- Due Date Cell -->
            <DueDateCell
              v-else-if="col.key === 'dueDate'"
              :due-date="localDueDate"
            />
            
            <!-- Priority Cell -->
            <PriorityCell
              v-else-if="col.key === 'priority'"
              :task-id="subtask.id"
              :board-id="boardId"
              :priority-id="localPriorityId"
              @update:priority-id="handlePriorityUpdate"
            />
            
            <!-- Attachments Cell -->
            <AttachmentsCell
              v-else-if="col.key === 'attachments'"
              :task-id="subtask.id"
            />
          </div>
        </template>
      </template>

      <!-- Botão abrir detalhes -->
      <div class="flex-shrink-0 snap-start">
        <button
          type="button"
          class="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors touch-manipulation lg:opacity-0 lg:group-hover:opacity-100"
          title="Abrir detalhes"
          @click="$emit('open-details', subtask.id)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <!-- Botão deletar -->
      <div v-if="canEdit" class="flex-shrink-0 snap-start">
        <button
          type="button"
          class="p-1.5 text-neutral-400 hover:text-danger-600 hover:bg-danger-50 rounded transition-colors touch-manipulation lg:opacity-0 lg:group-hover:opacity-100"
          title="Remover subtarefa"
          @click="$emit('delete', subtask.id)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import type { Tables } from '#shared/types/database'
import { useBoardColumns } from '~/composables/useBoardColumns'

const props = defineProps<{
  subtask: Tables<'subtasks'>
  boardId: string
  canEdit: boolean
  isSelected?: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle', id: string, isDone: boolean): void
  (e: 'update', id: string, title: string): void
  (e: 'update-field', id: string, field: string, value: unknown): void
  (e: 'delete', id: string): void
  (e: 'open-details', id: string): void
  (e: 'reorder', fromId: string, toId: string): void
}>()

const { orderedColumns, isVisible } = useBoardColumns(props.boardId)

const isEditingTitle = ref(false)
const localTitle = ref(props.subtask.title)
const titleInputRef = ref<HTMLInputElement | null>(null)

// Estados para drag and drop
const isDragging = ref(false)
const isDropTarget = ref(false)
const touchStartY = ref(0)
const touchStartTime = ref(0)
const isTouchDragging = ref(false)

// Estados reativos locais para atualização otimista
const localStatusId = ref(props.subtask.status_id)
const localPriorityId = ref(props.subtask.priority_id)
const localDueDate = ref(props.subtask.due_date)

// Observar mudanças nas props para sincronizar
watch(() => props.subtask.status_id, (newVal) => {
  localStatusId.value = newVal
})
watch(() => props.subtask.priority_id, (newVal) => {
  localPriorityId.value = newVal
})
watch(() => props.subtask.due_date, (newVal) => {
  localDueDate.value = newVal
})

// Colunas que fazem sentido para subtarefas
const subtaskColumns = ['assignee', 'status', 'dueDate', 'attachments', 'priority']

function isSubtaskColumn(key: string): boolean {
  return subtaskColumns.includes(key)
}

async function startEditTitle() {
  if (!props.canEdit) return
  isEditingTitle.value = true
  await nextTick()
  titleInputRef.value?.focus()
  titleInputRef.value?.select()
}

function saveTitle() {
  if (localTitle.value.trim() && localTitle.value !== props.subtask.title) {
    emit('update', props.subtask.id, localTitle.value.trim())
  } else {
    localTitle.value = props.subtask.title
  }
  isEditingTitle.value = false
}

function cancelEdit() {
  localTitle.value = props.subtask.title
  isEditingTitle.value = false
}

function handleStatusUpdate(statusId: string | null) {
  // Atualização otimista local IMEDIATA
  localStatusId.value = statusId
  // Emitir para salvar no servidor em background
  emit('update-field', props.subtask.id, 'status_id', statusId)
}

function handlePriorityUpdate(priorityId: string | null) {
  // Atualização otimista local IMEDIATA
  localPriorityId.value = priorityId
  // Emitir para salvar no servidor em background
  emit('update-field', props.subtask.id, 'priority_id', priorityId)
}

// Drag and Drop handlers (Desktop)
function handleDragStart(e: DragEvent) {
  if (!props.canEdit) {
    e.preventDefault()
    return
  }
  
  isDragging.value = true
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', props.subtask.id)
  }
}

function handleDragEnd() {
  isDragging.value = false
  isDropTarget.value = false
}

function handleDragOver(e: DragEvent) {
  if (!props.canEdit) return
  
  e.preventDefault()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move'
  }
  isDropTarget.value = true
}

function handleDragLeave() {
  isDropTarget.value = false
}

function handleDrop(e: DragEvent) {
  if (!props.canEdit) return
  
  e.preventDefault()
  isDropTarget.value = false
  
  const draggedId = e.dataTransfer?.getData('text/plain')
  if (draggedId && draggedId !== props.subtask.id) {
    emit('reorder', draggedId, props.subtask.id)
  }
}

// Touch handlers (Mobile)
function handleTouchStart(e: TouchEvent) {
  if (!props.canEdit) return
  
  const touch = e.touches[0]
  if (!touch) return
  
  touchStartY.value = touch.clientY
  touchStartTime.value = Date.now()
  
  // Detectar se é um long press (500ms)
  setTimeout(() => {
    const timeDiff = Date.now() - touchStartTime.value
    if (timeDiff >= 500 && !isTouchDragging.value) {
      isTouchDragging.value = true
      isDragging.value = true
      
      // Feedback háptico se disponível
      if ('vibrate' in navigator) {
        navigator.vibrate(50)
      }
    }
  }, 500)
}

function handleTouchMove(e: TouchEvent) {
  if (!isTouchDragging.value || !props.canEdit) return
  
  e.preventDefault()
  
  const touch = e.touches[0]
  if (!touch) return
  
  // Encontrar elemento sob o toque
  const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY)
  const subtaskRow = elementBelow?.closest('[data-subtask-id]')
  
  if (subtaskRow) {
    const targetId = subtaskRow.getAttribute('data-subtask-id')
    if (targetId && targetId !== props.subtask.id) {
      isDropTarget.value = true
    }
  }
}

function handleTouchEnd(e: TouchEvent) {
  if (!isTouchDragging.value || !props.canEdit) return
  
  const touch = e.changedTouches[0]
  if (!touch) return
  
  // Encontrar elemento sob o toque
  const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY)
  const subtaskRow = elementBelow?.closest('[data-subtask-id]')
  
  if (subtaskRow) {
    const targetId = subtaskRow.getAttribute('data-subtask-id')
    if (targetId && targetId !== props.subtask.id) {
      emit('reorder', props.subtask.id, targetId)
    }
  }
  
  // Reset states
  isTouchDragging.value = false
  isDragging.value = false
  isDropTarget.value = false
}
</script>

<style scoped>
.scrollbar-mobile {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
  -webkit-overflow-scrolling: touch;
}

.scrollbar-mobile::-webkit-scrollbar {
  height: 6px;
}

.scrollbar-mobile::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-mobile::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

@media (min-width: 1024px) {
  .scrollbar-mobile {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  
  .scrollbar-mobile::-webkit-scrollbar {
    display: none;
  }
}

.touch-pan-x {
  touch-action: pan-x pan-y;
}

/* Melhorar resposta ao toque em botões */
.touch-manipulation {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  min-width: 40px;
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
