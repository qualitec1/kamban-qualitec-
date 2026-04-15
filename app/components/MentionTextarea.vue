<template>
  <div class="relative">
    <!-- Textarea -->
    <textarea
      ref="textareaRef"
      v-model="localValue"
      class="w-full min-h-[80px] px-3 py-2 text-sm border border-neutral-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
      :class="textareaClass"
      :placeholder="placeholder"
      :disabled="disabled"
      @input="handleInput"
      @keyup="handleInput"
      @click="handleInput"
      @keydown="handleKeydown"
      @keydown.meta.enter="$emit('submit')"
      @keydown.ctrl.enter="$emit('submit')"
    />

    <!-- Dropdown de menções -->
    <div
      v-if="showMentions && filteredMembers.length > 0"
      class="absolute z-10 mt-1 w-64 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
      :style="dropdownStyle"
    >
      <button
        v-for="(member, index) in filteredMembers"
        :key="member.user_id"
        type="button"
        class="w-full px-3 py-2 text-left text-sm hover:bg-primary-50 transition-colors flex items-center gap-2"
        :class="{ 'bg-primary-100': index === selectedIndex }"
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
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useBoardMembers } from '~/composables/useBoardMembers'

const props = defineProps<{
  modelValue: string
  boardId: string
  placeholder?: string
  disabled?: boolean
  textareaClass?: string
}>()

onMounted(() => {
  console.log('[MentionTextarea] Component mounted!', { boardId: props.boardId })
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'submit'): void
}>()

const { members, fetchMembers } = useBoardMembers(props.boardId)

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const localValue = ref(props.modelValue)
const showMentions = ref(false)
const mentionQuery = ref('')
const mentionStartPos = ref(0)
const selectedIndex = ref(0)
const dropdownStyle = ref({})

// Carregar membros ao montar
watch(() => props.boardId, async (boardId) => {
  if (boardId) {
    console.log('[MentionTextarea] Loading members for board:', boardId)
    await fetchMembers()
    console.log('[MentionTextarea] Members loaded:', members.value.length)
  } else {
    console.warn('[MentionTextarea] boardId is undefined!')
  }
}, { immediate: true })

// Sincronizar com v-model
watch(() => props.modelValue, (newValue) => {
  localValue.value = newValue
})

watch(localValue, (newValue) => {
  emit('update:modelValue', newValue)
})

const filteredMembers = computed(() => {
  if (!mentionQuery.value) return members.value

  const query = mentionQuery.value.toLowerCase()
  return members.value.filter(member => {
    const name = member.user?.full_name?.toLowerCase() || ''
    const email = member.user?.email?.toLowerCase() || ''
    return name.includes(query) || email.includes(query)
  })
})

function handleInput(event?: Event) {
  console.log('[MentionTextarea] handleInput called', { 
    eventType: event?.type,
    value: localValue.value 
  })

  const textarea = textareaRef.value
  if (!textarea) {
    console.log('[MentionTextarea] No textarea ref')
    return
  }

  const cursorPos = textarea.selectionStart
  const text = localValue.value

  console.log('[MentionTextarea] Input changed:', { 
    cursorPos, 
    textLength: text.length,
    lastChars: text.substring(Math.max(0, cursorPos - 5), cursorPos) 
  })

  // Procurar por @ antes do cursor
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
    // Encontrou @, mostrar dropdown
    mentionStartPos.value = atPos
    mentionQuery.value = text.substring(atPos + 1, cursorPos)
    showMentions.value = true
    selectedIndex.value = 0

    console.log('[MentionTextarea] Found @:', { 
      atPos, 
      query: mentionQuery.value, 
      membersCount: members.value.length,
      filteredCount: filteredMembers.value.length 
    })

    // Calcular posição do dropdown
    updateDropdownPosition()
  } else {
    if (showMentions.value) {
      console.log('[MentionTextarea] Hiding mentions dropdown')
    }
    showMentions.value = false
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (!showMentions.value) return

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, filteredMembers.value.length - 1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
  } else if (event.key === 'Enter' && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
    event.preventDefault()
    if (filteredMembers.value[selectedIndex.value]) {
      selectMember(filteredMembers.value[selectedIndex.value])
    }
  } else if (event.key === 'Escape') {
    event.preventDefault()
    showMentions.value = false
  }
}

function selectMember(member: any) {
  const textarea = textareaRef.value
  if (!textarea) return

  const text = localValue.value
  const cursorPos = textarea.selectionStart

  // Substituir @query por @[uuid:nome]
  const before = text.substring(0, mentionStartPos.value)
  const after = text.substring(cursorPos)
  const mention = `@[${member.user_id}:${member.user?.full_name || member.user?.email}]`

  localValue.value = before + mention + ' ' + after

  // Posicionar cursor após a menção
  nextTick(() => {
    const newCursorPos = before.length + mention.length + 1
    textarea.setSelectionRange(newCursorPos, newCursorPos)
    textarea.focus()
  })

  showMentions.value = false
}

function updateDropdownPosition() {
  const textarea = textareaRef.value
  if (!textarea) return

  // Calcular posição aproximada do cursor
  const lineHeight = 20
  const lines = localValue.value.substring(0, mentionStartPos.value).split('\n').length
  const top = lines * lineHeight

  dropdownStyle.value = {
    top: `${top + 40}px`,
    left: '0px'
  }
}

defineExpose({
  focus: () => textareaRef.value?.focus()
})
</script>
