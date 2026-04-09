<template>
  <aside
    ref="sidebarRef"
    :class="[
      'flex flex-col bg-primary shrink-0 transition-all duration-[300ms] overflow-hidden relative',
      isMobile
        ? ['fixed inset-y-0 left-0 z-50', isOpen ? 'w-[80vw] max-w-[320px]' : 'w-0']
        : [isOpen ? 'w-64' : 'w-16', 'z-40']
    ]"
    :style="isMobile && isOpen ? { paddingTop: 'env(safe-area-inset-top)' } : {}"
  >
    <!-- Botão de collapse (desktop only) -->
    <button
      v-if="!isMobile"
      type="button"
      class="absolute -right-3 top-16 z-50 w-6 h-6 bg-white border border-neutral-200 rounded-full shadow-md flex items-center justify-center text-neutral-600 hover:text-primary-600 hover:border-primary-400 transition-all group"
      :title="isOpen ? 'Fechar navegação (Ctrl + .)' : 'Abrir navegação (Ctrl + .)'"
      @click="$emit('toggle')"
    >
      <svg 
        class="w-3.5 h-3.5 transition-transform duration-300"
        :class="{ 'rotate-180': !isOpen }"
        fill="none" 
        stroke="currentColor" 
        stroke-width="2.5" 
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
    </button>

    <!-- Logo -->
    <div class="flex items-center gap-3 px-4 h-14 border-b border-primary-600 shrink-0">
      <img src="/images/logo_qualitec.png" alt="Qualitec" class="h-8 object-contain shrink-0" />
      <span v-if="isOpen && isMobile" class="text-white font-semibold text-lg">Qualitec</span>
    </div>

    <!-- Nav -->
    <nav class="flex-1 overflow-y-auto py-3 px-2 space-y-4 scrollbar-hide touch-pan-y">
      
      <!-- Main navigation -->
      <div class="space-y-0.5">
        <SidebarItem
          v-for="item in mainItems"
          :key="item.to"
          :item="item"
          :collapsed="!isOpen"
          :is-mobile="isMobile"
          @navigate="$emit('navigate')"
        />
      </div>

      <!-- Workspaces section -->
      <div v-if="isOpen" class="space-y-1">
        <div class="px-3 py-1.5 flex items-center justify-between">
          <span class="text-white/50 text-xs font-medium uppercase tracking-wider">Áreas</span>
          <button
            class="min-w-[44px] min-h-[44px] w-8 h-8 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded transition-colors touch-manipulation"
            aria-label="Adicionar área"
            @click="$emit('add-workspace')"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        <div class="space-y-0.5">
          <SidebarItem
            v-for="ws in (workspaces ?? [])"
            :key="ws.id"
            :item="{ label: ws.name, to: `/workspaces/${ws.slug}`, icon: 'folder' }"
            :collapsed="false"
            :is-mobile="isMobile"
            @navigate="$emit('navigate')"
          />
          <div v-if="(workspaces ?? []).length === 0" class="px-3 py-2 text-white/40 text-xs">
            Nenhuma área criada
          </div>
        </div>
      </div>

      <!-- Favorites section -->
      <div v-if="isOpen" class="space-y-1">
        <div class="px-3 py-1.5">
          <span class="text-white/50 text-xs font-medium uppercase tracking-wider">Favoritos</span>
        </div>
        <div class="space-y-0.5">
          <SidebarItem
            v-for="fav in (favorites ?? [])"
            :key="fav.id"
            :item="{ label: fav.name, to: `/boards/${fav.id}`, icon: 'star' }"
            :collapsed="false"
            :is-mobile="isMobile"
            @navigate="$emit('navigate')"
          />
          <div v-if="(favorites ?? []).length === 0" class="px-3 py-2 text-white/40 text-xs">
            Nenhum favorito
          </div>
        </div>
      </div>

      <!-- Recents section -->
      <div v-if="isOpen" class="space-y-1">
        <div class="px-3 py-1.5">
          <span class="text-white/50 text-xs font-medium uppercase tracking-wider">Recentes</span>
        </div>
        <div class="space-y-0.5">
          <SidebarItem
            v-for="rec in (recents ?? [])"
            :key="rec.id"
            :item="{ label: rec.name, to: `/boards/${rec.id}`, icon: 'clock' }"
            :collapsed="false"
            :is-mobile="isMobile"
            @navigate="$emit('navigate')"
          />
          <div v-if="(recents ?? []).length === 0" class="px-3 py-2 text-white/40 text-xs">
            Nenhum recente
          </div>
        </div>
      </div>

    </nav>

    <!-- User -->
    <div class="border-t border-primary-600 p-3 shrink-0">
      <button
        class="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/10 cursor-pointer transition-colors duration-[150ms]"
        @click="$emit('user-menu')"
      >
        <div class="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
          <img v-if="user?.avatarUrl" :src="user.avatarUrl" :alt="user.fullName ?? user.email" class="w-full h-full object-cover" />
          <span v-else class="text-white text-xs font-semibold">{{ userInitials }}</span>
        </div>
        <div
          class="min-w-0 transition-opacity duration-[200ms] text-left"
          :class="isOpen ? 'opacity-100' : 'opacity-0'"
        >
          <p class="text-white text-label-sm font-medium truncate">{{ user?.fullName ?? 'Usuário' }}</p>
          <p class="text-white/50 text-micro truncate">{{ user?.email ?? '' }}</p>
        </div>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuth } from '~/composables/useAuth'

