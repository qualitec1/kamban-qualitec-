<template>
  <div
    :class="[sizeClass, 'rounded-full border border-white flex items-center justify-center overflow-hidden shrink-0 select-none']"
    :title="displayName"
  >
    <img
      v-if="showImage"
      :src="profile.avatar_url!"
      :alt="displayName"
      :title="displayName"
      :class="[sizeClass, 'rounded-full object-cover']"
      @error="onImageError"
    />
    <span
      v-else
      class="text-white font-semibold leading-none bg-neutral-400"
      :class="[sizeClass, 'rounded-full flex items-center justify-center', initialsTextSize]"
    >
      {{ initials }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { AssigneeProfile } from '~/shared/types/assignee'

const props = withDefaults(defineProps<{
  profile: AssigneeProfile
  size?: 'sm' | 'md'
}>(), {
  size: 'sm',
})

const imageError = ref(false)

const showImage = computed(() => !!props.profile.avatar_url && !imageError.value)

const sizeClass = computed(() => props.size === 'md' ? 'w-8 h-8' : 'w-6 h-6')

const initialsTextSize = computed(() => props.size === 'md' ? 'text-xs' : 'text-[10px]')

const displayName = computed(() =>
  props.profile.full_name || props.profile.email
)

const initials = computed(() => {
  if (props.profile.full_name) {
    return props.profile.full_name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(w => w[0])
      .join('')
      .toUpperCase()
  }
  return props.profile.email.slice(0, 2).toUpperCase()
})

function onImageError() {
  imageError.value = true
}
</script>
