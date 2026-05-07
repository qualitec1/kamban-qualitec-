<template>
  <!-- Loading state -->
  <LoadingState v-if="isLoading" label="Carregando..." />

  <div v-else class="min-h-screen">
    <!-- Página de início vazia - pronta para adicionar conteúdo -->
    <div class="flex items-center justify-center h-[60vh]">
      <div class="text-center">
        <h2 class="text-title-lg text-neutral-400 mb-2">Página inicial</h2>
        <p class="text-body-sm text-neutral-300">Conteúdo será adicionado aqui</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'

definePageMeta({ layout: 'default' })

const { user } = useAuth()
const isLoading = ref(false)

onMounted(async () => {
  if (user.value) {
    isLoading.value = true
    // Carregar dados quando necessário
    isLoading.value = false
  }
})
</script>
