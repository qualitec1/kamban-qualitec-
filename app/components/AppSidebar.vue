<template>
  <aside
    :class="[
      'flex flex-col bg-primary shrink-0 transition-all duration-[300ms] overflow-hidden z-50',
      isMobile
        ? ['fixed inset-y-0 left-0', isOpen ? 'w-64' : 'w-0']
        : [isOpen ? 'w-64' : 'w-16']
    ]"
  >
    <!-- Logo -->
    <div class="flex items-center gap-3 px-4 h-14 border-b border-primary-600 shrink-0">
      <img src="/images/logo_qualitec.png" alt="Qualitec" class="h-8 object-contain shrink-0" />
    </div>

    <!-- Nav -->
    <nav class="flex-1 overflow-y-auto py-3 px-2 space-y-4 scrollbar-hide">
      
      <!-- Main navigation -->
      <div class="space-y-0.5">
        <SidebarItem
          v-for="item in mainItems"
          :key="item.to"
          :item="item"
          :collapsed="!isOpen"
          @navigate="$emit('navigate')"
        />
      </div>

      <!-- Workspaces section -->
      <div v-if="isOpen" class="space-y-1">
        <div class="px-3 py-1.5 flex items-center justify-between">
          <span class="text-white/50 text-xs font-medium uppercase tracking-wider">Áreas</span>
          <button
            class="w-5 h-5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded transition-colors"
            aria-label="Adicionar área"
            @click="$emit('add-workspace')"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true">
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
import { computed } from 'vue'
import { useAuth } from '~/composables/useAuth'

defineProps<{
  isOpen: boolean
  isMobile: boolean
  workspaces?: Array<{ id: string; name: string; slug: string }>
  favorites?: Array<{ id: string; name: string }>
  recents?: Array<{ id: string; name: string }>
}>()

defineEmits<{
  'add-workspace': []
  'user-menu': []
  'navigate': []
}>()

const { user } = useAuth()

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
</style>
