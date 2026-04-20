<template>
  <div class="email-preferences-settings">
    <div class="settings-header">
      <h2>Preferências de Email</h2>
      <p class="subtitle">Configure quando e como você deseja receber notificações por email</p>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Carregando preferências...</p>
    </div>

    <div v-else-if="preferences" class="settings-content">
      
      <!-- Notificações de Tarefas -->
      <section class="settings-section">
        <h3>Notificações de Tarefas</h3>
        <p class="section-description">Escolha quais eventos de tarefas devem gerar notificações por email</p>
        
        <div class="setting-item">
          <div class="setting-info">
            <label class="setting-label">
              <input 
                type="checkbox" 
                v-model="preferences.task_assigned_enabled"
                @change="savePreferences"
              />
              <span class="checkbox-custom"></span>
              <span class="label-text">Tarefa atribuída a mim</span>
            </label>
            <p class="setting-description">Receba um email quando uma tarefa for atribuída a você com todas as informações</p>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <label class="setting-label">
              <input 
                type="checkbox" 
                v-model="preferences.task_updated_enabled"
                @change="savePreferences"
              />
              <span class="checkbox-custom"></span>
              <span class="label-text">Atualizações em tarefas que participo</span>
            </label>
            <p class="setting-description">Notificações quando houver mudanças em tarefas onde você é responsável</p>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <label class="setting-label">
              <input 
                type="checkbox" 
                v-model="preferences.task_due_soon_enabled"
                @change="savePreferences"
              />
              <span class="checkbox-custom"></span>
              <span class="label-text">Tarefas próximas do vencimento</span>
            </label>
            <p class="setting-description">Alertas quando suas tarefas estiverem próximas da data de vencimento</p>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <label class="setting-label">
              <input 
                type="checkbox" 
                v-model="preferences.task_completed_enabled"
                @change="savePreferences"
              />
              <span class="checkbox-custom"></span>
              <span class="label-text">Tarefas concluídas</span>
            </label>
            <p class="setting-description">Notificações quando tarefas que você criou forem concluídas</p>
          </div>
        </div>
      </section>

      <!-- Resumos Periódicos -->
      <section class="settings-section">
        <h3>Resumos Periódicos (Digest)</h3>
        <p class="section-description">Receba um resumo consolidado das suas tarefas</p>
        
        <div class="setting-item">
          <div class="setting-info">
            <label class="setting-label">
              <input 
                type="checkbox" 
                v-model="preferences.digest_enabled"
                @change="savePreferences"
              />
              <span class="checkbox-custom"></span>
              <span class="label-text">Ativar resumos periódicos</span>
            </label>
            <p class="setting-description">Receba um email com resumo das suas tarefas pendentes</p>
          </div>
        </div>

        <div v-if="preferences.digest_enabled" class="digest-settings">
          <div class="form-group">
            <label>Frequência</label>
            <select v-model="preferences.digest_frequency" @change="savePreferences">
              <option value="daily">Diariamente</option>
              <option value="weekly">Semanalmente</option>
              <option value="never">Nunca</option>
            </select>
          </div>

          <div v-if="preferences.digest_frequency === 'daily'" class="form-group">
            <label>Horário do envio</label>
            <input 
              type="time" 
              v-model="preferences.digest_time"
              @change="savePreferences"
            />
            <p class="field-hint">Horário em que o resumo diário será enviado</p>
          </div>

          <div v-if="preferences.digest_frequency === 'weekly'" class="form-group">
            <label>Dia da semana</label>
            <select v-model.number="preferences.digest_day_of_week" @change="savePreferences">
              <option :value="0">Domingo</option>
              <option :value="1">Segunda-feira</option>
              <option :value="2">Terça-feira</option>
              <option :value="3">Quarta-feira</option>
              <option :value="4">Quinta-feira</option>
              <option :value="5">Sexta-feira</option>
              <option :value="6">Sábado</option>
            </select>
            <input 
              type="time" 
              v-model="preferences.digest_time"
              @change="savePreferences"
              style="margin-top: 10px;"
            />
          </div>
        </div>
      </section>

      <!-- Limites de Email -->
      <section class="settings-section">
        <h3>Limites de Email</h3>
        <p class="section-description">Controle a quantidade máxima de emails que você pode receber</p>
        
        <div class="form-group">
          <label>Máximo de emails por hora</label>
          <input 
            type="number" 
            v-model.number="preferences.max_emails_per_hour"
            @change="savePreferences"
            min="1"
            max="100"
          />
          <p class="field-hint">Limite: 1-100 emails por hora</p>
        </div>

        <div class="form-group">
          <label>Máximo de emails por dia</label>
          <input 
            type="number" 
            v-model.number="preferences.max_emails_per_day"
            @change="savePreferences"
            min="1"
            max="500"
          />
          <p class="field-hint">Limite: 1-500 emails por dia</p>
        </div>
      </section>

      <!-- Estatísticas -->
      <section v-if="stats" class="settings-section stats-section">
        <h3>Estatísticas de Emails</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ stats.emailsLastHour }}</div>
            <div class="stat-label">Última hora</div>
            <div class="stat-limit">Limite: {{ preferences.max_emails_per_hour }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ stats.emailsLastDay }}</div>
            <div class="stat-label">Últimas 24 horas</div>
            <div class="stat-limit">Limite: {{ preferences.max_emails_per_day }}</div>
          </div>
        </div>

        <div v-if="stats.recentEmails && stats.recentEmails.length > 0" class="recent-emails">
          <h4>Emails recentes</h4>
          <ul>
            <li v-for="email in stats.recentEmails" :key="email.id">
              <span class="email-type">{{ formatEmailType(email.email_type) }}</span>
              <span class="email-time">{{ formatTime(email.sent_at) }}</span>
            </li>
          </ul>
        </div>
      </section>

      <!-- Mensagem de sucesso -->
      <transition name="fade">
        <div v-if="showSuccess" class="success-message">
          ✓ Preferências salvas com sucesso!
        </div>
      </transition>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const { getEmailPreferences, updateEmailPreferences, getEmailStats } = useEmailNotifications()

