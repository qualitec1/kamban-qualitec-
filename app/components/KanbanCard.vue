<template>
  <div
    ref="cardRef"
    draggable="true"
    class="bg-white rounded-lg p-3 border border-neutral-200 shadow-sm hover:shadow-md transition-all select-none"
    :class="{ 
      'opacity-50 scale-95': isDragging, 
      'cursor-pointer': !isDragging,
      'cursor-move': isDragging,
      'ring-2 ring-primary-400': isLongPressing
    }"
    :style="dragStyle"
    @click="handleClick"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
    @touchcancel="handleTouchCancel"
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
import { ref, computed } from 'vue'
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
  (e: 'touch-drag-start', data: { taskId: string; x: number; y: number }): void
  (e: 'touch-drag-move', data: { x: number; y: number }): void
  (e: 'touch-drag-end'): void
}>()

const cardRef = ref<HTMLElement | null>(null)
const isLongPressing = ref(false)
const isTouchDragging = ref(false)
const longPressTimer = ref<number | null>(null)
const touchStartPos = ref({ x: 0, y: 0 })
const currentTouchPos = ref({ x: 0, y: 0 })

const statusData = computed(() => 
  props.task.status_id ? props.statuses.find(s => s.id === props.task.status_id) : null
)

const priorityData = computed(() => 
  props.task.priority_id ? props.priorities.find(p => p.id === props.task.priority_id) : null
)

const dragStyle = computed(() => {
  if (!isTouchDragging.value) return {}
  
  return {
    position: 'fixed' as const,
    left: `${currentTouchPos.value.x - 160}px`,
    top: `${currentTouchPos.value.y - 40}px`,
    width: '320px',
    zIndex: 9999,
    pointerEvents: 'none' as const,
    transform: 'rotate(3deg)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
  }
})

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function handleClick() {
  if (!isTouchDragging.value && !isLongPressing.value) {
    emit('click')
  }
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

// Touch events para mobile
function handleTouchStart(e: TouchEvent) {
  const touch = e.touches[0]
  if (!touch) return
  
  touchStartPos.value = { x: touch.clientX, y: touch.clientY }
  currentTouchPos.value = { x: touch.clientX, y: touch.clientY }
  
  // Iniciar timer de long press (500ms)
  longPressTimer.value = window.setTimeout(() => {
    isLongPressing.value = true
    isTouchDragging.value = true
    
    // Vibração háptica se disponível
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
    
    const t = e.touches[0]
    if (t) {
      emit('touch-drag-start', {
        taskId: props.task.id,
        x: t.clientX,
        y: t.clientY
      })
    }
  }, 500)
}

function handleTouchMove(e: TouchEvent) {
  const touch = e.touches[0]
  if (!touch) return
  
  const deltaX = Math.abs(touch.clientX - touchStartPos.value.x)
  const deltaY = Math.abs(touch.clientY - touchStartPos.value.y)
  
  // Se moveu mais de 10px antes do long press, cancelar
  if (!isTouchDragging.value && (deltaX > 10 || deltaY > 10)) {
    if (longPressTimer.value) {
      clearTimeout(longPressTimer.value)
      longPressTimer.value = null
    }
    isLongPressing.value = false
    return
  }
  
  // Se está arrastando, atualizar posição
  if (isTouchDragging.value) {
    e.preventDefault()
    currentTouchPos.value = { x: touch.clientX, y: touch.clientY }
    emit('touch-drag-move', { x: touch.clientX, y: touch.clientY })
  }
}

function handleTouchEnd(e: TouchEvent) {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
  
  if (isTouchDragging.value) {
    e.preventDefault()
    emit('touch-drag-end')
  }
  
  isLongPressing.value = false
  isTouchDragging.value = false
}

function handleTouchCancel() {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
  
  isLongPressing.value = false
  isTouchDragging.value = false
  
  if (isTouchDragging.value) {
    emit('touch-drag-end')
  }
}
</script>
