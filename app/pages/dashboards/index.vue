<template>
  <div v-if="mounted" class="min-h-screen bg-[#f6f7fb]">
    <!-- Header -->
    <DashboardHeader
      :connected-boards-count="connectedBoards.length"
      :search-query="searchQuery"
      :filter-by-people="filterByPeople"
      @add-widget="handleAddWidget"
      @manage-boards="handleManageBoards"
      @update:search-query="searchQuery = $event"
      @toggle-people-filter="handleTogglePeopleFilter"
      @toggle-filters="handleToggleFilters"
      @open-settings="handleOpenSettings"
      @toggle-favorite="handleToggleFavorite"
    />

    <!-- Loading state -->
    <LoadingState v-if="isLoading" label="Carregando dados do dashboard..." size="md" />

    <!-- Canvas de widgets com posicionamento livre -->
    <div v-else class="relative p-4 sm:p-6 min-h-[calc(100vh-200px)]">
      
      <!-- Widget com posicionamento absoluto -->
      <div
        v-for="widget in widgetsList"
        :key="widget.id"
        :style="{
          position: 'absolute',
          left: `${widget.position.x}px`,
          top: `${widget.position.y}px`,
          width: `${widget.position.width}px`,
          height: `${widget.position.height}px`,
          transition: isDragging === widget.id ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: isDragging === widget.id ? 1000 : widget.position.zIndex || 1
        }"
        :class="[
          'widget-container',
          isDragging === widget.id && 'dragging',
          isResizing === widget.id && 'resizing'
        ]"
        @mousedown="startDrag($event, widget)"
        @touchstart="startDrag($event, widget)"
      >
        <WidgetCard
          :widget-id="widget.id"
          :title="widget.title"
          :size="widget.size"
          :loading="widget.loading"
          @resize-start="startResize($event, widget)"
          @fullscreen="handleWidgetFullscreen"
          @exit-fullscreen="handleWidgetExitFullscreen"
          @rename="handleWidgetRename"
          @duplicate="handleWidgetDuplicate"
          @delete="handleWidgetDelete"
        >
          <!-- Widget de responsáveis -->
          <AssigneeWidget
            v-if="widget.id === 'widget-1'"
            :assignees="assigneeData"
          />
          
          <!-- Outros widgets (placeholder) -->
          <div v-else class="text-center py-8">
            <p class="text-4xl font-bold" :class="widget.valueColor">{{ widget.value }}</p>
            <p class="text-sm text-neutral-500 mt-1">{{ widget.label }}</p>
          </div>
        </WidgetCard>

        <!-- Resize handles -->
        <div
          v-if="!widget.loading"
          class="resize-handle resize-se"
          @mousedown.stop="startResize($event, widget, 'se')"
          @touchstart.stop="startResize($event, widget, 'se')"
        ></div>
      </div>

      <!-- Debug info (temporário) -->
      <div class="mt-6 bg-white rounded-xl border border-neutral-200 p-6" style="position: relative; margin-top: 600px;">
        <p class="text-body-sm text-muted mb-4">
          Dashboard carregado com sucesso! Arraste os widgets para qualquer posição e redimensione pelos cantos.
        </p>
        
        <div class="space-y-2 text-xs text-neutral-600">
          <p>Boards conectados: {{ connectedBoards.length }}</p>
          <p>Status encontrados: {{ statusData.length }}</p>
          <p>Responsáveis encontrados: {{ assigneeData.length }}</p>
          <p>Tarefas atrasadas: {{ overdueData.length }}</p>
          <p>Datas com tarefas: {{ deadlineData.length }}</p>
        </div>
      </div>
    </div>

    <!-- Modal de adicionar widget -->
    <AddWidgetModal
      v-model="showAddWidgetModal"
      @select="handleWidgetTypeSelected"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from '#imports'
import { useDashboard } from '~/composables/useDashboard'
import DashboardHeader from '~/components/dashboard/DashboardHeader.vue'
import WidgetCard from '~/components/dashboard/WidgetCard.vue'
import AssigneeWidget from '~/components/dashboard/AssigneeWidget.vue'
import AddWidgetModal from '~/components/dashboard/AddWidgetModal.vue'
import LoadingState from '~/components/LoadingState.vue'

definePageMeta({
  layout: 'default',
  ssr: false
})

