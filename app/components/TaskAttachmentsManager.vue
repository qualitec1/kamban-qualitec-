<template>
  <div class="space-y-4">
    <!-- Header com botão de upload -->
    <div class="flex items-center justify-between">
      <h4 class="text-xs font-semibold text-neutral-700 uppercase tracking-wide">
        Anexos
        <span v-if="count > 0" class="ml-1.5 text-neutral-400">({{ count }})</span>
      </h4>
      
      <button
        v-if="canEdit"
        @click="triggerFileInput"
        :disabled="uploading"
        class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Adicionar arquivo
      </button>
    </div>

    <!-- Input de arquivo (oculto) -->
    <input
      ref="fileInputRef"
      type="file"
      multiple
      class="hidden"
      @change="handleFileSelect"
      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
    />

    <!-- Progress de uploads -->
    <div v-if="uploadProgress.length > 0" class="space-y-2">
      <div
        v-for="progress in uploadProgress"
        :key="progress.fileName"
        class="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg"
      >
        <div class="flex-1 min-w-0">
          <p class="text-xs font-medium text-neutral-700 truncate">{{ progress.fileName }}</p>
          <div class="mt-1 w-full bg-neutral-200 rounded-full h-1.5">
            <div
              class="h-1.5 rounded-full transition-all"
              :class="{
                'bg-primary-500': progress.status === 'uploading',
                'bg-green-500': progress.status === 'success',
                'bg-red-500': progress.status === 'error'
              }"
              :style="`width: ${progress.progress}%`"
            />
          </div>
          <p v-if="progress.error" class="text-xs text-red-600 mt-0.5">{{ progress.error }}</p>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="w-5 h-5 rounded-full border-2 border-primary-400 border-t-transparent animate-spin" />
    </div>

    <!-- Lista de anexos agrupados por categoria -->
    <div v-else-if="attachmentsByCategory.length > 0" class="space-y-4">
      <div
        v-for="group in attachmentsByCategory"
        :key="group.category || 'uncategorized'"
        class="space-y-2"
      >
        <!-- Categoria -->
        <div class="flex items-center gap-2">
          <h5 class="text-xs font-medium text-neutral-600">
            {{ group.category || 'Sem categoria' }}
          </h5>
          <div class="flex-1 h-px bg-neutral-200" />
        </div>

        <!-- Arquivos da categoria -->
        <div class="space-y-1">
          <div
            v-for="(attachment, index) in group.attachments"
            :key="attachment.id"
            :data-attachment-id="attachment.id"
            :draggable="canEdit"
            class="group flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 transition-colors cursor-move"
            :class="{
              'opacity-40 scale-[0.98]': draggingId === attachment.id,
              'border-2 border-primary-400 bg-primary-50': dragOverId === attachment.id && draggingId !== attachment.id
            }"
            @dragstart="onDragStart($event, attachment.id, group.category)"
            @dragover="onDragOver($event, attachment.id, group.category)"
            @drop="onDrop(attachment.id, group.category)"
            @dragend="onDragEnd"
            @touchstart.passive="onTouchStart($event, attachment.id, group.category, index)"
            @touchmove.prevent="onTouchMove"
            @touchend="onTouchEnd"
          >
            <!-- Handle de drag (visível no hover em desktop, sempre visível em mobile) -->
            <div
              v-if="canEdit"
              class="shrink-0 touch-none"
              :class="isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
            >
              <svg class="w-4 h-4 text-neutral-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm8-16a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
              </svg>
            </div>

            <!-- Ícone do tipo de arquivo -->
            <div class="shrink-0">
              <svg
                v-if="isImage(attachment.mime_type)"
                class="w-5 h-5 text-blue-500"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <svg
                v-else-if="isPDF(attachment.mime_type)"
                class="w-5 h-5 text-red-500"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <svg
                v-else
                class="w-5 h-5 text-neutral-400"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </div>

            <!-- Info do arquivo -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-neutral-800 truncate">
                {{ attachment.file_name }}
              </p>
              <div class="flex items-center gap-2 mt-0.5">
                <span class="text-xs text-neutral-400">
                  {{ formatFileSize(attachment.size_bytes) }}
                </span>
                <span v-if="attachment.description" class="text-xs text-neutral-500">
                  • {{ attachment.description }}
                </span>
              </div>
            </div>

            <!-- Ações -->
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                @click="downloadFile(attachment)"
                class="p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-neutral-400 hover:text-primary-600 rounded transition-colors"
                title="Baixar"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
              <button
                v-if="canEdit"
                @click="confirmDelete(attachment)"
                class="p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-neutral-400 hover:text-red-600 rounded transition-colors"
                title="Excluir"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="flex flex-col items-center justify-center py-8 text-center">
      <svg class="w-10 h-10 text-neutral-300 mb-2" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
      </svg>
      <p class="text-sm text-neutral-500">Nenhum anexo</p>
      <button
        v-if="canEdit"
        @click="triggerFileInput"
        class="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium"
      >
        Adicionar primeiro arquivo
      </button>
    </div>

    <!-- Modal de confirmação de exclusão -->
    <BaseModal v-model="showDeleteModal" title="Excluir anexo" size="sm">
      <div class="space-y-4">
        <p class="text-sm text-neutral-600">
          Tem certeza que deseja excluir o arquivo
          <span class="font-medium text-neutral-900">{{ attachmentToDelete?.file_name }}</span>?
        </p>
        <p class="text-xs text-neutral-500">
          Esta ação não pode ser desfeita.
        </p>
        <div class="flex gap-3 justify-end pt-2">
          <BaseButton variant="ghost" @click="showDeleteModal = false">
            Cancelar
          </BaseButton>
          <BaseButton variant="danger" @click="handleDelete" :disabled="deleting">
            {{ deleting ? 'Excluindo...' : 'Excluir' }}
          </BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- Modal de categorização -->
    <BaseModal v-model="showCategoryModal" title="Adicionar arquivos" size="md">
      <form @submit.prevent="handleUpload" class="space-y-4">
        <div>
          <label class="text-xs font-medium text-neutral-700 block mb-2">
            Categoria/Tópico (opcional)
          </label>
          <BaseInput
            v-model="uploadCategory"
            placeholder="Ex: Documentos, Imagens, Contratos"
            list="categories"
          />
          <datalist id="categories">
            <option value="Documentos" />
            <option value="Imagens" />
            <option value="Contratos" />
            <option value="Planilhas" />
            <option value="Apresentações" />
          </datalist>
        </div>

        <div>
          <label class="text-xs font-medium text-neutral-700 block mb-2">
            Descrição (opcional)
          </label>
          <BaseInput
            v-model="uploadDescription"
            placeholder="Breve descrição do arquivo"
          />
        </div>

        <div class="bg-neutral-50 rounded-lg p-3">
          <p class="text-xs font-medium text-neutral-700 mb-2">
            Arquivos selecionados:
          </p>
          <ul class="space-y-1">
            <li
              v-for="(file, index) in selectedFiles"
              :key="index"
              class="text-xs text-neutral-600 flex items-center gap-2"
            >
              <svg class="w-3 h-3 text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              {{ file.name }} ({{ formatFileSize(file.size) }})
            </li>
          </ul>
        </div>

        <div class="flex gap-3 justify-end pt-2">
          <BaseButton type="button" variant="ghost" @click="cancelUpload">
            Cancelar
          </BaseButton>
          <BaseButton type="submit" variant="primary" :disabled="uploading">
            {{ uploading ? 'Enviando...' : 'Enviar arquivos' }}
          </BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTaskAttachments, type TaskAttachment } from '~/composables/useTaskAttachments'
