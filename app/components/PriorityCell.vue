<template>
  <div class="relative" ref="rootRef">
    <!-- Botão de prioridade estilo Monday.com -->
    <button
      v-if="canEditTasks"
      type="button"
      class="w-full min-w-[120px] max-w-[200px] px-4 py-2.5 rounded-lg text-sm font-medium text-white text-center transition-all hover:opacity-90 min-h-[44px] lg:min-h-[36px]"
      :style="{ backgroundColor: currentPriority?.color || '#94a3b8' }"
      @click="toggleDropdown"
    >
      {{ currentPriority?.name || 'Sem prioridade' }}
    </button>

    <!-- Read-only view (sem permissão) -->
    <div
      v-else
      class="w-full min-w-[120px] max-w-[200px] px-4 py-2.5 rounded-lg text-sm font-medium text-white text-center cursor-default min-h-[44px] lg:min-h-[36px]"
      :style="{ backgroundColor: currentPriority?.color || '#94a3b8' }"
    >
      {{ currentPriority?.name || 'Sem prioridade' }}
    </div>

    <!-- Dropdown estilo Monday.com -->
    <Teleport to="body">
      <!-- Overlay para mobile -->
      <div
        v-if="open && canEditTasks && isMobile"
        class="fixed inset-0 bg-black/30 z-[9998]"
        @click="open = false"
      />
      
      <!-- Dropdown -->
      <div
        v-if="open && canEditTasks"
        ref="dropdownRef"
        class="fixed z-[9999] bg-white border border-neutral-200 rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
        :class="isMobile ? 'w-[calc(100vw-32px)] max-h-[90vh]' : 'w-[600px]'"
        :style="dropdownStyle"
      >
        <!-- Painel esquerdo - Seleção de prioridades -->
        <div class="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-neutral-200 flex flex-col">
          <!-- Header -->
          <div class="px-4 py-3 border-b border-neutral-200 bg-neutral-50">
            <h3 class="text-sm font-semibold text-neutral-700">Prioridade</h3>
          </div>

          <!-- Lista de prioridades (sempre visível) -->
          <div class="p-2 max-h-[300px] overflow-y-auto flex-1">
            <!-- Sem prioridade -->
            <button
              type="button"
              class="w-full px-4 py-3 rounded-lg text-sm font-medium text-white text-center transition-all hover:opacity-90 mb-2"
              style="background-color: #94a3b8"
              @mousedown.prevent="select(null)"
            >
              Sem prioridade
            </button>

            <!-- Prioridades disponíveis -->
            <button
              v-for="priority in priorities"
              :key="priority.id"
              type="button"
              class="w-full px-4 py-3 rounded-lg text-sm font-medium text-white text-center transition-all hover:opacity-90 mb-2"
              :style="{ backgroundColor: priority.color }"
              @mousedown.prevent="select(priority.id)"
            >
              {{ priority.name }}
            </button>

            <!-- Estado vazio -->
            <div v-if="priorities.length === 0 && !loading" class="px-4 py-6 text-center">
              <p class="text-sm text-neutral-400">Nenhuma prioridade configurada</p>
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
            <h4 class="text-sm font-semibold text-neutral-700">Gerenciar Prioridades</h4>
          </div>

          <!-- Conteúdo do gerenciador -->
          <div class="flex-1 overflow-y-auto p-3 space-y-2">
            <!-- Lista de prioridades editáveis -->
            <div
              v-for="priority in orderedPriorities"
              :key="priority.id"
              class="flex items-center gap-2 p-2 rounded-lg border border-neutral-200 hover:border-neutral-300 bg-white transition-colors"
              draggable="true"
              @dragstart="startDrag(priority.id)"
              @dragover="onDragOver"
              @drop="onDrop(priority.id)"
            >
              <!-- Drag handle -->
              <div class="cursor-move text-neutral-300 hover:text-neutral-400 text-xs">⋮⋮</div>

              <!-- Ícone de cor (clicável para mudar) -->
              <button
                type="button"
                class="w-5 h-5 rounded flex-shrink-0 hover:opacity-80 transition-opacity"
                :style="{ backgroundColor: priority.color }"
                @click.stop="startEditingColor(priority.id, priority.color)"
                title="Clique para mudar cor"
              />
              
              <!-- Nome (editável) -->
              <input
                v-if="editingPriorityId === priority.id"
                v-model="editingPriorityName"
                type="text"
                class="flex-1 px-2 py-1 text-xs border border-primary-500 rounded focus:outline-none"
                @keyup.enter="saveEdit"
                @keyup.esc="cancelEdit"
                @click.stop
              />
              <span v-else class="flex-1 text-xs text-neutral-700 font-medium truncate">{{ priority.name }}</span>
              
              <!-- Botão editar -->
              <button
                type="button"
                @click.stop="editingPriorityId === priority.id ? cancelEdit() : startEdit(priority)"
                class="p-1 text-neutral-400 hover:text-neutral-600 text-xs flex-shrink-0"
              >
                ✎
              </button>
            </div>
          </div>

          <!-- Color picker para editar cor -->
          <div v-if="editingColorPriorityId" class="px-3 py-2 border-t border-neutral-200 bg-white">
            <p class="text-xs font-medium text-neutral-700 mb-1">Cor:</p>
            <div class="grid grid-cols-8 gap-1">
              <button
                v-for="color in ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899']"
                :key="color"
                type="button"
                class="w-4 h-4 rounded border-2 transition-all"
                :class="editingPriorityColor === color ? 'ring-2 ring-primary-500 scale-110' : 'border-neutral-300'"
                :style="{ backgroundColor: color }"
                @click="editingPriorityColor = color; saveColorEdit()"
              />
            </div>
          </div>

          <!-- Formulário para criar nova prioridade -->
          <div class="px-3 py-2 border-t border-neutral-200 bg-white">
            <p class="text-xs font-medium text-neutral-700 mb-1">Novo:</p>
            <input
              v-model="newPriorityName"
              type="text"
              placeholder="Nome"
              class="w-full px-2 py-1 text-xs border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 mb-1"
              @keyup.enter="createNewPriority"
            />
            
            <!-- Color picker para nova prioridade -->
            <div class="grid grid-cols-8 gap-1 mb-1">
              <button
                v-for="color in ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899']"
                :key="color"
                type="button"
                class="w-4 h-4 rounded border-2 transition-all"
                :class="newPriorityColor === color ? 'ring-2 ring-primary-500 scale-110' : 'border-neutral-300'"
                :style="{ backgroundColor: color }"
                @click="newPriorityColor = color"
              />
            </div>

            <button
              type="button"
              @click.stop="createNewPriority"
              :disabled="!newPriorityName.trim()"
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
import { useTaskPriorities } from '~/composables/useTaskPriorities'
import { useBoardPermissions } from '~/composables/useBoardPermissions'
import { getIconForPriority } from '~/utils/statusIcons'

