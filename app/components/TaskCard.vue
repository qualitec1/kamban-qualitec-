<template>
  <div
    :class="[
      'bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer',
      variantClasses
    ]"
    @click="$emit('click')"
  >
    <div class="flex items-start justify-between gap-3">
      <!-- Content -->
      <div class="flex-1 min-w-0">
        <h3 class="text-body font-medium text-neutral-900 mb-1 truncate">
          {{ task.title }}
        </h3>
        
        <p v-if="task.description" class="text-label-sm text-muted mb-2 line-clamp-2">
          {{ task.description }}
        </p>

        <div class="flex flex-wrap items-center gap-2 text-label-sm text-muted">
          <!-- Board -->
          <span class="flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            {{ task.board.name }}
          </span>

          <!-- Group -->
          <span v-if="task.group" class="flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
            </svg>
            {{ task.group.name }}
          </span>

          <!-- Due Date -->
          <span v-if="task.due_date" :class="['flex items-center gap-1', dueDateClass]">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            {{ formatDate(task.due_date) }}
          </span>
        </div>
      </div>

      <!-- Arrow -->
      <svg class="w-5 h-5 text-neutral-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TaskWithBoard } from '~/composables/useMyTasks'

const props = defineProps<{
  task: TaskWithBoard
  variant?: 'default' | 'danger' | 'warning'
}>()

defineEmits<{
  click: []
}>()

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'danger':
      return 'border-danger-200 bg-danger-50'
    case 'warning':
      return 'border-warning-200 bg-warning-50'
    default:
      return 'border-neutral-200'
  }
})

const dueDateClass = computed(() => {
  if (!props.task.due_date) return ''
  
  // Parse a data como local, não UTC
  const [year, month, day] = props.task.due_date.split('T')[0].split('-')
  const dueDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  dueDate.setHours(0, 0, 0, 0)
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  if (dueDate < today) return 'text-danger-600 font-medium'
  if (dueDate.getTime() === today.getTime()) return 'text-warning-600 font-medium'
  return ''
})

function formatDate(dateString: string): string {
  // Parse a data como local, não UTC
  const [year, month, day] = dateString.split('T')[0].split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)
  
  if (targetDate.getTime() === today.getTime()) return 'Hoje'
  if (targetDate.getTime() === tomorrow.getTime()) return 'Amanhã'
  
  return date.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: 'short'
  })
}
</script>