import { useBoardPermissions } from '~/composables/useBoardPermissions'

const props = defineProps<{
  taskId: string
  boardId: string
}>()

const {
  attachments,
  count,
  loading,
  uploading,
  uploadProgress,
  fetchAttachments,
  uploadFile,
  deleteAttachment,
  getDownloadUrl,
  reorderAttachments
} = useTaskAttachments(props.taskId)

const { canEdit, fetchUserRole } = useBoardPermissions(props.boardId)

const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedFiles = ref<File[]>([])
const showCategoryModal = ref(false)
const uploadCategory = ref('')
const uploadDescription = ref('')

const showDeleteModal = ref(false)
const attachmentToDelete = ref<TaskAttachment | null>(null)
const deleting = ref(false)

// Drag and drop state
const draggingId = ref<string | null>(null)
const dragOverId = ref<string | null>(null)
const draggingCategory = ref<string | null>(null)

// Touch drag and drop
let touchDraggingId: string | null = null
let touchDraggingCategory: string | null = null
let touchStartY = 0
let touchStartIndex = 0

// Detectar mobile
const isMobile = ref(false)

// Agrupar anexos por categoria
const attachmentsByCategory = computed(() => {
  const groups = new Map<string, TaskAttachment[]>()
  
  attachments.value.forEach(attachment => {
    const category = attachment.category || ''
    if (!groups.has(category)) {
      groups.set(category, [])
    }
    groups.get(category)!.push(attachment)
  })

  return Array.from(groups.entries())
    .map(([category, attachments]) => ({
      category,
      // Ordenar anexos dentro da categoria por sort_order (criar novo array)
      attachments: [...attachments].sort((a, b) => a.sort_order - b.sort_order)
    }))
    .sort((a, b) => {
      // Sem categoria vai pro final
      if (!a.category) return 1
      if (!b.category) return -1
      return a.category.localeCompare(b.category)
    })
})

