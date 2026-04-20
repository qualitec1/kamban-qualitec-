<template>
  <div class="relative" ref="rootRef">
    <!-- Botão de status estilo Monday.com -->
    <button
      v-if="canEditTasks"
      type="button"
      class="w-full min-w-[120px] max-w-[200px] px-4 py-2 rounded-lg text-sm font-medium text-white text-center transition-all hover:opacity-90 flex items-center justify-center"
      :style="{ backgroundColor: currentStatus?.color || '#94a3b8', minHeight: '36px' }"
      @click="toggleDropdown"
    >
      {{ currentStatus?.name || 'Sem status' }}
    </button>

    <!-- Read-only view (sem permissão) -->
    <div
      v-else
      class="w-full min-w-[120px] max-w-[200px] px-4 py-2 rounded-lg text-sm font-medium text-white text-center cursor-default flex items-center justify-center"
      :style="{ backgroundColor: currentStatus?.color || '#94a3b8', minHeight: '36px' }"
    >
      {{ currentStatus?.name || 'Sem status' }}
    </div>

    <!-- Dropdown estilo Monday.com -->
    <Teleport to="body">
      <!-- Overlay para mobile -->
      <div
        v-if="open && canEditTasks && isMobile"
        class="fixed inset-0 bg-black/30 z-[99998]"
        @click="open = false"
      />
      
      <!-- Dropdown -->
      <div
        v-if="open && canEditTasks"
        ref="dropdownRef"
        class="fixed z-[99999] bg-white border border-neutral-200 rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
        :class="isMobile ? 'w-[calc(100vw-32px)] max-h-[90vh]' : 'w-[600px]'"
        :style="dropdownStyle"
      >
        <!-- Painel esquerdo - Seleção de status -->
        <div class="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-neutral-200 flex flex-col">
          <!-- Header -->
          <div class="px-4 py-3 border-b border-neutral-200 bg-neutral-50">
            <h3 class="text-sm font-semibold text-neutral-700">Status</h3>
          </div>

          <!-- Lista de status (sempre visível) -->
          <div class="p-2 max-h-[300px] overflow-y-auto flex-1">
            <!-- Sem status -->
            <button
              type="button"
              class="w-full px-4 py-3 rounded-lg text-sm font-medium text-white text-center transition-all hover:opacity-90 mb-2"
              style="background-color: #94a3b8"
              @mousedown.prevent="select(null)"
            >
              Sem status
            </button>

            <!-- Status disponíveis (usando orderedStatuses para refletir reordenação) -->
            <button
              v-for="status in orderedStatuses"
              :key="status.id"
              type="button"
              class="w-full px-4 py-3 rounded-lg text-sm font-medium text-white text-center transition-all hover:opacity-90 mb-2"
              :style="{ backgroundColor: status.color }"
              @mousedown.prevent="select(status.id)"
            >
              {{ status.name }}
            </button>

            <!-- Estado vazio -->
            <div v-if="orderedStatuses.length === 0 && !loading" class="px-4 py-6 text-center">
              <p class="text-sm text-neutral-400">Nenhum status configurado</p>
            </div>
          </div>

          <!-- Footer - Editar etiquetas -->
          <div class="px-4 py-3 border-t border-neutral-200 bg-neutral-50">
            <button
              type="button"
              class="w-full flex items-center justify-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
              @click.stop="showManager = !showManager"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              {{ showManager ? 'Fechar' : 'Editar etiquetas' }}
            </button>
          </div>
        </div>

        <!-- Painel direito - Gerenciador -->
        <div v-if="showManager" class="w-full md:w-1/2 flex flex-col bg-neutral-50">
          <!-- Header -->
          <div class="px-4 py-3 border-b border-neutral-200 bg-neutral-50">
            <h4 class="text-sm font-semibold text-neutral-700">Gerenciar Status</h4>
          </div>

          <!-- Conteúdo do gerenciador -->
          <div class="flex-1 overflow-y-auto p-3 space-y-2">
            <!-- Lista de status editáveis -->
            <div
              v-for="status in orderedStatuses"
              :key="status.id"
              class="flex items-center gap-2 p-2 rounded-lg border border-neutral-200 hover:border-neutral-300 bg-white transition-colors"
              draggable="true"
              @dragstart="startDrag(status.id)"
              @dragover="onDragOver"
              @drop="onDrop(status.id)"
            >
              <!-- Drag handle -->
              <div class="cursor-move text-neutral-300 hover:text-neutral-400 text-xs">⋮⋮</div>

              <!-- Ícone de cor (clicável para mudar) -->
              <button
                type="button"
                class="w-5 h-5 rounded flex-shrink-0 hover:opacity-80 transition-opacity"
                :style="{ backgroundColor: status.color }"
                @click.stop="startEditingColor(status.id, status.color)"
                title="Clique para mudar cor"
              />
              
              <!-- Nome (editável) -->
              <input
                v-if="editingStatusId === status.id"
                v-model="editingStatusName"
                type="text"
                class="flex-1 px-2 py-1 text-xs border border-primary-500 rounded focus:outline-none"
                @keyup.enter="saveEdit"
                @keyup.esc="cancelEdit"
                @click.stop
              />
              <span v-else class="flex-1 text-xs text-neutral-700 font-medium truncate">{{ status.name }}</span>
              
              <!-- Botão editar -->
              <button
                type="button"
                @click.stop="editingStatusId === status.id ? cancelEdit() : startEdit(status)"
                class="p-1 text-neutral-400 hover:text-neutral-600 text-xs flex-shrink-0"
              >
                ✎
              </button>
            </div>
          </div>

          <!-- Color picker para editar cor -->
          <div v-if="editingColorStatusId" class="px-3 py-2 border-t border-neutral-200 bg-white">
            <p class="text-xs font-medium text-neutral-700 mb-1">Cor:</p>
            <div class="grid grid-cols-8 gap-1">
              <button
                v-for="color in ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899']"
                :key="color"
                type="button"
                class="w-4 h-4 rounded border-2 transition-all"
                :class="editingStatusColor === color ? 'ring-2 ring-primary-500 scale-110' : 'border-neutral-300'"
                :style="{ backgroundColor: color }"
                @click="editingStatusColor = color; saveColorEdit()"
              />
            </div>
          </div>

          <!-- Formulário para criar novo status -->
          <div class="px-3 py-2 border-t border-neutral-200 bg-white">
            <p class="text-xs font-medium text-neutral-700 mb-1">Novo:</p>
            <input
              v-model="newStatusName"
              type="text"
              placeholder="Nome"
              class="w-full px-2 py-1 text-xs border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 mb-1"
              @keyup.enter="createNewStatus"
            />
            
            <!-- Color picker para novo status -->
            <div class="grid grid-cols-8 gap-1 mb-1">
              <button
                v-for="color in ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899']"
                :key="color"
                type="button"
                class="w-4 h-4 rounded border-2 transition-all"
                :class="newStatusColor === color ? 'ring-2 ring-primary-500 scale-110' : 'border-neutral-300'"
                :style="{ backgroundColor: color }"
                @click="newStatusColor = color"
              />
            </div>

            <button
              type="button"
              @click.stop="createNewStatus"
              :disabled="!newStatusName.trim()"
              class="w-full px-2 py-1 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Criar
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useTaskStatuses } from '~/composables/useTaskStatuses'
import { useBoardPermissions } from '~/composables/useBoardPermissions'
import { getIconForStatus } from '~/utils/statusIcons'

