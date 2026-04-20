<template>
  <BaseModal v-model="isOpen" title="Compartilhar grupo por e-mail" size="md">
    <div class="space-y-4">
      <p class="text-body-sm text-muted">
        Selecione os membros que receberão um e-mail com as tarefas deste grupo.
      </p>

      <!-- Lista de membros -->
      <div class="space-y-2 max-h-96 overflow-y-auto">
        <label
          v-for="member in members"
          :key="member.id"
          class="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer motion-interactive"
        >
          <input
            type="checkbox"
            :value="member.id"
            v-model="selectedMembers"
            class="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
          />
          <Avatar :profile="member" size="sm" />
          <div class="flex-1 min-w-0">
            <p class="text-label-sm text-default truncate">{{ member.full_name || member.email }}</p>
            <p class="text-label-xs text-muted truncate">{{ member.email }}</p>
          </div>
        </label>

        <div v-if="!members.length" class="text-center py-8">
          <p class="text-body-sm text-muted">Nenhum membro encontrado</p>
        </div>
      </div>

      <!-- Mensagem opcional -->
      <div>
        <label class="text-label-md text-default block mb-2">Mensagem (opcional)</label>
        <textarea
          v-model="message"
          placeholder="Adicione uma mensagem personalizada..."
          rows="3"
          class="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-body-sm"
          maxlength="500"
        />
      </div>

      <div v-if="error" class="text-label-sm text-danger-600">
        {{ error }}
      </div>

      <div class="flex gap-3 justify-end pt-2">
        <BaseButton type="button" variant="ghost" @click="isOpen = false">
          Cancelar
        </BaseButton>
        <BaseButton 
          type="button" 
          variant="primary" 
          :disabled="!selectedMembers.length || loading"
          @click="handleSubmit"
        >
          {{ loading ? 'Enviando...' : `Enviar para ${selectedMembers.length} ${selectedMembers.length === 1 ? 'membro' : 'membros'}` }}
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Tables } from '#shared/types/database'

const props = defineProps<{
  modelValue: boolean
  members: Tables<'profiles'>[]
  loading?: boolean
  error?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [data: { memberIds: string[]; message: string }]
}>()

const isOpen = ref(props.modelValue)
const selectedMembers = ref<string[]>([])
const message = ref('')

watch(() => props.modelValue, (val) => {
  isOpen.value = val
  if (val) {
    selectedMembers.value = []
    message.value = ''
  }
})

watch(isOpen, (val) => {
  emit('update:modelValue', val)
})

function handleSubmit() {
  if (!selectedMembers.value.length) return
  emit('submit', {
    memberIds: selectedMembers.value,
    message: message.value
  })
}
</script>
