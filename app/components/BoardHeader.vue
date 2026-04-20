<template>
  <div class="flex items-center justify-between mb-6 shrink-0 relative z-10">
    <div class="min-w-0">
      <h1 class="text-heading-lg font-semibold text-neutral-900 truncate">{{ board?.name ?? '...' }}</h1>
      <p v-if="board?.description" class="text-body-sm text-muted mt-0.5 truncate">{{ board.description }}</p>
    </div>
    <slot name="actions" />
  </div>
</template>

<script setup lang="ts">
import type { Tables } from '#shared/types/database'

defineProps<{
  board: Tables<'boards'> | null
}>()
</script>
