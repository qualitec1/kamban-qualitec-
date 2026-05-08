<template>
  <div></div>
</template>

<script setup lang="ts">
// Redirecionar para a página principal (Minhas Tarefas)
definePageMeta({
  middleware: () => {
    return navigateTo('/')
  }
})
</script>