const props = defineProps<{ taskId: string; boardId: string; priorityId: string | null }>()
const emit = defineEmits<{ (e: 'update:priorityId', value: string | null): void }>()

const { priorities, loading, fetchPriorities, updateTaskPriority, createPriority, updatePriority, reorderPriorities } = useTaskPriorities(props.boardId)
const { canEdit: canEditTasks, fetchUserRole } = useBoardPermissions(props.boardId)

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const dropdownStyle = ref<Record<string, string>>({})
const showManager = ref(false)
const isMobile = ref(false)
const editingPriorityId = ref<string | null>(null)
const editingPriorityName = ref('')
const editingPriorityColor = ref('')
const editingColorPriorityId = ref<string | null>(null)
const newPriorityName = ref('')
const newPriorityColor = ref('#3b82f6')
const draggedPriorityId = ref<string | null>(null)
const priorityOrder = ref<string[]>([])

const currentPriority = computed(() =>
  props.priorityId ? priorities.value.find(p => p.id === props.priorityId) ?? null : null
)

const orderedPriorities = computed(() => {
  if (priorityOrder.value.length === 0) return priorities.value
  return priorityOrder.value
    .map(id => priorities.value.find(p => p.id === id))
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
    // Desktop: posicionar perto do botão
    const rect = rootRef.value.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceRight = window.innerWidth - rect.left

    const dropdownHeight = 400
    const dropdownWidth = 600

    const top = spaceBelow > dropdownHeight ? rect.bottom + 4 : rect.top - dropdownHeight - 4
    const left = spaceRight >= dropdownWidth ? rect.left : rect.right - dropdownWidth

    dropdownStyle.value = {
      top: `${Math.max(8, top)}px`,
      left: `${Math.max(8, left)}px`,
    }
  }
}