const loading = ref(true)
const preferences = ref<any>(null)
const stats = ref<any>(null)
const showSuccess = ref(false)

onMounted(async () => {
  await loadPreferences()
  await loadStats()
  loading.value = false
})

async function loadPreferences() {
  preferences.value = await getEmailPreferences()
  
  // Se não existir, criar com valores padrão
  if (!preferences.value) {
    preferences.value = {
      task_assigned_enabled: true,
      task_updated_enabled: true,
      task_due_soon_enabled: true,
      task_completed_enabled: false,
      digest_enabled: false,
      digest_frequency: 'daily',
      digest_time: '09:00:00',
      digest_day_of_week: 1,
      max_emails_per_hour: 10,
      max_emails_per_day: 50
    }
  }
}

async function loadStats() {
  stats.value = await getEmailStats()
}

async function savePreferences() {
  const success = await updateEmailPreferences(preferences.value)
  
  if (success) {
    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 3000)
  }
}

function formatEmailType(type: string): string {
  const types: Record<string, string> = {
    'task_assigned': 'Tarefa atribuída',
    'task_updated': 'Tarefa atualizada',
    'task_due_soon': 'Vencimento próximo',
    'task_completed': 'Tarefa concluída',
    'digest': 'Resumo periódico'
  }
  return types[type] || type
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  
  if (minutes < 1) return 'Agora'
  if (minutes < 60) return `${minutes}m atrás`
  if (hours < 24) return `${hours}h atrás`
  
  return date.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.email-preferences-settings {
  max-width: 800px;
  margin: 0 auto;
}

.settings-header {
  margin-bottom: 32px;
}

.settings-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.settings-section {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 24px;
}

.settings-section h3 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.section-description {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 20px 0;
}

.setting-item {
  padding: 16px 0;
  border-bottom: 1px solid #f3f4f6;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  position: relative;
}

.setting-label input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  margin-right: 12px;
  position: relative;
  transition: all 0.2s;
  flex-shrink: 0;
}

.setting-label input[type="checkbox"]:checked + .checkbox-custom {
  background: #6366f1;
  border-color: #6366f1;
}

.setting-label input[type="checkbox"]:checked + .checkbox-custom::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 14px;
  font-weight: bold;
}

.label-text {
  font-size: 15px;
  font-weight: 500;
  color: #111827;
}

.setting-description {
  font-size: 13px;
  color: #6b7280;
  margin: 8px 0 0 32px;
}

.digest-settings {
  margin-top: 16px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.form-group select,
.form-group input[type="time"],
.form-group input[type="number"] {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  color: #111827;
  background: white;
  transition: border-color 0.2s;
}

.form-group select:focus,
.form-group input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.field-hint {
  font-size: 12px;
  color: #9ca3af;
  margin: 0;
}

.stats-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stats-section h3 {
  color: white;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.stat-value {
  font-size: 36px;
  font-weight: 700;
  color: white;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 4px;
}

.stat-limit {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.recent-emails {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.recent-emails h4 {
  font-size: 16px;
  font-weight: 600;
  color: white;
  margin: 0 0 12px 0;
}

.recent-emails ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recent-emails li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  font-size: 13px;
}

.email-type {
  color: white;
  font-weight: 500;
}

.email-time {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
}

.success-message {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #10b981;
  color: white;
  padding: 16px 24px;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
  font-weight: 500;
  z-index: 1000;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
