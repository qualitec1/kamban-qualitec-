<template>
  <BaseModal v-model="isOpen" title="Excluir quadro?" size="sm" :close-on-backdrop="false">
    <div class="space-y-4">
      <p class="text-sm text-neutral-600">
        Tem certeza que deseja excluir o quadro <span class="font-semibold">"{{ boardName }}"</span>?
      </p>
      <p class="text-sm text-danger-600 font-medium">
        Esta ação não pode ser desfeita. Todos os grupos, tarefas e subtarefas serão permanentemente removidos.
      </p>
    </div>

    <template #footer>
      <BaseButton variant="ghost" @click="isOpen = false">Cancelar</BaseButton>
      <BaseButton variant="danger" @click="$emit('confirm')" :disabled="loading">
        {{ loading ? 'Excluindo...' : 'Excluir quadro' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue: boolean
  boardName: string
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
}>()

const isOpen = ref(props.modelValue)

watch(() => props.modelValue, (val) => {
  isOpen.value = val
})

watch(isOpen, (val) => {
  emit('update:modelValue', val)
})
</script>
