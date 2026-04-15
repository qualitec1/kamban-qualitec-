<template>
  <div class="bg-white border border-neutral-200 rounded-lg p-4 space-y-3">
    <!-- Textarea com suporte a menções -->
    <div class="relative">
      <textarea
        ref="textareaRef"
        v-model="content"
        class="w-full min-h-[80px] px-3 py-2 text-sm border border-neutral-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
        :class="{ 'border-red-300 focus:ring-red-500': error }"
        placeholder="Escreva uma atualização... (use @ para mencionar alguém)"
        :disabled="loading"
        @input="handleMentionInput"
        @keyup="handleMentionInput"
        @click="handleMentionInput"
        @keydown="handleMentionKeydown"
        @keydown.meta.enter="submit"
        @keydown.ctrl.enter="submit"
      />

      <!-- Dropdown de menções -->
      <div
        v-if="showMentions && filteredMembers.length > 0"
        class="absolute z-10 mt-1 w-64 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
        :style="{ top: mentionDropdownTop + 'px' }"
      >
        <button
          v-for="(member, index) in filteredMembers"
          :key="member.user_id"
          type="button"
          class="w-full px-3 py-2 text-left text-sm hover:bg-primary-50 transition-colors flex items-center gap-2"
          :class="{ 'bg-primary-100': index === selectedMentionIndex }"
          @click="selectMember(member)"
        >
          <Avatar :profile="member.user" size="sm" />
          <div class="flex-1 min-w-0">
            <p class="font-medium text-neutral-900 truncate">
              {{ member.user?.full_name || member.user?.email || 'Usuário' }}
            </p>
            <p class="text-xs text-neutral-500 truncate">{{ member.user?.email }}</p>
          </div>
        </button>
      </div>
    </div>

    <!-- Preview de arquivos selecionados -->
    <div v-if="selectedFiles.length > 0" class="flex flex-wrap gap-2">
      <div
        v-for="(file, index) in selectedFiles"
        :key="index"
        class="flex items-center gap-2 px-3 py-2 bg-neutral-100 rounded-lg text-sm"
      >
        <svg class="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
        </svg>
        <span class="text-neutral-700">{{ file.name }}</span>
        <button
          type="button"
          class="text-neutral-400 hover:text-red-600"
          @click="removeFile(index)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Error message -->
    <div v-if="error" class="text-sm text-red-600">
      {{ error }}
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-between">
      <!-- Botões de ação -->
      <div class="flex items-center gap-2">
        <!-- Input file oculto -->
        <input
          ref="fileInputRef"
          type="file"
          class="hidden"
          multiple
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
          @change="handleFileSelect"
        />
        
        <button
          type="button"
          class="p-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Anexar arquivo"
          :disabled="loading"
          @click="fileInputRef?.click()"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
          </svg>
        </button>
      </div>

      <!-- Botão enviar -->
      <button
        type="button"
        class="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-300 disabled:cursor-not-allowed rounded-lg transition-colors"
        :disabled="!canSubmit || loading"
        @click="submit"
      >
        <span v-if="loading">Enviando...</span>
        <span v-else>Enviar</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useTaskUpdates } from '~/composables/useTaskUpdates'
import { useTaskUpdateAttachments } from '~/composables/useTaskUpdateAttachments'
import { useBoardMembers } from '~/composables/useBoardMembers'

const props = defineProps<{
  taskId: string
  boardId: string
  parentId?: string | null
}>()

const emit = defineEmits<{
  (e: 'created'): void
}>()

const { createUpdate, loading, error: composableError } = useTaskUpdates(props.taskId)
const { uploadFile } = useTaskUpdateAttachments()

// Sistema de menções
const { members, fetchMembers } = useBoardMembers(props.boardId)
const showMentions = ref(false)
const mentionQuery = ref('')
const mentionStartPos = ref(0)
const selectedMentionIndex = ref(0)
const mentionDropdownTop = ref(100)

fetchMembers()

const filteredMembers = computed(() => {
  if (!mentionQuery.value) return members.value

  const query = mentionQuery.value.toLowerCase()
  return members.value.filter(member => {
    const name = member.user?.full_name?.toLowerCase() || ''
    const email = member.user?.email?.toLowerCase() || ''
    return name.includes(query) || email.includes(query)
  })
})

const content = ref('')
const error = ref<string | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedFiles = ref<File[]>([])

const canSubmit = computed(() => {
  const hasContent = content.value.trim().length > 0
  const hasAttachments = selectedFiles.value.length > 0
  return (hasContent || hasAttachments) && !loading.value
})

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files) {
    const newFiles = Array.from(target.files)
    selectedFiles.value = [...selectedFiles.value, ...newFiles]
    target.value = ''
  }
}

function removeFile(index: number) {
  selectedFiles.value.splice(index, 1)
}

function handleMentionInput() {
  const textarea = textareaRef.value
  if (!textarea) return

  const cursorPos = textarea.selectionStart
  const text = content.value

  let atPos = -1
  for (let i = cursorPos - 1; i >= 0; i--) {
    if (text[i] === '@') {
      atPos = i
      break
    }
    if (text[i] === ' ' || text[i] === '\n') {
      break
    }
  }

  if (atPos !== -1) {
    mentionStartPos.value = atPos
    mentionQuery.value = text.substring(atPos + 1, cursorPos)
    showMentions.value = true
    selectedMentionIndex.value = 0

    const lineHeight = 20
    const lines = text.substring(0, atPos).split('\n').length
    mentionDropdownTop.value = lines * lineHeight + 40
  } else {
    showMentions.value = false
  }
}

function handleMentionKeydown(event: KeyboardEvent) {
  if (!showMentions.value) return

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    selectedMentionIndex.value = Math.min(selectedMentionIndex.value + 1, filteredMembers.value.length - 1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    selectedMentionIndex.value = Math.max(selectedMentionIndex.value - 1, 0)
  } else if (event.key === 'Enter' && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
    event.preventDefault()
    if (filteredMembers.value[selectedMentionIndex.value]) {
      selectMember(filteredMembers.value[selectedMentionIndex.value])
    }
  } else if (event.key === 'Escape') {
    event.preventDefault()
    showMentions.value = false
  }
}

function selectMember(member: any) {
  const textarea = textareaRef.value
  if (!textarea) return

  const text = content.value
  const cursorPos = textarea.selectionStart

  const before = text.substring(0, mentionStartPos.value)
  const after = text.substring(cursorPos)
  const mention = `@[${member.user_id}:${member.user?.full_name || member.user?.email}]`

  content.value = before + mention + ' ' + after

  nextTick(() => {
    const newCursorPos = before.length + mention.length + 1
    textarea.setSelectionRange(newCursorPos, newCursorPos)
    textarea.focus()
  })

  showMentions.value = false
}

async function submit() {
  if (!canSubmit.value) return

  error.value = null

  try {
    const result = await createUpdate(content.value || '(anexo)', props.parentId || null)

    if (!result) {
      error.value = composableError.value || 'Erro ao criar atualização'
      return
    }

    // Upload de arquivos
    if (selectedFiles.value.length > 0) {
      for (const file of selectedFiles.value) {
        await uploadFile(result.id, file)
      }
    }

    // Limpar e emitir
    content.value = ''
    selectedFiles.value = []
    error.value = null
    emit('created')

    await nextTick()
    textareaRef.value?.focus()
  } catch (err) {
    console.error('[TaskUpdateComposer] Error:', err)
    error.value = err instanceof Error ? err.message : 'Erro ao enviar atualização'
  }
}

defineExpose({
  focus: () => textareaRef.value?.focus()
})
</script>
