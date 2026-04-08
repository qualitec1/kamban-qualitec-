<template>
  <div class="relative" ref="rootRef">
    <!-- Overlay para mobile -->
    <div
      v-if="open && isMobile"
      class="fixed inset-0 bg-black/30 z-40 lg:hidden"
      @click="open = false"
    />
    
    <!-- Trigger -->
    <button
      type="button"
      @click="open = !open"
      class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-sm font-medium transition-colors bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
      :title="`${visibleCount} colunas visíveis`"
    >
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
      Colunas
    </button>

    <!-- Dropdown com checkboxes + drag to reorder (padrão Monday.com) -->
    <div
      v-if="open"
      class="fixed lg:absolute z-50 lg:top-full lg:right-0 lg:mt-1 w-[calc(100vw-16px)] max-w-[95vw] lg:w-56 bg-white border border-neutral-200 rounded-xl shadow-lg py-1.5 max-h-[70vh] overflow-y-auto"
      :class="isMobile ? 'inset-x-2 top-20' : ''"
      :style="isMobile ? {} : {}"
    >
      <p class="px-3 py-1.5 text-xs font-semibold text-neutral-400 uppercase tracking-wide">
        Colunas visíveis
      </p>
      <p class="px-3 pb-1.5 text-[10px] text-neutral-300">Arraste para reordenar</p>
      <div class="border-t border-neutral-100 mb-1" />

      <div
        v-for="col in orderedColumns"
        :key="col.key"
        draggable="true"
        class="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors cursor-default"
        :class="{ 'opacity-40': draggingKey === col.key, 'bg-primary-50': dragOverKey === col.key && draggingKey !== col.key }"
        @dragstart="onDragStart(col.key)"
        @dragover.prevent="onDragOver(col.key)"
        @drop="onDrop(col.key)"
        @dragend="onDragEnd"
      >
        <!-- Drag handle -->
        <span class="cursor-grab active:cursor-grabbing text-neutral-300 hover:text-neutral-500 shrink-0" title="Arrastar para reordenar">
          <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm8-16a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
          </svg>
        </span>

        <!-- Checkbox -->
        <button
          type="button"
          class="flex items-center gap-2 flex-1 text-left"
          @click="toggle(col.key)"
        >
          <span
            class="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors"
            :class="isVisible(col.key) ? 'bg-primary-600 border-primary-600' : 'border-neutral-300'"
          >
            <svg v-if="isVisible(col.key)" class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <span :class="isVisible(col.key) ? 'text-neutral-700' : 'text-neutral-400'">
            {{ col.label }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useBoardColumns, type ColumnKey } from '~/composables/useBoardColumns'

const props = defineProps<{ boardId: string }>()

const { toggle, isVisible, reorder, visibleCount, orderedColumns } = useBoardColumns(props.boardId)

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const isMobile = computed(() => typeof window !== 'undefined' && window.innerWidth < 1024)

// Drag state
const draggingKey = ref<ColumnKey | null>(null)
const dragOverKey = ref<ColumnKey | null>(null)

function onDragStart(key: ColumnKey) {
  draggingKey.value = key
}

function onDragOver(key: ColumnKey) {
  dragOverKey.value = key
}

function onDrop(key: ColumnKey) {
  if (draggingKey.value) reorder(draggingKey.value, key)
  draggingKey.value = null
  dragOverKey.value = null
}

function onDragEnd() {
  draggingKey.value = null
  dragOverKey.value = null
}

function onClickOutside(e: MouseEvent) {
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) open.value = false
}

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))
</script>