const props = defineProps<{
  isOpen: boolean
  isMobile: boolean
  workspaces?: Array<{ id: string; name: string; slug: string }>
  favorites?: Array<{ id: string; name: string }>
  recents?: Array<{ id: string; name: string }>
}>()

const emit = defineEmits<{
  'add-workspace': []
  'user-menu': []
  'navigate': []
  'toggle': []
}>()

const { user } = useAuth()
const sidebarRef = ref<HTMLElement | null>(null)

// Touch swipe detection for mobile
let touchStartX = 0
let touchStartY = 0
let touchEndX = 0
let touchEndY = 0

function handleTouchStart(e: TouchEvent) {
  if (!props.isMobile || !props.isOpen) return
  touchStartX = e.changedTouches[0].screenX
  touchStartY = e.changedTouches[0].screenY
}

function handleTouchEnd(e: TouchEvent) {
  if (!props.isMobile || !props.isOpen) return
  touchEndX = e.changedTouches[0].screenX
  touchEndY = e.changedTouches[0].screenY
  handleSwipe()
}

function handleSwipe() {
  const deltaX = touchEndX - touchStartX
  const deltaY = Math.abs(touchEndY - touchStartY)
  
  // Swipe right to close (horizontal swipe > 50px and vertical < 30px)
  if (deltaX > 50 && deltaY < 30) {
    emit('toggle')
  }
}

onMounted(() => {
  if (sidebarRef.value) {
    sidebarRef.value.addEventListener('touchstart', handleTouchStart, { passive: true })
    sidebarRef.value.addEventListener('touchend', handleTouchEnd, { passive: true })
  }
})

onUnmounted(() => {
  if (sidebarRef.value) {
    sidebarRef.value.removeEventListener('touchstart', handleTouchStart)
    sidebarRef.value.removeEventListener('touchend', handleTouchEnd)
  }
})

const mainItems = [
  { label: 'Início',        to: '/',             icon: 'home' },
  { label: 'Meu trabalho',  to: '/mywork',       icon: 'user' },
  { label: 'Quadros',       to: '/boards',       icon: 'grid' },
  { label: 'Coleções',      to: '/collections',  icon: 'collection' },
  { label: 'Áreas',         to: '/workspaces',   icon: 'folder' },
  { label: 'Membros',       to: '/members',      icon: 'users' },
  { label: 'Configurações', to: '/settings',     icon: 'settings' },
]

const userInitials = computed(() => {
  if (!user.value) return 'U'
  const name = user.value.fullName ?? user.value.email
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
})
</script>

<style scoped>
/* Hide scrollbar but keep functionality */
.scrollbar-hide {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;  /* Chrome, Safari and Opera */
}

/* Touch-friendly interactions */
.touch-manipulation {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.touch-pan-y {
  touch-action: pan-y;
  -webkit-overflow-scrolling: touch;
}
</style>
