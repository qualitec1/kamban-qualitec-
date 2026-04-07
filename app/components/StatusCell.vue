<template>
  <div class="relative" ref="rootRef">
    <button
      type="button"
      class="flex items-center h-full min-w-[80px] max-w-[140px] min-h-[44px]"
      @click="toggleDropdown"
      :title="currentStatus?.name ?? 'Sem status'"
    >
      <StatusBadge v-if="currentStatus" :status="currentStatus" />
      <span v-else class="text-xs text-neutral-300 italic">—</span>
    </button>

    <!-- Teleport para body — evita ser cortado por overflow:hidden dos pais -->
    <Teleport to="body">
      <div
        v-if="open"
        class="fixed z-[9999] w-48 bg-white border border-neutral-200 rounded-lg shadow-xl py-1 max-h-64 overflow-y-auto"
        :style="dropdownStyle"
      >
        <button
          type="button"
          class="w-full text-left px-3 py-2.5 text-xs text-neutral-500 hover:bg-neutral-50 transition-colors"
          @mousedown.prevent="select(null)"
        >
          Sem status
        </button>
        <div class="border-t border-neutral-100 my-1" />
        <button
          v-for="status in statuses"
          :key="status.id"
          type="button"
          class="w-full text-left px-3 py-2.5 hover:bg-neutral-50 transition-colors flex items-center gap-2"
          @mousedown.prevent="select(status.id)"
        >
          <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: status.color }" />
          <span class="text-xs text-neutral-800 truncate">{{ status.name }}</span>
        </button>
        <div v-if="statuses.length === 0 && !loading" class="px-3 py-2 text-xs text-neutral-400">
          Nenhum status configurado
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTaskStatuses } from '~/composables/useTaskStatuses'

const props = defineProps<{ taskId: string; boardId: string; statusId: string | null }>()
const emit = defineEmits<{ (e: 'update:statusId', value: string | null): void }>()

const { statuses, loading, fetchStatuses, updateTaskStatus } = useTaskStatuses(props.boardId)
const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const dropdownStyle = ref<Record<string, string>>({})

const currentStatus = computed(() =>
  props.statusId ? statuses.value.find(s => s.id === props.statusId) ?? null : null
)

function calcPosition() {
  if (!rootRef.value) return
  const rect = rootRef.value.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom
  const spaceRight = window.innerWidth - rect.left

  const top = spaceBelow > 260 ? rect.bottom + 4 : rect.top - 264
  const left = spaceRight >= 192 ? rect.left : rect.right - 192

  dropdownStyle.value = {
    top: `${top}px`,
    left: `${Math.max(8, left)}px`,
  }
}

function toggleDropdown() {
  calcPosition()
  open.value = !open.value
}

async function select(statusId: string | null) {
  open.value = false
  if (statusId === props.statusId) return
  try {
    await updateTaskStatus(props.taskId, statusId)
    emit('update:statusId', statusId)
  } catch { /* silently fail */ }
}

function onClickOutside(e: MouseEvent) {
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) open.value = false
}

onMounted(() => { fetchStatuses(); document.addEventListener('mousedown', onClickOutside) })
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))
</script>
