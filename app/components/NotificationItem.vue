<template>
  <div
    class="group relative flex gap-3 p-3 rounded-xl border cursor-pointer transition-all"
    :class="isRead
      ? 'bg-white/50 opacity-75 border-transparent hover:opacity-100 hover:bg-[#F0EDEF]'
      : 'bg-white border-[#E6E9EF] hover:bg-[#F0EDEF]'"
    :style="!isRead ? 'box-shadow: 0 2px 4px rgba(0,0,0,0.02)' : ''"
  >
    <!-- Ícone / Avatar -->
    <div class="relative shrink-0">
      <!-- Ícone de alerta (sem avatar) -->
      <div
        v-if="notification.type === 'deadline'"
        class="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
      </div>
      <!-- Avatar genérico para outros tipos -->
      <div
        v-else
        class="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
        :class="avatarColor"
      >
        {{ initials }}
      </div>
      <!-- Badge de tipo -->
      <div
        class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white"
        :class="badgeColor"
      >
        <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path :d="badgeIcon" />
        </svg>
      </div>
    </div>

    <!-- Conteúdo -->
    <div class="flex-1 pr-8 min-w-0">
      <!-- Alerta crítico -->
      <p
        v-if="notification.type === 'deadline'"
        class="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1"
      >
        Alerta de prazo
      </p>
      <p class="text-sm leading-relaxed" :class="isRead ? 'text-neutral-500' : 'text-neutral-800'">
        <span class="font-semibold">{{ notification.title }}</span>
      </p>
      <p v-if="notification.body" class="text-xs text-neutral-400 mt-0.5 line-clamp-2">
        {{ notification.body }}
      </p>
      <p class="text-[11px] mt-1 font-medium" :class="isRead ? 'text-neutral-400' : 'text-neutral-400'">
        {{ formatRelativeTime(notification.created_at) }}
      </p>
    </div>

    <!-- Indicador não lida + ações no hover -->
    <div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
      <!-- Dot não lida (some no hover) -->
      <div
        v-if="!isRead"
        class="w-2 h-2 bg-[#4744e5] rounded-full group-hover:hidden"
      />
      <!-- Ações (aparecem no hover) -->
      <div class="hidden group-hover:flex items-center gap-1">
        <button
          v-if="!isRead"
          @click.stop="$emit('mark-read', notification.id)"
          class="p-1 rounded-full hover:bg-[#4744e5]/10 text-[#4744e5] transition-colors"
          title="Marcar como lida"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        <button
          @click.stop="$emit('delete', notification.id)"
          class="p-1 rounded-full hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors"
          title="Excluir"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  notification: {
    id: string
    type: string
    title: string
    body?: string | null
    read_at?: string | null
    created_at: string
  }
}>()

defineEmits<{
  'mark-read': [id: string]
  'delete': [id: string]
}>()

const isRead = computed(() => !!props.notification.read_at)

// Iniciais a partir do título
const initials = computed(() => {
  const words = props.notification.title.split(' ')
  return words.slice(0, 2).map(w => w[0]).join('').toUpperCase()
})

// Cor do avatar por tipo
const avatarColor = computed(() => {
  const map: Record<string, string> = {
    mention: 'bg-purple-500',
    assigned: 'bg-[#4744e5]',
    comment: 'bg-sky-500',
    completed: 'bg-emerald-500',
    member_added: 'bg-indigo-400',
    deadline: 'bg-red-500',
  }
  return map[props.notification.type] ?? 'bg-neutral-400'
})

// Cor do badge de tipo
const badgeColor = computed(() => {
  const map: Record<string, string> = {
    mention: 'bg-purple-500',
    assigned: 'bg-[#4744e5]',
    comment: 'bg-sky-500',
    completed: 'bg-emerald-500',
    member_added: 'bg-indigo-400',
    deadline: 'bg-red-500',
  }
  return map[props.notification.type] ?? 'bg-neutral-400'
})

// Ícone SVG path por tipo
const badgeIcon = computed(() => {
  const map: Record<string, string> = {
    mention: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z', // @
    assigned: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
    comment: 'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z',
    completed: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z',
    member_added: 'M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
    deadline: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z',
  }
  return map[props.notification.type] ?? 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z'
})

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return 'agora há pouco'
  if (diff < 3600) return `há ${Math.floor(diff / 60)}min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
  if (diff < 604800) return `há ${Math.floor(diff / 86400)}d`
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}
</script>
