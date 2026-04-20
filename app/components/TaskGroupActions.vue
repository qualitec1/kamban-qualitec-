<template>
  <div class="flex items-center gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
    <!-- Compartilhar grupo por e-mail -->
    <button
      v-if="canEdit"
      @click="$emit('share')"
      class="p-1.5 text-muted hover:text-primary-600 rounded-lg hover:bg-primary-50 motion-interactive active-press"
      title="Compartilhar grupo por e-mail"
    >
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    </button>

    <!-- Adicionar grupo acima -->
    <button
      v-if="canEdit"
      @click="$emit('addBefore')"
      class="p-1.5 text-muted hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
      title="Adicionar grupo acima"
    >
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    </button>

    <!-- Adicionar grupo abaixo -->
    <button
      v-if="canEdit"
      @click="$emit('addAfter')"
      class="p-1.5 text-muted hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
      title="Adicionar grupo abaixo"
    >
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Renomear -->
    <button
      v-if="canEdit"
      @click="$emit('rename')"
      class="p-1.5 text-muted hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
      title="Renomear grupo"
    >
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    </button>

    <!-- Deletar (só se não for o único grupo) -->
    <button
      v-if="canEdit && !isOnlyGroup"
      @click="$emit('delete')"
      class="p-1.5 text-muted hover:text-danger-600 rounded-lg hover:bg-danger-50 transition-colors"
      title="Remover grupo"
    >
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  canEdit: boolean
  isOnlyGroup: boolean
}>()

defineEmits<{
  share: []
  addBefore: []
  addAfter: []
  rename: []
  delete: []
}>()
</script>
