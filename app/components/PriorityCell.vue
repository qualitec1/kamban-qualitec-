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
      <div
        v-if="open && canEditTasks"
        class="fixed z-[9999] w-[280px] bg-white border border-neutral-200 rounded-xl shadow-2xl overflow-hidden"
        :style="dropdownStyle"
      >
        <!-- Header -->
        <div class="px-4 py-3 border-b border-neutral-200 bg-neutral-50">
          <h3 class="text-sm font-semibold text-neutral-700">Prioridade</h3>
        </div>

        <!-- Lista de prioridades -->
        <div class="p-2 max-h-[400px] overflow-y-auto">
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
            @click="openPriorityManager"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Editar etiquetas
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTaskPriorities } from '~/composables/useTaskPriorities'
import { useBoardPermissions } from '~/composables/useBoardPermissions'

const props = defineProps<{ taskId: string; boardId: string; priorityId: string | null }>()
const emit = defineEmits<{ (e: 'update:priorityId', value: string | null): void }>()

const { priorities, loading, fetchPriorities, updateTaskPriority } = useTaskPriorities(props.boardId)
const { canEdit: canEditTasks, fetchUserRole } = useBoardPermissions(props.boardId)

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const dropdownStyle = ref<Record<string, string>>({})

const currentPriority = computed(() =>
  props.priorityId ? priorities.value.find(p => p.id === props.priorityId) ?? null : null
)

function calcPosition() {
  if (!rootRef.value) return
  const rect = rootRef.value.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom
  const spaceRight = window.innerWidth - rect.left

  const dropdownHeight = 400
  const dropdownWidth = 280

  const top = spaceBelow > dropdownHeight ? rect.bottom + 4 : rect.top - dropdownHeight - 4
  const left = spaceRight >= dropdownWidth ? rect.left : rect.right - dropdownWidth

  dropdownStyle.value = {
    top: `${Math.max(8, top)}px`,
    left: `${Math.max(8, left)}px`,
  }
}

function toggleDropdown() {
  if (!canEditTasks.value) return
  calcPosition()
  open.value = !open.value
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

function openPriorityManager() {
  open.value = false
  // TODO: Implementar modal de gerenciamento de prioridades
  console.log('Abrir gerenciador de prioridades')
}

function onClickOutside(e: MouseEvent) {
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) open.value = false
}

onMounted(() => { 
  fetchPriorities()
  fetchUserRole()
  document.addEventListener('mousedown', onClickOutside) 
})
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))
</script>
