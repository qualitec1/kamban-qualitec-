<template>
  <span v-html="renderedContent" class="whitespace-pre-wrap" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  content: string
}>()

const renderedContent = computed(() => {
  // Substituir @[uuid:nome] por <span class="mention">@nome</span>
  return props.content.replace(
    /@\[([a-f0-9-]+):([^\]]+)\]/g,
    '<span class="mention">@$2</span>'
  )
})
</script>

<style scoped>
:deep(.mention) {
  color: #6366f1;
  background-color: #eef2ff;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

:deep(.mention:hover) {
  background-color: #e0e7ff;
}
</style>