const props = defineProps<{ 
  taskId: string
  boardId: string
  statusId: string | null
  isSubtask?: boolean
}>()
const emit = defineEmits<{ (e: 'update:statusId', value: string | null): void }>()

const { statuses, loading, fetchStatuses, updateTaskStatus, createStatus, updateStatus, reorderStatuses } = useTaskStatuses(props.boardId)
const { canEdit: canEditTasks, fetchUserRole } = useBoardPermissions(props.boardId)

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const dropdownStyle = ref<Record<string, string>>({})
const showManager = ref(false)
const isMobile = ref(false)
const editingStatusId = ref<string | null>(null)
const editingStatusName = ref('')
const editingStatusColor = ref('')
const editingColorStatusId = ref<string | null>(null)
const newStatusName = ref('')
const newStatusColor = ref('#3b82f6')
const draggedStatusId = ref<string | null>(null)
const statusOrder = ref<string[]>([])

const currentStatus = computed(() =>
  props.statusId ? statuses.value.find(s => s.id === props.statusId) ?? null : null
)

const orderedStatuses = computed(() => {
  if (statusOrder.value.length === 0) return statuses.value
  return statusOrder.value
    .map(id => statuses.value.find(s => s.id === id))
    .filter(Boolean) as any[]
})

function calcPosition() {
  if (!rootRef.value) return
  
  isMobile.value = window.innerWidth < 768
  
  if (isMobile.value) {
    // Mobile: centralizar na tela com margem de 16px
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const dropdownWidth = viewportWidth - 32 // 16px margem em cada lado
    const dropdownHeight = Math.min(90 * viewportHeight / 100, 600) // 90vh ou 600px, o que for menor
    
    const left = 16 // 16px margem esquerda
    const top = (viewportHeight - dropdownHeight) / 2 // Centralizar verticalmente
    
    dropdownStyle.value = {
      top: `${Math.max(16, top)}px`,
      left: `${left}px`,
      width: `${dropdownWidth}px`,
      maxHeight: '90vh',
    }
  } else {
    // Desktop: posicionar perto do botão com altura máxima
    const rect = rootRef.value.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const spaceBelow = viewportHeight - rect.bottom
    const spaceAbove = rect.top
    const spaceRight = window.innerWidth - rect.left

    const dropdownWidth = 600
    const maxDropdownHeight = Math.min(600, viewportHeight - 32) // Máximo 600px ou altura da tela - 32px de margem

    // Decidir se abre para baixo ou para cima
    let top: number
    let maxHeight: number
    
    if (spaceBelow > 400 || spaceBelow > spaceAbove) {
      // Abrir para baixo
      top = rect.bottom + 4
      maxHeight = Math.min(maxDropdownHeight, spaceBelow - 16)
    } else {
      // Abrir para cima
      maxHeight = Math.min(maxDropdownHeight, spaceAbove - 16)
      top = rect.top - maxHeight - 4
    }

    const left = spaceRight >= dropdownWidth ? rect.left : rect.right - dropdownWidth

    dropdownStyle.value = {
      top: `${Math.max(8, top)}px`,
      left: `${Math.max(8, left)}px`,
      maxHeight: `${maxHeight}px`,
    }
  }
}

