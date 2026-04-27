<template>
  <div class="flex-1 overflow-y-auto p-2 sm:p-4">
    <!-- Filtro de grupos para mobile (< 640px) -->
    <div class="sm:hidden mb-4 flex items-center gap-2 overflow-x-auto pb-2">
      <button
        @click="showAllGroups = !showAllGroups"
        class="px-3 py-2 rounded-lg text-label-sm font-medium transition-all flex items-center gap-2 flex-shrink-0"
        :class="showAllGroups 
          ? 'bg-neutral-100 text-neutral-700 border border-neutral-300' 
          : 'bg-primary-500 text-white shadow-md'"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        {{ showAllGroups ? 'Filtrar grupo' : 'Ver todos' }}
      </button>
      
      <!-- Dropdown de seleção de grupo (apenas quando filtrado) -->
      <div v-if="!showAllGroups" class="flex-1 overflow-x-auto">
        <div class="flex gap-2 min-w-max">
          <button
            v-for="group in visibleGroups"
            :key="`tab-${group.id}`"
            @click="activeTabGroupId = group.id"
            class="px-4 py-2 rounded-lg text-label-sm font-medium transition-all whitespace-nowrap"
            :class="activeTabGroupId === group.id 
              ? 'bg-primary-500 text-white shadow-md' 
              : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'"
            :style="activeTabGroupId === group.id ? `background-color: ${group.color || '#1C325C'}` : ''"
          >
            {{ group.name }}
            <span class="ml-1.5 opacity-75">({{ tasksByGroup[group.id]?.length || 0 }})</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Grid 2 colunas em desktop, 1 coluna em mobile -->
    <div 
      class="gap-4 auto-rows-min transition-all w-full"
      :class="isMobile && !showAllGroups ? 'flex flex-col' : 'grid grid-cols-1 lg:grid-cols-2'"
      @touchstart="handleSwipeStart"
      @touchend="handleSwipeEnd"
    >
      <!-- Coluna para cada grupo -->
      <KanbanColumn
        v-for="(group, index) in visibleGroups"
        :key="group.id"
        v-show="isMobile && !showAllGroups ? activeTabGroupId === group.id : true"
        :class="{ 'scale-[0.98] sm:scale-100': isMobile && !showAllGroups }"
        :ref="el => setColumnRef(group.id, el)"
        :group="group"
        :tasks="tasksByGroup[group.id] || []"
        :statuses="statuses"
        :priorities="priorities"
        :can-edit="canEdit"
        :is-creating="creatingInGroup === group.id"
        :new-task-title="newTaskTitle"
        :dragging-task-id="draggingTaskId"
        :dragging-column-id="draggingColumnId"
        :is-drag-over="dragOverColumnId === group.id"
        @open-task="$emit('open-task', $event)"
        @start-create="handleStartCreate(group.id)"
        @save="handleSaveTask(group.id)"
        @cancel="handleCancelCreate"
        @update:newTaskTitle="newTaskTitle = $event"
        @drag-start="handleDragStart"
        @drag-end="handleDragEnd"
        @drop="handleDrop(group.id)"
        @touch-drag-start="handleTouchDragStart"
        @touch-drag-move="handleTouchDragMove"
        @touch-drag-end="handleTouchDragEnd"
        @column-drag-start="handleColumnDragStart(group.id)"
        @column-drag-end="handleColumnDragEnd"
        @column-drag-over="handleColumnDragOver(group.id)"
        @column-drop="handleColumnDrop(group.id)"
        @share-group="$emit('share-group', $event)"
      />

      <!-- Botão adicionar coluna -->
      <div v-if="canEdit && (!isMobile || showAllGroups)" class="min-h-[200px] w-full">
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
    
    <!-- Indicador visual de drop zone durante touch drag -->
    <div
      v-if="touchDragTargetGroupId"
      class="fixed inset-0 pointer-events-none z-50"
    >
      <div
        v-for="group in visibleGroups"
        :key="`drop-${group.id}`"
        :ref="el => setDropZoneRef(group.id, el)"
        class="absolute transition-all"
        :class="{ 'bg-primary-100 border-4 border-primary-400 rounded-xl': touchDragTargetGroupId === group.id }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
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
  (e: 'reorder-groups', data: { fromGroupId: string; toGroupId: string }): void
  (e: 'share-group', groupId: string): void
}>()

const creatingInGroup = ref<string | null>(null)
const newTaskTitle = ref('')
const draggingTaskId = ref<string | null>(null)
const sourceGroupId = ref<string | null>(null)

// Column drag state
const draggingColumnId = ref<string | null>(null)
const dragOverColumnId = ref<string | null>(null)

