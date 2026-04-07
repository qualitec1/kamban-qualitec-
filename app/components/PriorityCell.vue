<template>
  <div class="relative" ref="rootRef">
    <button
      type="button"
      class="flex items-center gap-1 h-full min-w-[80px] max-w-[140px] min-h-[44px]"
      @click="toggleDropdown"
      :title="currentPriority?.name ?? 'Sem prioridade'"
    >
      <template v-if="currentPriority">
        <span class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: currentPriority.color }" />
        <span class="text-xs font-medium truncate" :style="{ color: currentPriority.color }">
          {{ currentPriority.name }}
        </span>
      </template>
      <span v-else class="text-xs text-neutral-300">—</span>
    </button>

    <Teleport to="body">
      <div
        v-if="open"
        class="fixed z-[9999] w-44 bg-white border border-neutral-200 rounded-lg shadow-xl py-1 max-h-64 overflow-y-auto"
        :style="dropdownStyle"
      >
        <button
          type="button"
          class="w-full text-left px-3 py-2.5 text-xs text-neutral-500 hover:bg-neutral-50 transition-colors"
          @mousedown.prevent="select(null)"
        >
          Sem prioridade
        </button>
        <div class="border-t border-neutral-100 my-1" />
        <button
          v-for="priority in priorities"
          :key="priority.id"
          type="button"
          class="w-full text-left px-3 py-2.5 hover:bg-neutral-50 transition-colors flex items-center gap-2"
          @mousedown.prevent="select(priority.id)"
        >
          <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: priority.color }" />
          <span class="text-xs text-neutral-800 truncate">{{ priority.name }}</span>
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTaskPriorities } from '~/composables/useTaskPriorities'

const props = defineProps<{ taskId: string; boardId: string; priorityId: string | null }>()
const emit = defineEmits<{ (e: 'update:priorityId', value: string | null): void }>()

const { priorities, fetchPriorities, updateTaskPriority } = useTaskPriorities(props.boardId)
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
  const top = spaceBelow > 260 ? rect.bottom + 4 : rect.top - 264
  const left = spaceRight >= 176 ? rect.left : rect.right - 176
  dropdownStyle.value = { top: `${top}px`, left: `${Math.max(8, left)}px` }
}

function toggleDropdown() {
  calcPosition()
  open.value = !open.value
}

async function select(priorityId: string | null) {
  open.value = false
  if (priorityId === props.priorityId) return
  try {
    await updateTaskPriority(props.taskId, priorityId)
    emit('update:priorityId', priorityId)
  } catch { /* silently fail */ }
}

function onClickOutside(e: MouseEvent) {
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) open.value = false
}

onMounted(() => { fetchPriorities(); document.addEventListener('mousedown', onClickOutside) })
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))
</script>
