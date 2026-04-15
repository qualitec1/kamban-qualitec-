<template>
  <div v-if="attachments.length > 0" class="space-y-2 mt-3">
    <!-- Imagens -->
    <div v-if="imageAttachments.length > 0" class="grid grid-cols-2 gap-2">
      <div
        v-for="attachment in imageAttachments"
        :key="attachment.id"
        class="relative group rounded-lg overflow-hidden border border-neutral-200 hover:border-neutral-300 transition-colors cursor-pointer"
        @click="viewAttachment(attachment)"
      >
        <img
          v-if="attachmentUrls.has(attachment.id)"
          :src="attachmentUrls.get(attachment.id)"
          :alt="attachment.file_name"
          class="w-full h-32 object-cover"
          loading="lazy"
        />
        <div v-else class="w-full h-32 bg-neutral-100 flex items-center justify-center">
          <svg class="w-8 h-8 animate-spin text-neutral-400" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
          <div class="opacity-0 group-hover:opacity-100 flex gap-2">
            <button
              type="button"
              class="p-2 bg-white rounded-lg hover:bg-neutral-100 transition-colors"
              title="Download"
              @click.stop="downloadAttachment(attachment)"
            >
              <svg class="w-4 h-4 text-neutral-700" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>
        </div>
        <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
          <p class="text-xs text-white truncate">{{ attachment.file_name }}</p>
        </div>
      </div>
    </div>

    <!-- Outros arquivos (PDFs, documentos, etc) -->
    <div v-if="otherAttachments.length > 0" class="space-y-2">
      <div
        v-for="attachment in otherAttachments"
        :key="attachment.id"
        class="flex items-center gap-3 p-3 bg-white rounded-lg border border-neutral-200 hover:border-neutral-300 transition-colors cursor-pointer"
        @click="downloadAttachment(attachment)"
      >
        <div class="p-2 bg-neutral-100 rounded">
          <svg class="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-neutral-900 truncate">{{ attachment.file_name }}</p>
          <p class="text-xs text-neutral-500">{{ formatFileSize(attachment.size_bytes) }}</p>
        </div>
        <div class="flex gap-1">
          <button
            type="button"
            class="p-2 text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
            title="Download"
            @click.stop="downloadAttachment(attachment)"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTaskUpdateAttachments, type TaskUpdateAttachment } from '~/composables/useTaskUpdateAttachments'

const props = defineProps<{
  updateId: string
}>()

const { fetchAttachments, getAttachmentUrl } = useTaskUpdateAttachments()

const attachments = ref<TaskUpdateAttachment[]>([])
const attachmentUrls = ref<Map<string, string>>(new Map())
const loadingUrls = ref<Set<string>>(new Set())

const imageAttachments = computed(() => {
  return attachments.value.filter(a => a.mime_type.startsWith('image/'))
})

const otherAttachments = computed(() => {
  return attachments.value.filter(a => !a.mime_type.startsWith('image/'))
})

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

async function loadAttachmentUrl(attachmentId: string) {
  if (loadingUrls.value.has(attachmentId)) return
  if (attachmentUrls.value.has(attachmentId)) return

  loadingUrls.value.add(attachmentId)

  try {
    const url = await getAttachmentUrl(attachmentId)
    if (url) {
      attachmentUrls.value.set(attachmentId, url)
    }
  } catch (err) {
    console.error('[TaskUpdateAttachmentsList] Error loading URL:', err)
  } finally {
    loadingUrls.value.delete(attachmentId)
  }
}

async function downloadAttachment(attachment: TaskUpdateAttachment) {
  const url = await getAttachmentUrl(attachment.id)
  if (!url) return
  
  const a = document.createElement('a')
  a.href = url
  a.download = attachment.file_name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function viewAttachment(attachment: TaskUpdateAttachment) {
  if (attachment.mime_type.startsWith('image/')) {
    const url = attachmentUrls.value.get(attachment.id)
    if (url) {
      window.open(url, '_blank')
    }
  }
}

onMounted(async () => {
  try {
    attachments.value = await fetchAttachments(props.updateId)

    // Carregar URLs apenas para imagens
    for (const attachment of attachments.value) {
      if (attachment.mime_type?.startsWith('image/')) {
        await loadAttachmentUrl(attachment.id)
      }
    }
  } catch (err) {
    console.error('[TaskUpdateAttachmentsList] Error:', err)
  }
})
</script>
