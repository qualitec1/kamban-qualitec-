<template>
  <div class="bg-white border border-neutral-200 rounded-lg p-4 hover:border-neutral-300 transition-colors">
    <!-- Header: Avatar + Nome + Timestamp -->
    <div class="flex items-start gap-3 mb-3">
      <Avatar 
        v-if="update.author" 
        :profile="update.author" 
        size="md" 
      />
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class="text-sm font-semibold text-neutral-900">
            {{ update.author?.full_name || update.author?.email || 'Usuário' }}
          </span>
          <span class="text-xs text-neutral-500">
            {{ formatRelativeTime(update.created_at) }}
          </span>
          <span v-if="update.edited_at" class="text-xs text-neutral-400 italic">
            (editado)
          </span>
        </div>
      </div>

      <!-- Menu de opções (apenas para autor) -->
      <div v-if="isAuthor" class="relative">
        <button
          type="button"
          class="p-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
          @click="showMenu = !showMenu"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
        </button>

        <!-- Dropdown menu -->
        <div
          v-if="showMenu"
          class="absolute right-0 mt-1 w-32 bg-white border border-neutral-200 rounded-lg shadow-lg z-10"
        >
          <button
            type="button"
            class="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 rounded-t-lg"
            @click="handleEdit"
          >
            Editar
          </button>
          <button
            type="button"
            class="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
            @click="handleDelete"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>

    <!-- Conteúdo -->
    <div v-if="!isEditing" class="text-sm text-neutral-700 mb-3">
      <MentionContent :content="update.content" />
    </div>

    <!-- Modo de edição -->
    <div v-else class="mb-3">
      <textarea
        v-model="editContent"
        class="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
        rows="3"
      />
      <div class="flex gap-2 mt-2">
        <button
          type="button"
          class="px-3 py-1 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded transition-colors"
          @click="saveEdit"
        >
          Salvar
        </button>
        <button
          type="button"
          class="px-3 py-1 text-sm text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
          @click="cancelEdit"
        >
          Cancelar
        </button>
      </div>
    </div>

    <!-- Anexos -->
    <TaskUpdateAttachmentsList
      v-if="update.id"
      :update-id="update.id"
    />

    <!-- Ações: Curtir | Responder -->
    <div class="flex items-center gap-4 pt-3 border-t border-neutral-100">
      <button
        type="button"
        class="flex items-center gap-1 text-xs text-neutral-600 hover:text-primary-600 transition-colors"
        disabled
        title="Em breve"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
        </svg>
        <span>{{ update.like_count || 0 }}</span>
      </button>

      <button
        type="button"
        class="flex items-center gap-1 text-xs text-neutral-600 hover:text-primary-600 transition-colors"
        disabled
        title="Em breve"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span>{{ update.reply_count || 0 }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { TaskUpdate } from '~/composables/useTaskUpdates'
import { useTaskUpdates } from '~/composables/useTaskUpdates'

const props = defineProps<{
  update: TaskUpdate
  taskId: string
  boardId: string
}>()

const emit = defineEmits<{
  (e: 'deleted'): void
  (e: 'updated'): void
}>()

const { user } = useAuth()
const { deleteUpdate, updateContent } = useTaskUpdates(props.taskId)

const showMenu = ref(false)
const isEditing = ref(false)
const editContent = ref('')

const isAuthor = computed(() => {
  return user.value?.id === props.update.author_id
})

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'agora'
  if (diffInSeconds < 3600) return `há ${Math.floor(diffInSeconds / 60)}min`
  if (diffInSeconds < 86400) return `há ${Math.floor(diffInSeconds / 3600)}h`
  if (diffInSeconds < 604800) return `há ${Math.floor(diffInSeconds / 86400)}d`
  
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function handleEdit() {
  editContent.value = props.update.content
  isEditing.value = true
  showMenu.value = false
}

async function saveEdit() {
  const success = await updateContent(props.update.id, editContent.value)
  if (success) {
    isEditing.value = false
    emit('updated')
  }
}

function cancelEdit() {
  isEditing.value = false
  editContent.value = ''
}

async function handleDelete() {
  if (!confirm('Tem certeza que deseja excluir esta atualização?')) return
  
  const success = await deleteUpdate(props.update.id)
  if (success) {
    emit('deleted')
  }
  showMenu.value = false
}
</script>
