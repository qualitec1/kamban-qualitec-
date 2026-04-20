<template>
  <div class="settings-page">
    <div class="settings-container">
      <div class="settings-sidebar">
        <nav class="settings-nav">
          <button 
            :class="['nav-item', { active: activeTab === 'profile' }]"
            @click="activeTab = 'profile'"
          >
            <span class="icon">👤</span>
            <span>Perfil</span>
          </button>
          <button 
            :class="['nav-item', { active: activeTab === 'notifications' }]"
            @click="activeTab = 'notifications'"
          >
            <span class="icon">📧</span>
            <span>Notificações por Email</span>
          </button>
          <button 
            :class="['nav-item', { active: activeTab === 'account' }]"
            @click="activeTab = 'account'"
          >
            <span class="icon">⚙️</span>
            <span>Conta</span>
          </button>
        </nav>
      </div>

      <div class="settings-content">
        <div v-if="activeTab === 'profile'" class="tab-content">
          <h2>Configurações de Perfil</h2>
          <p class="tab-description">Em desenvolvimento...</p>
        </div>

        <div v-if="activeTab === 'notifications'" class="tab-content">
          <EmailPreferencesSettings />
        </div>

        <div v-if="activeTab === 'account'" class="tab-content">
          <h2>Configurações de Conta</h2>
          <p class="tab-description">Em desenvolvimento...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({
  layout: 'default',
  middleware: ['auth-guard']
})

const activeTab = ref('notifications')
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  background: #f9fafb;
  padding: 24px;
}

.settings-container {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 24px;
}

.settings-sidebar {
  background: white;
  border-radius: 8px;
  padding: 16px;
  height: fit-content;
  border: 1px solid #e5e7eb;
}

.settings-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  transition: all 0.2s;
  text-align: left;
  width: 100%;
}

.nav-item:hover {
  background: #f3f4f6;
  color: #111827;
}

.nav-item.active {
  background: #eef2ff;
  color: #6366f1;
}

.nav-item .icon {
  font-size: 18px;
}

.settings-content {
  background: white;
  border-radius: 8px;
  padding: 32px;
  border: 1px solid #e5e7eb;
  min-height: 600px;
}

.tab-content h2 {
  font-size: 24px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.tab-description {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

@media (max-width: 768px) {
  .settings-container {
    grid-template-columns: 1fr;
  }

  .settings-sidebar {
    order: 2;
  }

  .settings-content {
    order: 1;
  }

  .settings-nav {
    flex-direction: row;
    overflow-x: auto;
  }

  .nav-item span:not(.icon) {
    display: none;
  }
}
</style>
