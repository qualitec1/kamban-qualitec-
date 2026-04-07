<template>
  <div
    class="flex items-center"
    :title="tooltipTitle"
  >
    <Avatar
      v-for="(assignee, index) in visibleAssignees"
      :key="assignee.id"
      :profile="assignee"
      size="sm"
      :class="index > 0 ? 'ml-[-8px]' : ''"
    />
    <span
      v-if="hasOverflow"
      class="ml-[-8px] w-6 h-6 rounded-full border border-white bg-neutral-200 text-neutral-600 text-[10px] font-semibold flex items-center justify-center shrink-0 select-none"
    >
      +{{ overflowCount }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AssigneeProfile } from '~/shared/types/assignee'

const props = withDefaults(defineProps<{
  assignees: AssigneeProfile[]
  maxVisible?: number
}>(), {
  maxVisible: 3,
})

const hasOverflow = computed(() => props.assignees.length > props.maxVisible)

const visibleAssignees = computed(() =>
  hasOverflow.value ? props.assignees.slice(0, props.maxVisible) : props.assignees
)

const overflowCount = computed(() => props.assignees.length - props.maxVisible)

const tooltipTitle = computed(() =>
  props.assignees.map(a => a.full_name || a.email).join(', ')
)
</script>
