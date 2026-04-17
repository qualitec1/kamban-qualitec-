<template>
  <div
    draggable="true"
    class="bg-white rounded-lg p-3 border border-neutral-200 shadow-sm hover:shadow-md transition-all cursor-move"
    :class="{ 'opacity-50 scale-95': isDragging, 'cursor-pointer': !isDragging }"
    @click="!isDragging && $emit('click')"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
  >
    <h3 class="text-body-sm font-medium text-neutral-900 mb-2">{{ task.title }}</h3>
    
    <div class="flex items-center gap-2 text-label-xs text-muted flex-wrap">
      <!-- Status com cor real -->
      <div v-if="task.status_id && statusData" class="flex items-center gap-1">
        <div 
          class="w-2 h-2 rounded-full" 
          :style="{ backgroundColor: statusData.color }"
        />
        <span>{{ statusData.name }}</span>
      </div>
      
      <!-- Priority com cor real -->
      <div v-if="task.priority_id && priorityData" class="flex items-center gap-1">
        <div
          class="w-2 h-2 rounded-full"
          :style="{ backgroundColor: priorityData.color }"
        />
        <span>{{ priorityData.name }}</span>
      </div>
      
      <!-- Due date -->
      <div v-if="task.due_date" class="flex items-center gap-1">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>{{ formatDate(task.due_date) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TaskRow } from '~/composables/useTasks'

const props = defineProps<{
  task: TaskRow
  statuses: Array<{ id: string; name: string; color: string }>
  priorities: Array<{ id: string; name: string; color: string }>
  isDragging?: boolean
}>()

const emit = defineEmits<{
  (e: 'click'): void
  (e: 'drag-start'): void
  (e: 'drag-end'): void
}>()

const statusData = computed(() => 
  props.task.status_id ? props.statuses.find(s => s.id === props.task.status_id) : null
)

const priorityData = computed(() => 
  props.task.priority_id ? props.priorities.find(p => p.id === props.task.priority_id) : null
)

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function handleDragStart(e: DragEvent) {
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', props.task.id)
  }
  emit('drag-start')
}

function handleDragEnd() {
  emit('drag-end')
}
</script>
