<template>
  <div class="max-w-7xl mx-auto">

    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-heading-lg font-semibold text-neutral-900 mb-1">Coleções</h1>
        <p class="text-body text-muted">Agrupe quadros por tema, cliente ou setor</p>
      </div>
      <ClientOnly>
        <BaseButton v-if="canCreate" variant="primary" @click="showCreateModal = true">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nova coleção
        </BaseButton>
      </ClientOnly>
    </div>

    <LoadingState v-if="loading" message="Carregando coleções..." />
    <ErrorState v-else-if="error" :message="error" @retry="fetchCollections" />

    <!-- Banner de ajuda -->
    <ClientOnly>
      <div v-if="showHelp" class="mb-6 bg-indigo-50 border border-indigo-200 rounded-xl p-4">
        <div class="flex items-start justify-between gap-4">
          <div class="flex gap-3">
            <div class="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <p class="text-body-sm font-semibold text-indigo-900 mb-1">O que são Coleções?</p>
              <p class="text-label-sm text-indigo-700 mb-3">
                Coleções agrupam quadros relacionados num único lugar — por cliente, setor ou tema.
                Um quadro pode estar em várias coleções ao mesmo tempo, sem precisar ser movido.
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
                <div class="bg-white/60 rounded-lg p-3">
                  <p class="text-label-sm font-semibold text-indigo-800 mb-1">1. Crie uma coleção</p>
                  <p class="text-micro text-indigo-600">Clique em "Nova coleção", dê um nome e escolha uma cor.</p>
                </div>
                <div class="bg-white/60 rounded-lg p-3">
                  <p class="text-label-sm font-semibold text-indigo-800 mb-1">2. Adicione quadros</p>
                  <p class="text-micro text-indigo-600">Clique no "+" da coleção e selecione os quadros.</p>
                </div>
                <div class="bg-white/60 rounded-lg p-3">
                  <p class="text-label-sm font-semibold text-indigo-800 mb-1">3. Acesse rapidamente</p>
                  <p class="text-micro text-indigo-600">Clique em qualquer quadro dentro da coleção para abri-lo.</p>
                </div>
              </div>
              <p class="text-micro text-indigo-500">Exemplo: coleção "Cliente Qualitec" com os quadros "Comercial", "Suporte" e "Projetos".</p>
            </div>
          </div>
          <button @click="showHelp = false" class="p-1 text-indigo-400 hover:text-indigo-600 transition-colors shrink-0" title="Fechar">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </ClientOnly>

    <EmptyState
      v-if="!loading && !error && collections.length === 0"
      title="Nenhuma coleção criada"
      description="Crie coleções para agrupar quadros relacionados."
    >
      <BaseButton v-if="canCreate" variant="primary" @click="showCreateModal = true">
        Criar primeira coleção
      </BaseButton>
    </EmptyState>

    <!-- Lista de coleções -->
    <div v-if="!loading && !error && collections.length > 0" class="space-y-4">
      <BoardCollectionCard
        v-for="col in collections"
        :key="col.id"
        :collection="col"
        :can-manage="canCreate"
        @edit="openEdit"
        @delete="handleDelete"
        @add-board="openAddBoard"
        @remove-board="handleRemoveBoard"
      />
    </div>

    <!-- Modal criar/editar coleção -->
    <BaseModal v-model="showCreateModal" :title="editingId ? 'Editar coleção' : 'Nova coleção'" size="sm">
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <BaseInput
          v-model="form.name"
          label="Nome"
          placeholder="Ex: Clientes, Marketing, Projetos Internos"
          required
          :error="formError"
        />
        <div>
          <label class="text-label-md text-default block mb-1.5">Descrição <span class="text-muted">(opcional)</span></label>
          <textarea
            v-model="form.description"
            rows="2"
            placeholder="Descreva o propósito desta coleção..."
            class="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-body-sm text-strong placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all resize-none"
          />
        </div>
        <div>
          <label class="text-label-md text-default block mb-2">Cor</label>
          <div class="flex gap-2 flex-wrap">
            <button
              v-for="color in collectionColors"
              :key="color"
              type="button"
              @click="form.color = color"
              class="w-7 h-7 rounded-full border-2 transition-all"
              :style="`background: ${color}`"
              :class="form.color === color ? 'border-neutral-900 scale-110' : 'border-transparent'"
            />
          </div>
        </div>
        <div class="flex gap-3 justify-end pt-2">
          <BaseButton type="button" variant="ghost" @click="closeModal">Cancelar</BaseButton>
          <BaseButton type="submit" variant="primary" :disabled="saving">
            {{ saving ? 'Salvando...' : (editingId ? 'Salvar' : 'Criar') }}
          </BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Modal adicionar board à coleção -->
    <BaseModal v-model="showAddBoardModal" title="Adicionar quadro à coleção" size="sm">
      <div class="space-y-3">
        <p class="text-body-sm text-muted">Selecione um quadro para adicionar:</p>
        <div class="max-h-64 overflow-y-auto space-y-1">
          <button
            v-for="board in availableBoards"
            :key="board.id"
            @click="handleAddBoard(board.id)"
            class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 transition-colors text-left"
          >
            <div class="w-7 h-7 rounded-lg shrink-0" :style="`background: ${board.cover_color || '#6366f1'}`" />
            <div class="min-w-0">
              <p class="text-body-sm font-medium text-strong truncate">{{ board.name }}</p>
            </div>
          </button>
        </div>
        <p v-if="availableBoards.length === 0" class="text-label-sm text-muted text-center py-4">
          Todos os quadros já estão nesta coleção.
        </p>
      </div>
    </BaseModal>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBoardCollections } from '~/composables/useBoardCollections'