function triggerFileInput() {
  fileInputRef.value?.click()
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  selectedFiles.value = Array.from(input.files)
  showCategoryModal.value = true
}

async function handleUpload() {
  if (selectedFiles.value.length === 0) return

  for (const file of selectedFiles.value) {
    await uploadFile(
      file,
      uploadCategory.value.trim() || undefined,
      uploadDescription.value.trim() || undefined
    )
  }

  // Limpar e fechar
  selectedFiles.value = []
  uploadCategory.value = ''
  uploadDescription.value = ''
  showCategoryModal.value = false
  
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }

  // Recarregar lista
  await fetchAttachments()
}

function cancelUpload() {
  selectedFiles.value = []
  uploadCategory.value = ''
  uploadDescription.value = ''
  showCategoryModal.value = false
  
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function confirmDelete(attachment: TaskAttachment) {
  attachmentToDelete.value = attachment
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!attachmentToDelete.value) return

  deleting.value = true
  const success = await deleteAttachment(attachmentToDelete.value.id)
  deleting.value = false

  if (success) {
    showDeleteModal.value = false
    attachmentToDelete.value = null
  }
}

async function downloadFile(attachment: TaskAttachment) {
  const url = await getDownloadUrl(attachment.file_path)
  if (url) {
    window.open(url, '_blank')
  }
}

function isImage(mimeType: string | null): boolean {
  return mimeType?.startsWith('image/') ?? false
}