// Touch drag state
const touchDraggingTaskId = ref<string | null>(null)
const touchDragTargetGroupId = ref<string | null>(null)
const columnRefs = ref<Map<string, any>>(new Map())
const dropZoneRefs = ref<Map<string, any>>(new Map())

// Mobile tab state
const activeTabGroupId = ref<string | null>(null)
const isMobile = ref(false)
const showAllGroups = ref(true) // Por padrão mostra todos os grupos

// Swipe gesture state
const touchStartX = ref(0)
const touchEndX = ref(0)

// Inicializar tab ativo com primeiro grupo
onMounted(() => {
  if (props.visibleGroups.length > 0) {
    activeTabGroupId.value = props.visibleGroups[0].id
  }
  
  // Detectar mobile
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

function checkMobile() {
  isMobile.value = window.innerWidth < 640
}

function handleSwipeStart(e: TouchEvent) {
  if (!isMobile.value || showAllGroups.value) return
  touchStartX.value = e.touches[0].clientX
}

function handleSwipeEnd(e: TouchEvent) {
  if (!isMobile.value || showAllGroups.value) return
  touchEndX.value = e.changedTouches[0].clientX
  handleSwipeGesture()
}

function handleSwipeGesture() {
  const swipeThreshold = 50
  const diff = touchStartX.value - touchEndX.value
  
  if (Math.abs(diff) < swipeThreshold) return
  
  const currentIndex = props.visibleGroups.findIndex(g => g.id === activeTabGroupId.value)
  if (currentIndex === -1) return
  
  // Swipe left (próximo)
  if (diff > 0 && currentIndex < props.visibleGroups.length - 1) {
    activeTabGroupId.value = props.visibleGroups[currentIndex + 1].id
  }
  // Swipe right (anterior)
  else if (diff < 0 && currentIndex > 0) {
    activeTabGroupId.value = props.visibleGroups[currentIndex - 1].id
  }
}

function setColumnRef(groupId: string, el: any) {
  if (el) {
    columnRefs.value.set(groupId, el)
  }
}

function setDropZoneRef(groupId: string, el: any) {
  if (el) {
    dropZoneRefs.value.set(groupId, el)
  }
}

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

// Touch drag handlers
function handleTouchDragStart(data: { taskId: string; x: number; y: number }) {
  touchDraggingTaskId.value = data.taskId
  draggingTaskId.value = data.taskId
  
  // Encontrar o grupo de origem
  for (const groupId in props.tasksByGroup) {
    const tasks = props.tasksByGroup[groupId]
    if (tasks?.some(t => t.id === data.taskId)) {
      sourceGroupId.value = groupId
      break
    }
  }
  
  // Atualizar target inicial
  updateTouchDragTarget(data.x, data.y)
}

function handleTouchDragMove(data: { x: number; y: number }) {
  if (!touchDraggingTaskId.value) return
  updateTouchDragTarget(data.x, data.y)
}

function handleTouchDragEnd() {
  if (!touchDraggingTaskId.value || !sourceGroupId.value || !touchDragTargetGroupId.value) {
    resetTouchDrag()
    return
  }
  
  // Se for o mesmo grupo, não fazer nada
  if (sourceGroupId.value !== touchDragTargetGroupId.value) {
    emit('move-task', {
      taskId: touchDraggingTaskId.value,
      sourceGroupId: sourceGroupId.value,
      targetGroupId: touchDragTargetGroupId.value
    })
  }
  
  resetTouchDrag()
}

function updateTouchDragTarget(x: number, y: number) {
  let foundTarget: string | null = null
  
  // Verificar qual coluna está sob o dedo
  for (const [groupId, colRef] of columnRefs.value.entries()) {
    if (!colRef?.$el) continue
    
    const rect = colRef.$el.getBoundingClientRect()
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      foundTarget = groupId
      break
    }
  }
  
  touchDragTargetGroupId.value = foundTarget
}

function resetTouchDrag() {
  touchDraggingTaskId.value = null
  touchDragTargetGroupId.value = null
  draggingTaskId.value = null
  sourceGroupId.value = null
}

// Column drag and drop handlers
function handleColumnDragStart(groupId: string) {
  draggingColumnId.value = groupId
}

function handleColumnDragEnd() {
  draggingColumnId.value = null
  dragOverColumnId.value = null
}

function handleColumnDragOver(groupId: string) {
  if (!draggingColumnId.value || draggingColumnId.value === groupId) return
  dragOverColumnId.value = groupId
}

function handleColumnDrop(targetGroupId: string) {
  if (!draggingColumnId.value || draggingColumnId.value === targetGroupId) {
    handleColumnDragEnd()
    return
  }
  
  emit('reorder-groups', {
    fromGroupId: draggingColumnId.value,
    toGroupId: targetGroupId
  })
  
  handleColumnDragEnd()
}
</script>