// Estado local
const searchQuery = ref('')
const mounted = ref(false)
const isDragging = ref<string | null>(null)
const isResizing = ref<string | null>(null)
const dragStart = ref({ x: 0, y: 0, widgetX: 0, widgetY: 0 })
const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0 })
const showAddWidgetModal = ref(false)

// Composable (só será chamado no client)
let connectedBoards = ref<string[]>([])
let filterByPeople = ref<string[]>([])
let isLoading = ref(false)
let statusData = ref<any[]>([])
let assigneeData = ref<any[]>([])
let overdueData = ref<any[]>([])
let deadlineData = ref<any[]>([])
let fetchAllDashboardData = async () => {}

// Lista de widgets com posicionamento livre
const defaultWidgets = [
  {
    id: 'widget-1',
    title: 'Tarefas por Responsável',
    size: 'half' as const,
    loading: false,
    value: computed(() => assigneeData.value.length),
    label: 'responsáveis',
    valueColor: 'text-green-600',
    position: { x: 20, y: 20, width: 300, height: 200, zIndex: 1 }
  },
  {
    id: 'widget-2',
    title: 'Tarefas por Status',
    size: 'half' as const,
    loading: false,
    value: computed(() => statusData.value.length),
    label: 'status encontrados',
    valueColor: 'text-blue-600',
    position: { x: 340, y: 20, width: 300, height: 200, zIndex: 1 }
  },
  {
    id: 'widget-3',
    title: 'Tarefas Atrasadas',
    size: 'half' as const,
    loading: false,
    value: computed(() => overdueData.value.length),
    label: 'tarefas atrasadas',
    valueColor: 'text-red-600',
    position: { x: 20, y: 240, width: 300, height: 200, zIndex: 1 }
  },
  {
    id: 'widget-4',
    title: 'Próximos Vencimentos',
    size: 'half' as const,
    loading: false,
    value: computed(() => deadlineData.value.length),
    label: 'datas com tarefas',
    valueColor: 'text-orange-600',
    position: { x: 340, y: 240, width: 300, height: 200, zIndex: 1 }
  }
]

const widgetsList = ref(defaultWidgets)

// Carregar posições salvas do localStorage
function loadWidgetPositions() {
  if (import.meta.server) return
  
  try {
    const saved = localStorage.getItem('dashboard-widget-positions')
    if (saved) {
      const savedData = JSON.parse(saved)
      
      // Se há uma lista de IDs salvos, filtrar apenas os widgets que não foram excluídos
      if (savedData.widgetIds) {
        widgetsList.value = defaultWidgets.filter(widget => 
          savedData.widgetIds.includes(widget.id)
        )
      }
      
      // Atualizar posições dos widgets existentes
      if (savedData.positions) {
        widgetsList.value.forEach(widget => {
          const savedPosition = savedData.positions.find((p: any) => p.id === widget.id)
          if (savedPosition && savedPosition.position) {
            widget.position = { ...savedPosition.position }
          }
        })
      }
      
      console.log('[dashboards/index] Widget positions loaded from localStorage')
    }
  } catch (error) {
    console.error('[dashboards/index] Error loading widget positions:', error)
  }
}

// Salvar posições no localStorage
function saveWidgetPositions() {
  if (import.meta.server) return
  
  try {
    const data = {
      widgetIds: widgetsList.value.map(w => w.id),
      positions: widgetsList.value.map(w => ({
        id: w.id,
        position: w.position
      }))
    }
    
    localStorage.setItem('dashboard-widget-positions', JSON.stringify(data))
    console.log('[dashboards/index] Widget positions saved to localStorage')
  } catch (error) {
    console.error('[dashboards/index] Error saving widget positions:', error)
  }
}

// Drag & Drop
function startDrag(event: MouseEvent | TouchEvent, widget: any) {
  const target = event.target as HTMLElement
  
  // Não arrastar se clicar em botões ou resize handle
  if (target.closest('button') || target.closest('.resize-handle')) {
    return
  }
  
  isDragging.value = widget.id
  widget.position.zIndex = 100
  
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
  
  dragStart.value = {
    x: clientX,
    y: clientY,
    widgetX: widget.position.x,
    widgetY: widget.position.y
  }
  
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
  document.addEventListener('touchmove', onDragMove)
  document.addEventListener('touchend', onDragEnd)
}