function toggleDropdown() {
  if (!canEditTasks.value) return
  
  // Se está fechando e houve reordenação, salvar
  if (open.value && statusOrder.value.length > 0) {
    const originalOrder = statuses.value.map(s => s.id).join(',')
    const newOrder = statusOrder.value.join(',')
    if (originalOrder !== newOrder) {
      reorderStatuses(statusOrder.value)
    }
  }
  
  open.value = !open.value
  if (open.value) {
    statusOrder.value = statuses.value.map(s => s.id)
    // Usar nextTick para garantir que o DOM foi atualizado
    nextTick(() => {
      calcPosition()
    })
  }
}

async function select(statusId: string | null) {
  if (!canEditTasks.value) return
  open.value = false
  if (statusId === props.statusId) return
  
  // Emit primeiro para atualização otimista
  emit('update:statusId', statusId)
  
  // Se for subtask, não salvar aqui - deixar o componente pai fazer
  if (props.isSubtask) {
    return
  }
  
  // Para tasks normais, salvar no banco
  try {
    await updateTaskStatus(props.taskId, statusId)
  } catch { /* silently fail */ }
}

function startEdit(status: any) {
  editingStatusId.value = status.id
  editingStatusName.value = status.name
  editingStatusColor.value = status.color
}

function startEditingColor(statusId: string, color: string) {
  editingColorStatusId.value = statusId
  editingStatusColor.value = color
}

async function saveColorEdit() {
  if (!editingColorStatusId.value) return
  
  const status = statuses.value.find(s => s.id === editingColorStatusId.value)
  if (status) {
    await updateStatus(editingColorStatusId.value, status.name, editingStatusColor.value)
    editingColorStatusId.value = null
  }
}

function cancelEdit() {
  editingStatusId.value = null
  editingStatusName.value = ''
  editingStatusColor.value = ''
}

async function saveEdit() {
  if (!editingStatusId.value || !editingStatusName.value.trim()) return
  
  const success = await updateStatus(editingStatusId.value, editingStatusName.value, editingStatusColor.value)
  if (success) {
    cancelEdit()
  }
}

async function createNewStatus() {
  if (!newStatusName.value.trim()) return
  
  const created = await createStatus(newStatusName.value, newStatusColor.value)
  if (created) {
    // Adicionar o novo status ao statusOrder para aparecer imediatamente
    statusOrder.value.push(created.id)
    newStatusName.value = ''
    newStatusColor.value = '#3b82f6'
  }
}

// Drag and drop
function startDrag(statusId: string) {
  draggedStatusId.value = statusId
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
}

function onDrop(targetStatusId: string) {
  if (!draggedStatusId.value || draggedStatusId.value === targetStatusId) {
    draggedStatusId.value = null
    return
  }

  const draggedIdx = statusOrder.value.indexOf(draggedStatusId.value as string)
  const targetIdx = statusOrder.value.indexOf(targetStatusId)

  if (draggedIdx !== -1 && targetIdx !== -1) {
    const newOrder = [...statusOrder.value]
    const [dragged] = newOrder.splice(draggedIdx, 1)
    if (dragged) {
      newOrder.splice(targetIdx, 0, dragged)
      statusOrder.value = newOrder
    }
  }

  draggedStatusId.value = null
}

function onClickOutside(e: MouseEvent) {
  if (!open.value) return
  const target = e.target as Node
  
  if (rootRef.value && rootRef.value.contains(target)) return
  if (dropdownRef.value && dropdownRef.value.contains(target)) return
  
  open.value = false
}

onMounted(() => { 
  fetchStatuses()
  fetchUserRole()
  document.addEventListener('mousedown', onClickOutside)
  window.addEventListener('resize', () => {
    if (open.value) calcPosition()
  })
})
onUnmounted(() => {
  document.removeEventListener('mousedown', onClickOutside)
  window.removeEventListener('resize', () => {
    if (open.value) calcPosition()
  })
})
</script>
