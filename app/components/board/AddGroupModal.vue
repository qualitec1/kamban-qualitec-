<template>
  <BaseModal v-model="isOpen" title="Novo grupo" size="sm">
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <BaseInput
        v-model="groupName"
        label="Nome do grupo"
        placeholder="Ex: Em andamento, Concluído, Backlog"
        required
        :error="error"
        autofocus
      />

      <div>
        <label class="text-label-md text-default block mb-2">Cor</label>
        <div class="flex gap-2 flex-wrap">
          <button
            v-for="color in colors"
            :key="color"
            type="button"
            @click="selectedColor = color"
            class="w-7 h-7 rounded-full border-2 transition-all"
            :style="`background: ${color}`"
            :class="selectedColor === color ? 'border-neutral-900 scale-110' : 'border-transparent'"
          />
        </div>
      </div>

      <div class="flex gap-3 justify-end pt-2">
        <BaseButton type="button" variant="ghost" @click="isOpen = false">Cancelar</BaseButton>
        <BaseButton type="submit" variant="primary" :disabled="loading">
          {{ loading ? 'Criando...' : 'Criar grupo' }}
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue: boolean
  loading?: boolean
  error?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [data: { name: string; color: string }]
}>()

const isOpen = ref(props.modelValue)
const groupName = ref('')
const selectedColor = ref('#6366f1')

const colors = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#ef4444',
  '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6'
]

watch(() => props.modelValue, (val) => {
  isOpen.value = val
  if (val) {
    groupName.value = ''
    selectedColor.value = '#6366f1'
  }
})

watch(isOpen, (val) => {
  emit('update:modelValue', val)
})

function handleSubmit() {
  if (!groupName.value.trim()) return
  emit('submit', {
    name: groupName.value.trim(),
    color: selectedColor.value
  })
}
</script>
