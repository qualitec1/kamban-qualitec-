<template>
  <div 
    class="flex items-start gap-3 p-2 rounded-lg hover:bg-neutral-50 transition-colors group"
    :class="{ 'opacity-60': subtask.is_done }"
  >
    <!-- Drag handle (apenas para editors) -->
    <button
      v-if="canDrag"
      type="button"
      class="drag-handle mt-1 p-1 text-neutral-400 hover:text-neutral-600 cursor-grab active:cursor-grabbing touch-none"
      aria-label="Arrastar para reordenar"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
      </svg>
    </button>

    <!-- Checkbox -->
    <input
      type="checkbox"
      :checked="subtask.is_done"
      :disabled="!canEdit"
      class="mt-1 w-5 h-5 rounded border-neutral-300 text-primary-500 focus:ring-2 focus:ring-primary-400 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
      :aria-label="`Marcar '${subtask.title}' como ${subtask.is_done ? 'não concluída' : 'concluída'}`"
      @change="$emit('toggle', subtask.id, !subtask.is_done)"
    />

    <!-- Título editável -->
    <div class="flex-1 min-w-0">
      <input
        v-if="isEditing"
        ref="editInput"
        v-model="editTitle"
        type="text"
        class="w-full text-sm border border-primary-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-400"
        @blur="saveEdit"
        @keydown.enter.prevent="saveEdit"
        @keydown.esc.prevent="cancelEdit"
      />
      <p
        v-else
        class="text-sm text-neutral-700 cursor-text select-none"
        :class="{ 'line-through text-neutral-400': subtask.is_done }"
        @click="canEdit && startEdit()"
      >
        {{ subtask.title }}
      </p>
    </div>

    <!-- Botão de exclusão -->
    <button
      v-if="canEdit"
      type="button"
      class="opacity-0 group-hover:opacity-100 sm:opacity-100 p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
      aria-label="Excluir subtarefa"
      @click="confirmDelete"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  </div>

  <!-- Modal de confirmação de exclusão -->
  <BaseModal v-model="showDeleteConfirm" title="Excluir subitem?" size="sm" :close-on-backdrop="false">
    <div class="space-y-4">
      <p class="text-sm text-neutral-600">
        Tem certeza que deseja excluir o subitem <span class="font-semibold">"{{ subtask.title }}"</span>?
      </p>
      <p class="text-sm text-neutral-500">
        Esta ação não pode ser desfeita.
      </p>
    </div>

    <template #footer>
      <BaseButton variant="ghost" @click="showDeleteConfirm = false">Cancelar</BaseButton>
      <BaseButton variant="danger" @click="handleDelete">Excluir</BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import type { Tables } from '~/shared/types/database'

type Subtask = Tables<'subtasks'>

const props = defineProps<{
  subtask: Subtask
  canEdit: boolean
  canDrag?: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle', id: string, isDone: boolean): void
  (e: 'update', id: string, title: string): void
  (e: 'delete', id: string): void
}>()

const isEditing = ref(false)
const editTitle = ref('')
const editInput = ref<HTMLInputElement | null>(null)
const showDeleteConfirm = ref(false)

function startEdit() {
  if (!props.canEdit) return
  editTitle.value = props.subtask.title
  isEditing.value = true
  nextTick(() => {
    editInput.value?.focus()
    editInput.value?.select()
  })
}

function saveEdit() {
  const title = editTitle.value.trim()
  if (!title || title === props.subtask.title) {
    cancelEdit()
    return
  }
  emit('update', props.subtask.id, title)
  isEditing.value = false
}

function cancelEdit() {
  isEditing.value = false
  editTitle.value = ''
}

function confirmDelete() {
  showDeleteConfirm.value = true
}

function handleDelete() {
  emit('delete', props.subtask.id)
  showDeleteConfirm.value = false
}
</script>
