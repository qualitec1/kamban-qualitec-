<template>
  <div class="relative" ref="panelRef">
    <!-- Botão de notificações -->
    <button
      @click="togglePanel"
      class="relative flex items-center justify-center w-9 h-9 rounded-xl text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors duration-[150ms]"
      aria-label="Notificações"
      :aria-expanded="open"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      <span 
        v-if="unreadCount > 0" 
        class="absolute top-1.5 right-1.5 w-2 h-2 bg-error-500 rounded-full" 
        aria-hidden="true" 
      />
    </button>

    <!-- Painel de notificações -->
    <Teleport to="body">
      <Transition name="dropdown">
        <div
          v-if="open"
          class="fixed z-[9999] w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-neutral-100 overflow-hidden"
          :style="panelStyle"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-neutral-100 bg-neutral-50">
            <h3 class="text-sm font-semibold text-neutral-900">
              Notificações
              <span v-if="unreadCount > 0" class="ml-1.5 text-xs text-neutral-500">({{ unreadCount }})</span>
            </h3>
            <button
              v-if="unreadCount > 0"
              @click="markAllAsRead"
              class="text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              Marcar todas como lidas
            </button>
          </div>

          <!-- Loading -->
          <div v-if="loading" class="flex items-center justify-center py-12">
            <div class="w-6 h-6 rounded-full border-2 border-primary-400 border-t-transparent animate-spin" />
          </div>

          <!-- Lista de notificações -->
          <div v-else-if="notifications.length > 0" class="max-h-[400px] overflow-y-auto">
            <div
              v-for="notification in notifications"
              :key="notification.id"
              class="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors"
            >
              <div class="px-4 py-3">
                <div class="flex items-start gap-3">
                  <!-- Indicador de não lida -->
                  <div class="shrink-0 mt-1.5">
                    <div 
                      v-if="!notification.read_at" 
                      class="w-2 h-2 bg-primary-500 rounded-full"
                    />
                    <div v-else class="w-2 h-2" />
                  </div>

                  <!-- Conteúdo -->
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-neutral-900">
                      {{ notification.title }}
                    </p>
                    <p class="text-xs text-neutral-600 mt-0.5">
                      {{ notification.body }}
                    </p>
                    <p class="text-xs text-neutral-400 mt-1">
                      {{ formatRelativeTime(notification.created_at) }}
                    </p>
                  </div>

                  <!-- Ações -->
                  <div class="shrink-0 flex items-center gap-1">
                    <button
                      v-if="!notification.read_at"
                      @click.stop="markAsRead(notification.id)"
                      class="p-1 text-neutral-400 hover:text-primary-600 transition-colors"
                      title="Marcar como lida"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      @click.stop="deleteNotification(notification.id)"
                      class="p-1 text-neutral-400 hover:text-red-600 transition-colors"
                      title="Excluir"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div v-else class="flex flex-col items-center justify-center py-12 px-4">
            <svg class="w-12 h-12 text-neutral-300 mb-3" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            <p class="text-sm text-neutral-500">Nenhuma notificação</p>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useNotifications } from '~/composables/useNotifications'

const { 
  notifications, 
  unreadCount, 
  loading, 
  fetchNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification,
  subscribeToNotifications
} = useNotifications()

const open = ref(false)
const panelRef = ref<HTMLElement | null>(null)
const panelStyle = ref<Record<string, string>>({})

function calcPosition() {
  if (!panelRef.value) return
  const rect = panelRef.value.getBoundingClientRect()
  
  panelStyle.value = {
    top: `${rect.bottom + 8}px`,
    right: `${window.innerWidth - rect.right}px`,
  }
}

function togglePanel() {
  if (!open.value) {
    calcPosition()
    fetchNotifications()
  }
  open.value = !open.value
}

function onClickOutside(e: MouseEvent) {
  if (panelRef.value && !panelRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diff < 60) return 'agora há pouco'
  if (diff < 3600) return `há ${Math.floor(diff / 60)}min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
  if (diff < 604800) return `há ${Math.floor(diff / 86400)}d`
  
  return date.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

let unsubscribe: (() => void) | null = null

onMounted(async () => {
  await fetchNotifications()
  unsubscribe = await subscribeToNotifications()
  document.addEventListener('mousedown', onClickOutside)
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
  document.removeEventListener('mousedown', onClickOutside)
})
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 150ms ease, transform 150ms ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
