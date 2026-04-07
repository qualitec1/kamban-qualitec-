<template>
  <div class="border-b border-neutral-100 hover:bg-neutral-50">
    <!-- Scroll horizontal em mobile para acessar todas as colunas -->
    <div class="flex items-center gap-2 px-4 py-3 min-h-[44px] overflow-x-auto scrollbar-none">
      <!-- Título fixo, não encolhe -->
      <span class="text-sm text-neutral-800 truncate shrink-0 max-w-[140px] sm:max-w-none sm:flex-1">
        {{ task.title }}
      </span>

      <!-- Todas as colunas na ordem configurada -->
      <template v-for="col in orderedColumns" :key="col.key">
        <template v-if="isVisible(col.key)">
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
          />
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
  task: Pick<Tables<'tasks'>, 'id' | 'title' | 'group_id' | 'board_id' | 'status_id' | 'priority_id' | 'due_date' | 'start_date' | 'description' | 'budget' | 'updated_at'>
}>()

const { orderedColumns, isVisible } = useBoardColumns(props.task.board_id)

const currentStatusId   = ref<string | null>(props.task.status_id ?? null)
const currentPriorityId = ref<string | null>(props.task.priority_id ?? null)
const currentNote       = ref<string | null>(props.task.description ?? null)
const currentBudget     = ref<number | null>(props.task.budget ?? null)
const currentStartDate  = ref<string | null>(props.task.start_date ?? null)
const currentEndDate    = ref<string | null>(props.task.due_date ?? null)
</script>

<style scoped>
.scrollbar-none {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
</style>
