<template>
  <div
    class="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-neutral-200 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:z-10 hover:w-auto hover:min-w-max relative group"
  >
    <div v-if="layout === 'vertical'" class="flex flex-col">
      <p class="text-xs sm:text-sm text-neutral-500 mb-2 truncate group-hover:whitespace-nowrap">{{ label }}</p>
      <slot />
    </div>
    <div v-else class="flex items-center justify-between">
      <div class="min-w-0 flex-1">
        <p class="text-xs sm:text-sm text-neutral-500 mb-1 truncate group-hover:whitespace-nowrap">{{ label }}</p>
        <p
          class="font-bold truncate group-hover:whitespace-nowrap"
          :class="[valueSize, valueColor]"
        >{{ value }}</p>
      </div>
      <div
        class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ml-2"
        :class="iconBg"
      >
        <slot name="icon" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  label: string
  value?: string | number
  valueColor?: string
  valueSize?: string
  iconBg?: string
  layout?: 'horizontal' | 'vertical'
}>(), {
  valueColor: 'text-neutral-900',
  valueSize: 'text-xl sm:text-2xl',
  iconBg: 'bg-neutral-100',
  layout: 'horizontal'
})
</script>