import { useBoards } from '~/composables/useBoards'
import { useAuth } from '~/composables/useAuth'

const { collections, loading, error, fetchCollections, createCollection, updateCollection, deleteCollection, addBoard, removeBoard } = useBoardCollections()
const { boards, fetchBoards } = useBoards()
const { isMaster, isCollaborator } = useAuth()

const canCreate = computed(() => isMaster.value || isCollaborator.value)

const showHelp = ref(true)
const showCreateModal = ref(false)
const showAddBoardModal = ref(false)
const editingId = ref<string | null>(null)
const addingToBoardId = ref<string | null>(null)
const saving = ref(false)
const formError = ref('')

const form = ref({ name: '', description: '', color: '#6366f1' })

const collectionColors = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f59e0b', '#10b981', '#06b6d4', '#64748b'
]

const availableBoards = computed(() => {
  if (!addingToBoardId.value) return []
  const col = collections.value.find(c => c.id === addingToBoardId.value)
  const existingIds = new Set(col?.boards.map(b => b.id) ?? [])
  return boards.value.filter(b => !existingIds.has(b.id))
})

function openEdit(id: string) {
  const col = collections.value.find(c => c.id === id)
  if (!col) return
  editingId.value = id
  form.value = { name: col.name, description: col.description ?? '', color: col.color ?? '#6366f1' }
  showCreateModal.value = true
}

function openAddBoard(collectionId: string) {
  addingToBoardId.value = collectionId
  showAddBoardModal.value = true
}

function closeModal() {
  showCreateModal.value = false
  editingId.value = null
  form.value = { name: '', description: '', color: '#6366f1' }
  formError.value = ''
}

async function handleSubmit() {
  if (!form.value.name.trim()) { formError.value = 'Nome obrigatório.'; return }
  saving.value = true
  formError.value = ''

  if (editingId.value) {
    await updateCollection(editingId.value, {
      name: form.value.name.trim(),
      description: form.value.description.trim() || undefined,
      color: form.value.color
    })
  } else {
    await createCollection({
      name: form.value.name.trim(),
      description: form.value.description.trim() || undefined,
      color: form.value.color
    })
  }

  saving.value = false
  closeModal()
}

async function handleDelete(id: string) {
  await deleteCollection(id)
}

async function handleAddBoard(boardId: string) {
  if (!addingToBoardId.value) return
  await addBoard(addingToBoardId.value, boardId)
  showAddBoardModal.value = false
  addingToBoardId.value = null
}

async function handleRemoveBoard(collectionId: string, boardId: string) {
  await removeBoard(collectionId, boardId)
}

onMounted(async () => {
  await Promise.all([fetchCollections(), fetchBoards()])
})
</script>
