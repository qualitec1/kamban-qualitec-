<template>
  <div 
    class="border-b border-neutral-100 hover:bg-blue-50/30 relative group"
    :class="{ 'bg-blue-50/50': isSelected }"
  >
    <!-- Scroll horizontal em mobile -->
    <div class="flex items-center gap-2 px-4 py-2.5 min-h-[44px] overflow-x-auto overflow-y-visible scrollbar-mobile snap-x snap-mandatory touch-pan-x">
      
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
              :status-id="subtask.status_id"
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
              :due-date="subtask.due_date"
            />
            
            <!-- Priority Cell -->
            <PriorityCell
              v-else-if="col.key === 'priority'"
              :task-id="subtask.id"
              :board-id="boardId"
              :priority-id="subtask.priority_id"
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
import { ref, nextTick } from 'vue'
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
}>()

const { orderedColumns, isVisible } = useBoardColumns(props.boardId)

const isEditingTitle = ref(false)
const localTitle = ref(props.subtask.title)
const titleInputRef = ref<HTMLInputElement | null>(null)

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
  emit('update-field', props.subtask.id, 'status_id', statusId)
}

function handlePriorityUpdate(priorityId: string | null) {
  emit('update-field', props.subtask.id, 'priority_id', priorityId)
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