function isPDF(mimeType: string | null): boolean {
  return mimeType === 'application/pdf'
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

// Drag and drop functions
function onDragStart(event: DragEvent, attachmentId: string, category: string | null) {
  if (!canEdit.value) return
  draggingId.value = attachmentId
  draggingCategory.value = category || null
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

function onDragOver(event: DragEvent, attachmentId: string, category: string | null) {
  if (!canEdit.value || !draggingId.value) return
  event.preventDefault()
  
  // Só permite drop na mesma categoria
  if (draggingCategory.value === (category || null)) {
    dragOverId.value = attachmentId
  }
}

async function onDrop(targetId: string, category: string | null) {
  if (!canEdit.value || !draggingId.value || draggingId.value === targetId) {
    draggingId.value = null
    dragOverId.value = null
    draggingCategory.value = null
    return
  }

  // Só permite drop na mesma categoria
  if (draggingCategory.value !== (category || null)) {
    draggingId.value = null
    dragOverId.value = null
    draggingCategory.value = null
    return
  }

  // Pegar todos os anexos da categoria, já ordenados
  const categoryAttachments = attachments.value
    .filter(a => (a.category || null) === (category || null))
    .sort((a, b) => a.sort_order - b.sort_order)

  const fromIndex = categoryAttachments.findIndex(a => a.id === draggingId.value)
  const toIndex = categoryAttachments.findIndex(a => a.id === targetId)

  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    draggingId.value = null
    dragOverId.value = null
    draggingCategory.value = null
    return
  }

  // Reordenar array
  const newOrder = [...categoryAttachments]
  const [movedItem] = newOrder.splice(fromIndex, 1)
  newOrder.splice(toIndex, 0, movedItem)

  // Criar updates com novos sort_order
  const updates = newOrder.map((attachment, index) => ({
    id: attachment.id,
    sort_order: index
  }))

  // Persistir no banco usando o composable
  const success = await reorderAttachments(updates)
  
  if (!success) {
    // Recarregar em caso de erro
    await fetchAttachments()
  }

  draggingId.value = null
  dragOverId.value = null
  draggingCategory.value = null
}

function onDragEnd() {
  draggingId.value = null
  dragOverId.value = null
  draggingCategory.value = null
}

// Touch drag and drop
function onTouchStart(event: TouchEvent, attachmentId: string, category: string | null, index: number) {
  if (!canEdit.value) return
  touchDraggingId = attachmentId
  touchDraggingCategory = category || null
  touchStartY = event.touches[0]!.clientY
  touchStartIndex = index
  draggingId.value = attachmentId
  draggingCategory.value = category || null
}

function onTouchMove(event: TouchEvent) {
  if (!canEdit.value || !touchDraggingId) return
  event.preventDefault()
  
  const touch = event.touches[0]!
  const el = document.elementFromPoint(touch.clientX, touch.clientY)
  const attachmentEl = el?.closest('[data-attachment-id]') as HTMLElement | null
  
  if (attachmentEl) {
    const targetId = attachmentEl.dataset.attachmentId
    if (targetId) {
      dragOverId.value = targetId
    }
  }
}

async function onTouchEnd() {
  if (!canEdit.value || !touchDraggingId) {
    touchDraggingId = null
    touchDraggingCategory = null
    draggingId.value = null
    dragOverId.value = null
    draggingCategory.value = null
    return
  }

  if (dragOverId.value && touchDraggingId !== dragOverId.value) {
    await onDrop(dragOverId.value, touchDraggingCategory)
  }

  touchDraggingId = null
  touchDraggingCategory = null
  draggingId.value = null
  dragOverId.value = null
  draggingCategory.value = null
}

function detectMobile() {
  if (import.meta.client) {
    isMobile.value = window.innerWidth < 768
    window.addEventListener('resize', () => {
      isMobile.value = window.innerWidth < 768
    })
  }
}

onMounted(async () => {
  detectMobile()
  await fetchUserRole()
  await fetchAttachments()
})
</script>

<style scoped>
/* Transições suaves para drag and drop */
[data-attachment-id] {
  transition: transform 150ms ease, opacity 150ms ease, box-shadow 150ms ease;
}

/* Feedback visual durante drag */
[data-attachment-id]:active {
  cursor: grabbing;
}

/* Animação de hover para indicar que é arrastável */
[data-attachment-id][draggable="true"]:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* Feedback visual para mobile */
@media (max-width: 767px) {
  [data-attachment-id] {
    touch-action: none;
  }
}
</style>