function onDragMove(event: MouseEvent | TouchEvent) {
  if (!isDragging.value) return
  
  const widget = widgetsList.value.find(w => w.id === isDragging.value)
  if (!widget) return
  
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
  
  const deltaX = clientX - dragStart.value.x
  const deltaY = clientY - dragStart.value.y
  
  widget.position.x = Math.max(0, dragStart.value.widgetX + deltaX)
  widget.position.y = Math.max(0, dragStart.value.widgetY + deltaY)
}

function onDragEnd() {
  if (isDragging.value) {
    const widget = widgetsList.value.find(w => w.id === isDragging.value)
    if (widget) {
      widget.position.zIndex = 1
    }
  }
  isDragging.value = null
  
  // Salvar posições após arrastar
  saveWidgetPositions()
  
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
  document.removeEventListener('touchmove', onDragMove)
  document.removeEventListener('touchend', onDragEnd)
}

// Resize
function startResize(event: MouseEvent | TouchEvent, widget: any, direction: string = 'se') {
  event.preventDefault()
  event.stopPropagation()
  
  isResizing.value = widget.id
  widget.position.zIndex = 100
  
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
  
  resizeStart.value = {
    x: clientX,
    y: clientY,
    width: widget.position.width,
    height: widget.position.height
  }
  
  document.addEventListener('mousemove', onResizeMove)
  document.addEventListener('mouseup', onResizeEnd)
  document.addEventListener('touchmove', onResizeMove)
  document.addEventListener('touchend', onResizeEnd)
}

function onResizeMove(event: MouseEvent | TouchEvent) {
  if (!isResizing.value) return
  
  const widget = widgetsList.value.find(w => w.id === isResizing.value)
  if (!widget) return
  
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
  
  const deltaX = clientX - resizeStart.value.x
  const deltaY = clientY - resizeStart.value.y
  
  widget.position.width = Math.max(250, resizeStart.value.width + deltaX)
  widget.position.height = Math.max(180, resizeStart.value.height + deltaY)
}

function onResizeEnd() {
  if (isResizing.value) {
    const widget = widgetsList.value.find(w => w.id === isResizing.value)
    if (widget) {
      widget.position.zIndex = 1
    }
  }
  isResizing.value = null
  
  // Salvar posições após redimensionar
  saveWidgetPositions()
  
  document.removeEventListener('mousemove', onResizeMove)
  document.removeEventListener('mouseup', onResizeEnd)
  document.removeEventListener('touchmove', onResizeMove)
  document.removeEventListener('touchend', onResizeEnd)
}

// Handlers dos eventos do header
function handleAddWidget() {
  showAddWidgetModal.value = true
  console.log('[dashboards/index] Add widget modal opened')
}

function handleWidgetTypeSelected(widgetType: string) {
  console.log('[dashboards/index] Widget type selected:', widgetType)
  
  // Criar novo widget baseado no tipo
  const newWidget = {
    id: `widget-${Date.now()}`,
    title: getWidgetTitle(widgetType),
    size: 'half' as const,
    loading: false,
    value: computed(() => getWidgetValue(widgetType)),
    label: getWidgetLabel(widgetType),
    valueColor: getWidgetColor(widgetType),
    position: {
      x: 20,
      y: 20 + (widgetsList.value.length * 30), // Offset vertical para cada novo widget
      width: 300,
      height: 200,
      zIndex: 1
    }
  }
  
  widgetsList.value.push(newWidget)
  saveWidgetPositions()
}

function getWidgetTitle(type: string): string {
  const titles: Record<string, string> = {
    'assignee': 'Tarefas por Responsável',
    'numbers': 'Métricas Gerais',
    'progress': 'Progresso Geral',
    'gantt': 'Cronograma',
    'files': 'Arquivos',
    'status': 'Tarefas por Status'
  }
  return titles[type] || 'Novo Widget'
}

function getWidgetValue(type: string): number {
  switch (type) {
    case 'assignee':
      return assigneeData.value.length
    case 'status':
      return statusData.value.length
    case 'numbers':
      return overdueData.value.length + deadlineData.value.length
    default:
      return 0
  }
}

function getWidgetLabel(type: string): string {
  const labels: Record<string, string> = {
    'assignee': 'responsáveis',
    'numbers': 'métricas',
    'progress': '% completo',
    'gantt': 'tarefas',
    'files': 'arquivos',
    'status': 'status'
  }
  return labels[type] || 'itens'
}

function getWidgetColor(type: string): string {
  const colors: Record<string, string> = {
    'assignee': 'text-green-600',
    'numbers': 'text-purple-600',
    'progress': 'text-blue-600',
    'gantt': 'text-orange-600',
    'files': 'text-cyan-600',
    'status': 'text-pink-600'
  }
  return colors[type] || 'text-neutral-600'
}

