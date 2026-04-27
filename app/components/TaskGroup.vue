<template>
  <div
    :data-group-id="group.id"
    class="bg-white border border-neutral-200 rounded-xl lg:rounded-xl rounded-lg transition-all overflow-hidden min-w-0"
    :class="{
      'opacity-40 scale-[0.98]': isDragging,
      'border-primary-400 border-2': isDragOver
    }"
    @dragover.prevent="$emit('dragOver', $event)"
    @drop="$emit('drop')"
  >
    <!-- Cabeçalho do grupo (estilo Monday.com) -->
    <div
      class="flex items-center gap-2 px-3 lg:px-4 py-2.5 lg:py-3 border-b border-neutral-200 group/header rounded-t-xl lg:rounded-t-xl rounded-t-lg overflow-hidden bg-neutral-50/50"
      :style="`border-left: 4px solid ${group.color || '#6366f1'}`"
    >
      <!-- Handle de drag (apenas desktop) -->
      <div
        v-if="canEdit"
        :draggable="true"
        class="hidden lg:block opacity-30 hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-0.5 text-muted shrink-0"
        title="Arrastar para reordenar grupo"
        @dragstart="$emit('dragStart')"
        @dragend="$emit('dragEnd')"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm8-16a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
        </svg>
      </div>

      <!-- Botão colapsar -->
      <button
        @click="$emit('toggleCollapse')"
        class="p-1 lg:p-0.5 text-muted hover:text-neutral-700 motion-interactive rounded active-press touch-manipulation"
      >
        <svg
          class="w-4 h-4 transition-transform"
          :class="group.is_collapsed ? '-rotate-90' : ''"
          fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <!-- Nome do grupo (editável inline) -->
      <input
        v-if="isEditing"
        :ref="el => { if (el) (el as HTMLInputElement).focus() }"
        :value="group.name"
        @blur="e => $emit('saveRename', (e.target as HTMLInputElement).value)"
        @keydown.enter="e => $emit('saveRename', (e.target as HTMLInputElement).value)"
        @keydown.esc="$emit('cancelRename')"
        class="flex-1 text-base lg:text-heading-sm font-semibold text-neutral-900 bg-transparent border-b border-primary-400 outline-none"
      />
      <span
        v-else
        class="flex-1 text-base lg:text-heading-sm font-semibold text-neutral-900 cursor-pointer hover:text-primary-600 transition-colors"
        @dblclick="canEdit && $emit('startRename')"
      >
        {{ group.name }}
      </span>

      <!-- Ações do grupo -->
      <TaskGroupActions
        :can-edit="canEdit"
        :is-only-group="isOnlyGroup"
        @share="$emit('share')"
        @add-before="$emit('addBefore')"
        @add-after="$emit('addAfter')"
        @rename="$emit('startRename')"
        @delete="$emit('delete')"
      />
    </div>

    <!-- Conteúdo do grupo (tarefas) -->
    <Transition name="expand">
      <div 
        v-if="!group.is_collapsed"
        class="overflow-x-auto scrollbar-thin"
        @dragover.prevent="$emit('dragOver', $event)"
        @drop="$emit('drop')"
      >
        <slot />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { Tables } from '#shared/types/database'

defineProps<{
  group: Tables<'task_groups'>
  canEdit: boolean
  isOnlyGroup: boolean
  isEditing: boolean
  isDragging: boolean
  isDragOver: boolean
}>()

defineEmits<{
  dragStart: []
  dragEnd: []
  dragOver: [e: DragEvent]
  drop: []
  toggleCollapse: []
  startRename: []
  saveRename: [name: string]
  cancelRename: []
  share: []
  addBefore: []
  addAfter: []
  delete: []
}>()
</script>

<style scoped>
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.scrollbar-thin::-webkit-scrollbar {
  height: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.3);
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 2000px;
  opacity: 1;
}
</style>
