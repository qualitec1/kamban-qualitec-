<template>
  <!-- Loading skeleton -->
  <div v-if="loading" class="w-6 h-6 rounded-full bg-neutral-100 animate-pulse" />

  <!-- Assignees -->
  <AvatarStack v-else-if="assignees.length > 0" :assignees="assignees" />

  <!-- Empty state (no assignees or error) -->
  <svg
    v-else
    xmlns="http://www.w3.org/2000/svg"
    class="w-5 h-5 text-neutral-300"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fill-rule="evenodd"
      d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
      clip-rule="evenodd"
    />
  </svg>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

const props = defineProps<{
  taskId: string
}>()

const { assignees, loading, fetchAssignees } = useTaskAssignees(props.taskId)

onMounted(() => {
  fetchAssignees()
})
</script>
