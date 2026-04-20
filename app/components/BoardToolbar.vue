<template>
  <ClientOnly>
    <div class="flex items-center gap-2">
      <!-- Toggle view mode -->
      <div class="flex items-center bg-neutral-100 rounded-lg p-0.5">
        <button
          @click="$emit('update:viewMode', 'horizontal')"
          :class="[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-label-sm font-medium transition-all',
            viewMode === 'horizontal'
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          ]"
          title="Visualização horizontal (tabela)"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Tabela
        </button>
        <button
          @click="$emit('update:viewMode', 'vertical')"
          :class="[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-label-sm font-medium transition-all',
            viewMode === 'vertical'
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          ]"
          title="Visualização vertical (Kanban)"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
          Kanban
        </button>
      </div>

      <ColumnVisibilityMenu v-if="viewMode === 'horizontal'" :board-id="boardId" />

      <!-- Toggle tarefas arquivadas -->
      <button
        @click="$emit('toggleArchived')"
        :title="showArchived ? 'Mostrar tarefas ativas' : 'Mostrar tarefas arquivadas'"
        :class="[
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-sm font-medium transition-colors',
          showArchived
            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
        ]"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
        {{ showArchived ? 'Arquivadas' : 'Arquivo' }}
      </button>

      <!-- Toggle grupos vazios -->
      <button
        @click="$emit('toggleEmptyGroups')"
        :title="showEmptyGroups ? 'Ocultar grupos vazios' : 'Mostrar grupos vazios'"
        :class="[
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-sm font-medium transition-colors',
          showEmptyGroups
            ? 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
        ]"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
        </svg>
        {{ showEmptyGroups ? 'Ocultar vazios' : 'Mostrar vazios' }}
      </button>

      <BaseButton v-if="canEdit" variant="primary" size="sm" @click="$emit('addGroup')">
        <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Novo grupo
      </BaseButton>

      <!-- Botão excluir quadro -->
      <button
        v-if="canEdit"
        @click="$emit('deleteBoard')"
        title="Excluir quadro"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-sm font-medium text-danger-600 hover:bg-danger-50 transition-colors"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Excluir
      </button>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
defineProps<{
  boardId: string
  viewMode: 'horizontal' | 'vertical'
  showArchived: boolean
  showEmptyGroups: boolean
  canEdit: boolean
}>()

defineEmits<{
  'update:viewMode': [mode: 'horizontal' | 'vertical']
  toggleArchived: []
  toggleEmptyGroups: []
  addGroup: []
  deleteBoard: []
}>()
</script>
