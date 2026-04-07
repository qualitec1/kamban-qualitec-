<template>
  <div class="bg-white border border-neutral-200 rounded-xl overflow-hidden">

    <!-- Header da coleção -->
    <div
      class="flex items-center justify-between px-4 py-3 border-b border-neutral-100"
      :style="collection.color ? `border-left: 4px solid ${collection.color}` : ''"
    >
      <div class="flex items-center gap-2 min-w-0">
        <div
          class="w-3 h-3 rounded-full shrink-0"
          :style="`background: ${collection.color || '#6366f1'}`"
        />
        <h3 class="text-heading-sm font-semibold text-neutral-900 truncate">{{ collection.name }}</h3>
        <span class="text-micro text-muted shrink-0">{{ collection.boards.length }} quadro{{ collection.boards.length !== 1 ? 's' : '' }}</span>
      </div>

      <div v-if="canManage" class="flex items-center gap-1 shrink-0">
        <button
          @click="emit('add-board', collection.id)"
          class="p-1.5 text-muted hover:text-primary-600 transition-colors rounded-lg hover:bg-primary-50"
          title="Adicionar quadro"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          @click="emit('edit', collection.id)"
          class="p-1.5 text-muted hover:text-neutral-700 transition-colors rounded-lg hover:bg-neutral-100"
          title="Editar coleção"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          @click="emit('delete', collection.id)"
          class="p-1.5 text-muted hover:text-danger-600 transition-colors rounded-lg hover:bg-danger-50"
          title="Excluir coleção"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Descrição -->
    <p v-if="collection.description" class="px-4 pt-2 text-label-sm text-muted">
      {{ collection.description }}
    </p>

    <!-- Boards da coleção -->
    <div v-if="collection.boards.length > 0" class="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      <div
        v-for="board in collection.boards"
        :key="board.id"
        class="group flex items-center gap-3 p-3 bg-neutral-50 rounded-xl hover:bg-primary-50 hover:border-primary-200 border border-transparent transition-all cursor-pointer"
        @click="navigateTo(`/boards/${board.id}`)"
      >
        <div
          class="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center"
          :style="`background: ${board.cover_color || '#6366f1'}`"
        >
          <svg class="w-4 h-4 text-white/80" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6z" />
          </svg>
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-body-sm font-medium text-strong group-hover:text-primary-700 truncate transition-colors">{{ board.name }}</p>
          <p class="text-micro text-muted">{{ boardTypeLabel(board.board_type) }}</p>
        </div>
        <button
          v-if="canManage"
          @click.stop="emit('remove-board', collection.id, board.id)"
          class="p-1 text-muted hover:text-danger-600 opacity-0 group-hover:opacity-100 transition-all shrink-0"
          title="Remover da coleção"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Estado vazio -->
    <div v-else class="px-4 py-6 text-center">
      <p class="text-label-sm text-muted">Nenhum quadro nesta coleção.</p>
      <button
        v-if="canManage"
        @click="emit('add-board', collection.id)"
        class="mt-2 text-label-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
      >
        Adicionar quadro
      </button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { navigateTo } from '#imports'
import type { CollectionWithBoards } from '~/composables/useBoardCollections'

defineProps<{
  collection: CollectionWithBoards
  canManage: boolean
}>()

const emit = defineEmits<{
  edit: [id: string]
  delete: [id: string]
  'add-board': [collectionId: string]
  'remove-board': [collectionId: string, boardId: string]
}>()

function boardTypeLabel(type: string) {
  return { kanban: 'Kanban', scrum: 'Scrum', list: 'Lista' }[type] ?? type
}
</script>