function handleManageBoards() {
  console.log('[dashboards/index] Manage boards clicked')
}

function handleTogglePeopleFilter() {
  console.log('[dashboards/index] Toggle people filter clicked')
}

function handleToggleFilters() {
  console.log('[dashboards/index] Toggle filters clicked')
}

function handleOpenSettings() {
  console.log('[dashboards/index] Open settings clicked')
}

function handleToggleFavorite() {
  console.log('[dashboards/index] Toggle favorite clicked')
}

// Handlers dos eventos dos widgets
function handleWidgetFullscreen(widgetId: string) {
  console.log('[dashboards/index] Widget fullscreen:', widgetId)
  // Fullscreen é gerenciado pelo próprio WidgetCard com fixed positioning
}

function handleWidgetExitFullscreen(widgetId: string) {
  console.log('[dashboards/index] Widget exit fullscreen:', widgetId)
}

function handleWidgetRename(widgetId: string, newTitle: string) {
  const widget = widgetsList.value.find(w => w.id === widgetId)
  if (widget) {
    widget.title = newTitle
    saveWidgetPositions()
    console.log('[dashboards/index] Widget renamed:', widgetId, newTitle)
  }
}

function handleWidgetDuplicate(widgetId: string) {
  const widget = widgetsList.value.find(w => w.id === widgetId)
  if (widget) {
    const newWidget = {
      ...widget,
      id: `widget-${Date.now()}`,
      title: `${widget.title} (cópia)`,
      position: {
        ...widget.position,
        x: widget.position.x + 20,
        y: widget.position.y + 20,
        zIndex: 1
      }
    }
    widgetsList.value.push(newWidget)
    saveWidgetPositions()
    console.log('[dashboards/index] Widget duplicated:', widgetId)
  }
}

function handleWidgetDelete(widgetId: string) {
  const index = widgetsList.value.findIndex(w => w.id === widgetId)
  if (index !== -1) {
    widgetsList.value.splice(index, 1)
    saveWidgetPositions()
    console.log('[dashboards/index] Widget deleted:', widgetId)
  }
}

onMounted(async () => {
  mounted.value = true
  
  // Carregar posições salvas ANTES de inicializar os dados
  loadWidgetPositions()
  
  // Inicializar composable apenas no client
  const dashboard = useDashboard()
  connectedBoards = dashboard.connectedBoards
  filterByPeople = dashboard.filterByPeople
  isLoading = dashboard.isLoading
  statusData = dashboard.statusData
  assigneeData = dashboard.assigneeData
  overdueData = dashboard.overdueData
  deadlineData = dashboard.deadlineData
  fetchAllDashboardData = dashboard.fetchAllDashboardData
  
  console.log('[dashboards/index] Mounting dashboard page...')
  await fetchAllDashboardData()
  console.log('[dashboards/index] Dashboard data loaded')
})

onUnmounted(() => {
  // Cleanup event listeners
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
  document.removeEventListener('mousemove', onResizeMove)
  document.removeEventListener('mouseup', onResizeEnd)
  document.removeEventListener('touchmove', onDragMove)
  document.removeEventListener('touchend', onDragEnd)
  document.removeEventListener('touchmove', onResizeMove)
  document.removeEventListener('touchend', onResizeEnd)
})
</script>

<style scoped>
.widget-container {
  cursor: move;
  user-select: none;
  touch-action: none;
}

.widget-container.dragging {
  cursor: grabbing;
  opacity: 0.9;
  transform: rotate(2deg) scale(1.02);
  box-shadow: 0 20px 40px rgba(0, 115, 234, 0.3);
}

.widget-container.resizing {
  cursor: nwse-resize;
}

/* Resize handle */
.resize-handle {
  position: absolute;
  width: 16px;
  height: 16px;
  background: #0073ea;
  border: 2px solid white;
  border-radius: 50%;
  cursor: nwse-resize;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 10;
}

.widget-container:hover .resize-handle {
  opacity: 1;
}

.resize-se {
  bottom: -8px;
  right: -8px;
}

/* Mobile: touch targets maiores */
@media (max-width: 640px) {
  .resize-handle {
    width: 24px;
    height: 24px;
    opacity: 0.7;
  }
  
  .resize-se {
    bottom: -12px;
    right: -12px;
  }
}
</style>