function toggleDropdown() {
  if (!canEditTasks.value) return
  
  // Se está fechando e houve reordenação, salvar
  if (open.value && priorityOrder.value.length > 0) {
    const originalOrder = priorities.value.map(p => p.id).join(',')
    const newOrder = priorityOrder.value.join(',')
    if (originalOrder !== newOrder) {
      reorderPriorities(priorityOrder.value)
    }
  }
  
  open.value = !open.value
  if (open.value) {
    priorityOrder.value = priorities.value.map(p => p.id)
    // Usar nextTick para garantir que o DOM foi atualizado
    nextTick(() => {
      calcPosition()
    })
  }
}

async function select(priorityId: string | null) {
  if (!canEditTasks.value) return
  open.value = false
  if (priorityId === props.priorityId) return
  try {
    await updateTaskPriority(props.taskId, priorityId)
    emit('update:priorityId', priorityId)
  } catch { /* silently fail */ }
}

function startEdit(priority: any) {
  editingPriorityId.value = priority.id
  editingPriorityName.value = priority.name
  editingPriorityColor.value = priority.color
}

function startEditingColor(priorityId: string, color: string) {
  editingColorPriorityId.value = priorityId
  editingPriorityColor.value = color
}

async function saveColorEdit() {
  if (!editingColorPriorityId.value) return
  
  const priority = priorities.value.find(p => p.id === editingColorPriorityId.value)
  if (priority) {
    await updatePriority(editingColorPriorityId.value, priority.name, editingPriorityColor.value)
    editingColorPriorityId.value = null
  }
}

function cancelEdit() {
  editingPriorityId.value = null
  editingPriorityName.value = ''
  editingPriorityColor.value = ''
}

async function saveEdit() {
  if (!editingPriorityId.value || !editingPriorityName.value.trim()) return
  
  const success = await updatePriority(editingPriorityId.value, editingPriorityName.value, editingPriorityColor.value)
  if (success) {
    cancelEdit()
  }
}

async function createNewPriority() {
  if (!newPriorityName.value.trim()) return
  
  const created = await createPriority(newPriorityName.value, newPriorityColor.value)
  if (created) {
    newPriorityName.value = ''
    newPriorityColor.value = '#3b82f6'
  }
}

// Drag and drop
function startDrag(priorityId: string) {
  draggedPriorityId.value = priorityId
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
}

function onDrop(targetPriorityId: string) {
  if (!draggedPriorityId.value || draggedPriorityId.value === targetPriorityId) {
    draggedPriorityId.value = null
    return
  }

  const draggedIdx = priorityOrder.value.indexOf(draggedPriorityId.value as string)
  const targetIdx = priorityOrder.value.indexOf(targetPriorityId)

  if (draggedIdx !== -1 && targetIdx !== -1) {
    const newOrder = [...priorityOrder.value]
    const [dragged] = newOrder.splice(draggedIdx, 1)
    if (dragged) {
      newOrder.splice(targetIdx, 0, dragged)
      priorityOrder.value = newOrder
    }
  }

  draggedPriorityId.value = null
}

function onClickOutside(e: MouseEvent) {
  if (!open.value) return
  const target = e.target as Node
  
  if (rootRef.value && rootRef.value.contains(target)) return
  if (dropdownRef.value && dropdownRef.value.contains(target)) return
  
  open.value = false
}

onMounted(() => { 
  fetchPriorities()
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
