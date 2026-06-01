<template>
  <div class="relative" ref="panelRef">
    <!-- Botão de notificações -->
    <button
      @click="togglePanel"
      class="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors text-neutral-500"
      aria-label="Notificações"
      :aria-expanded="open"
    >
      <svg
        class="w-5 h-5 transition-transform duration-200"
        :class="{ 'animate-wiggle': hasNewNotification }"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      <span
        v-if="unreadCount > 0"
        class="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"
        aria-hidden="true"
      />
    </button>

    <!-- Drawer de notificações -->
    <Teleport to="body">
      <Transition name="drawer">
        <div
          v-if="open"
          class="fixed inset-y-0 right-0 z-[99999] flex flex-col w-full md:w-[400px] bg-[#F6F3F5] border-l border-[#E6E9EF]"
          style="box-shadow: -10px 0 30px rgba(0,0,0,0.05); backdrop-filter: blur(8px);"
        >
          <!-- Header -->
          <div class="p-6 space-y-4 shrink-0">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <h2 class="font-semibold text-[18px] leading-snug text-neutral-900" style="font-family: 'Plus Jakarta Sans', sans-serif;">
                  Notificações
                </h2>
                <span
                  v-if="unreadCount > 0"
                  class="bg-[#4744e5] text-white text-[11px] font-bold px-2 py-0.5 rounded-full"
                >
                  {{ unreadCount }} não lidas
                </span>
              </div>
              <button
                @click="togglePanel"
                class="text-neutral-400 hover:text-neutral-700 transition-colors p-1 rounded-full hover:bg-neutral-200"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="flex items-center justify-between">
              <button
                v-if="unreadCount > 0"
                @click="markAllAsRead"
                class="text-xs font-semibold text-[#4744e5] hover:underline transition-all"
              >
                Marcar todas como lidas
              </button>
              <span v-else class="text-xs text-neutral-400">Tudo em dia</span>
            </div>

            <!-- Filtros em pills -->
            <div class="flex gap-2 overflow-x-auto pb-1" style="scrollbar-width: none;">
              <button
                v-for="f in filters"
                :key="f.key"
                @click="activeFilter = f.key"
                class="shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors"
                :class="activeFilter === f.key
                  ? 'bg-[#4744e5] text-white'
                  : 'bg-white border border-[#E6E9EF] text-neutral-500 hover:border-[#4744e5]/30'"
              >
                {{ f.label }}
              </button>
            </div>
          </div>

          <!-- Lista -->
          <div class="flex-1 overflow-y-auto px-4 pb-6 space-y-6" style="scrollbar-width: thin; scrollbar-color: #e4e2e4 transparent;">

            <!-- Loading -->
            <div v-if="loading" class="flex items-center justify-center py-16">
              <div class="w-6 h-6 rounded-full border-2 border-[#4744e5] border-t-transparent animate-spin" />
            </div>

            <!-- Empty state -->
            <div v-else-if="filteredNotifications.length === 0" class="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div class="w-14 h-14 rounded-full bg-white border border-[#E6E9EF] flex items-center justify-center mb-4">
                <svg class="w-7 h-7 text-neutral-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </div>
              <p class="text-sm font-semibold text-neutral-700">Nenhuma notificação</p>
              <p class="text-xs text-neutral-400 mt-1">Você está em dia com tudo.</p>
            </div>

            <!-- Grupo: Hoje -->
            <div v-if="todayNotifications.length > 0">
              <h3 class="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-3 px-1">
                Hoje
              </h3>
              <div class="space-y-1">
                <NotificationItem
                  v-for="n in todayNotifications"
                  :key="n.id"
                  :notification="n"
                  @mark-read="markAsRead"
                  @delete="deleteNotification"
                />
              </div>
            </div>

            <!-- Grupo: Anteriores -->
            <div v-if="olderNotifications.length > 0">
              <h3 class="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-3 px-1">
                Anteriores
              </h3>
              <div class="space-y-1">
                <NotificationItem
                  v-for="n in olderNotifications"
                  :key="n.id"
                  :notification="n"
                  @mark-read="markAsRead"
                  @delete="deleteNotification"
                />
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="p-4 border-t border-[#E6E9EF] bg-white shrink-0">
            <button class="w-full py-2.5 bg-[#F0EDEF] hover:bg-[#EAE7EA] transition-colors rounded-lg text-sm font-bold text-neutral-700 flex items-center justify-center gap-2">
              Ver histórico completo
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>
      </Transition>

      <!-- Overlay -->
      <Transition name="fade">
        <div
          v-if="open"
          class="fixed inset-0 z-[99998] bg-black/20"
          @click="togglePanel"
        />
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, provide } from 'vue'
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
const hasNewNotification = ref(false)
const activeFilter = ref('all')

const filters = [
  { key: 'all', label: 'Todas' },
  { key: 'unread', label: 'Não lidas' },
  { key: 'mention', label: 'Menções' },
  { key: 'assigned', label: 'Atribuídas' },
  { key: 'deadline', label: 'Prazos' },
]

const filteredNotifications = computed(() => {
  if (activeFilter.value === 'all') return notifications.value
  if (activeFilter.value === 'unread') return notifications.value.filter(n => !n.read_at)
  return notifications.value.filter(n => n.type === activeFilter.value)
})

const todayNotifications = computed(() => {
  const today = new Date()
  return filteredNotifications.value.filter(n => {
    const d = new Date(n.created_at)
    return d.toDateString() === today.toDateString()
  })
})

const olderNotifications = computed(() => {
  const today = new Date()
  return filteredNotifications.value.filter(n => {
    const d = new Date(n.created_at)
    return d.toDateString() !== today.toDateString()
  })
})

function togglePanel() {
  if (!open.value) fetchNotifications()
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
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}



let unsubscribe: (() => void) | null = null

onMounted(async () => {
  await fetchNotifications()
  unsubscribe = await subscribeToNotifications()

  watch(unreadCount, (newCount, oldCount) => {
    if (newCount > oldCount) {
      hasNewNotification.value = true
      setTimeout(() => { hasNewNotification.value = false }, 3000)
    }
  })
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})
</script>

<style scoped>
/* Drawer slide-in da direita */
.drawer-enter-active,
.drawer-leave-active {
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(100%);
}

/* Overlay fade */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Wiggle no ícone */
@keyframes wiggle {
  0%, 100% { transform: rotate(0deg); }
  10%, 30%, 50%, 70%, 90% { transform: rotate(-10deg); }
  20%, 40%, 60%, 80% { transform: rotate(10deg); }
}
.animate-wiggle {
  animation: wiggle 0.8s ease-in-out;
}
</style>
