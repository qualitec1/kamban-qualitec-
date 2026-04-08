<template>
  <div class="border-b border-neutral-100 hover:bg-neutral-50 relative overflow-hidden">
    <!-- Indicador de scroll (gradiente) - apenas mobile -->
    <div class="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10 lg:hidden" />
    
    <!-- Scroll horizontal em mobile para acessar todas as colunas -->
    <div class="flex items-center gap-2 px-4 py-3 min-h-[44px] overflow-x-auto overflow-y-visible scrollbar-mobile snap-x snap-mandatory touch-pan-x">
      <!-- Título editável inline (sticky em mobile) -->
      <div class="flex-shrink-0 snap-start">
        <TitleCell
          :task-id="task.id"
          :board-id="task.board_id"
          :title="currentTitle"
          @update:title="currentTitle = $event"
          @open-modal="showModal = true"
        />
      </div>

      <!-- Modal completo da tarefa -->
      <TaskModal
        v-model="showModal"
        :task-id="task.id"
        :board-id="task.board_id"
        @updated="onTaskUpdated"
        @deleted="onTaskDeleted"
      />

      <!-- Todas as colunas na ordem configurada -->
      <template v-for="col in orderedColumns" :key="col.key">
        <template v-if="isVisible(col.key)">
          <div class="flex-shrink-0 snap-start">
            <TimelineCell
              v-if="col.key === 'timeline'"
              :task-id="task.id"
              :start-date="currentStartDate"
              :end-date="currentEndDate"
              @update:start-date="currentStartDate = $event"
              @update:end-date="currentEndDate = $event"
            />
            <BudgetCell
              v-else-if="col.key === 'budget'"
              :task-id="task.id"
              :budget="currentBudget"
              @update:budget="currentBudget = $event"
            />
            <AttachmentsCell
              v-else-if="col.key === 'attachments'"
              :task-id="task.id"
            />
            <NotesCell
              v-else-if="col.key === 'notes'"
              :task-id="task.id"
              :board-id="task.board_id"
              :note="currentNote"
              @update:note="currentNote = $event"
            />
            <DueDateCell
              v-else-if="col.key === 'dueDate'"
              :due-date="currentEndDate"
            />
            <LastUpdatedCell
              v-else-if="col.key === 'lastUpdated'"
              :updated-at="task.updated_at"
            />
            <PriorityCell
              v-else-if="col.key === 'priority'"
              :task-id="task.id"
              :board-id="task.board_id"
              :priority-id="currentPriorityId"
              @update:priority-id="currentPriorityId = $event"
            />
            <StatusCell
              v-else-if="col.key === 'status'"
              :task-id="task.id"
              :board-id="task.board_id"
              :status-id="currentStatusId"
              @update:status-id="currentStatusId = $event"
            />
            <AssigneeCell
              v-else-if="col.key === 'assignee'"
              :task-id="task.id"
              :board-id="task.board_id"
            />
            <LabelsCell
              v-else-if="col.key === 'labels'"
              :task-id="task.id"
              :board-id="task.board_id"
            />
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Tables } from '#shared/types/database'
import { useBoardColumns } from '~/composables/useBoardColumns'

const props = defineProps<{
  task: Pick<Tables<'tasks'>, 'id' | 'title' | 'group_id' | 'board_id' | 'status_id' | 'priority_id' | 'due_date' | 'start_date' | 'description' | 'notes' | 'budget' | 'updated_at'>
}>()

const emit = defineEmits<{ 
  (e: 'taskUpdated', id: string): void
  (e: 'taskDeleted', id: string): void
}>()

const showModal = ref(false)

function onTaskUpdated(patch: { field: string; value: unknown }) {
  // Sync local reactive state so the row reflects changes immediately
  if (patch.field === 'title')        currentTitle.value      = patch.value as string
  if (patch.field === 'status_id')    currentStatusId.value   = patch.value as string | null
  if (patch.field === 'priority_id')  currentPriorityId.value = patch.value as string | null
  if (patch.field === 'notes')        currentNote.value       = patch.value as string | null
  if (patch.field === 'budget')       currentBudget.value     = patch.value as number | null
  if (patch.field === 'start_date')   currentStartDate.value  = patch.value as string | null
  if (patch.field === 'due_date')     currentEndDate.value    = patch.value as string | null
  emit('taskUpdated', props.task.id)
}

function onTaskDeleted(taskId: string) {
  emit('taskDeleted', taskId)
}
const { orderedColumns, isVisible } = useBoardColumns(props.task.board_id)

const currentTitle      = ref<string>(props.task.title)
const currentStatusId   = ref<string | null>(props.task.status_id ?? null)
const currentPriorityId = ref<string | null>(props.task.priority_id ?? null)
const currentNote       = ref<string | null>(props.task.notes ?? null)
const currentBudget     = ref<number | null>(props.task.budget ?? null)
const currentStartDate  = ref<string | null>(props.task.start_date ?? null)
const currentEndDate    = ref<string | null>(props.task.due_date ?? null)
</script>

<style scoped>
/* Scrollbar visível em mobile, oculta em desktop */
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

.scrollbar-mobile::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.3);
}

/* Desktop: ocultar scrollbar */
@media (min-width: 1024px) {
  .scrollbar-mobile {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  
  .scrollbar-mobile::-webkit-scrollbar {
    display: none;
  }
}

/* Touch action para permitir scroll horizontal suave */
.touch-pan-x {
  touch-action: pan-x pan-y;
}
</style>
