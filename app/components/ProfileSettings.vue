<template>
  <div class="max-w-2xl">
    <!-- Header -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-neutral-900">Informações do Perfil</h2>
      <p class="mt-1 text-sm text-neutral-600">Atualize suas informações pessoais e de contato</p>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Nome Completo -->
      <div>
        <label for="fullName" class="block text-sm font-medium text-neutral-700 mb-2">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Nome Completo
          </div>
        </label>
        <input
          id="fullName"
          v-model="form.fullName"
          type="text"
          placeholder="Digite seu nome completo"
          :disabled="loading"
          class="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-neutral-50 disabled:text-neutral-500 disabled:cursor-not-allowed transition-colors"
        />
      </div>

      <!-- Email -->
      <div>
        <label for="email" class="block text-sm font-medium text-neutral-700 mb-2">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            E-mail
          </div>
        </label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          placeholder="seu@email.com"
          :disabled="loading"
          class="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-neutral-50 disabled:text-neutral-500 disabled:cursor-not-allowed transition-colors"
        />
        <p class="mt-1.5 text-xs text-neutral-500 flex items-center gap-1">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Alterar o e-mail requer verificação
        </p>
      </div>

      <!-- Telefone -->
      <div>
        <label for="phone" class="block text-sm font-medium text-neutral-700 mb-2">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Telefone
          </div>
        </label>
        <input
          id="phone"
          v-model="form.phone"
          type="tel"
          placeholder="(00) 00000-0000"
          :disabled="loading"
          class="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-neutral-50 disabled:text-neutral-500 disabled:cursor-not-allowed transition-colors"
        />
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-3 pt-4 border-t border-neutral-200">
        <button
          type="button"
          @click="handleCancel"
          :disabled="loading"
          class="px-4 py-2.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          :disabled="loading || !hasChanges"
          class="px-6 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <svg v-if="loading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          {{ loading ? 'Salvando...' : 'Salvar Alterações' }}
        </button>
      </div>

      <!-- Message -->
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0 translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-1"
      >
        <div v-if="message" :class="[
          'p-4 rounded-lg flex items-start gap-3',
          messageType === 'success' ? 'bg-success-50 text-success-800 border border-success-200' : 'bg-error-50 text-error-800 border border-error-200'
        ]">
          <svg v-if="messageType === 'success'" class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <svg v-else class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-sm font-medium">{{ message }}</p>
        </div>
      </Transition>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'

const { user } = useAuth()

const loading = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

const form = ref({
  fullName: '',
  email: '',
  phone: ''
})

const originalData = ref({
  fullName: '',
  email: '',
  phone: ''
})

const hasChanges = computed(() => {
  return form.value.fullName !== originalData.value.fullName ||
         form.value.email !== originalData.value.email ||
         form.value.phone !== originalData.value.phone
})

const loadProfile = async () => {
  if (!user.value) return

  loading.value = true
  try {
    const { $supabase } = useNuxtApp()
    const supabase = $supabase as any
    
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, email, phone')
      .eq('id', user.value.id)
      .single()

    if (error) throw error

    if (data) {
      form.value = {
        fullName: data.full_name || '',
        email: data.email || '',
        phone: data.phone || ''
      }
      originalData.value = { ...form.value }
    }
  } catch (err: any) {
    console.error('Erro ao carregar perfil:', err)
    showMessage('Erro ao carregar dados do perfil', 'error')
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  if (!user.value || !hasChanges.value) return

  loading.value = true
  message.value = ''

  try {
    const { $supabase } = useNuxtApp()
    const supabase = $supabase as any
    
    // Update profile data
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: form.value.fullName,
        phone: form.value.phone
      })
      .eq('id', user.value.id)

    if (profileError) throw profileError

    // If email changed, update auth email
    if (form.value.email !== originalData.value.email) {
      const { error: emailError } = await supabase.auth.updateUser({
        email: form.value.email
      })

      if (emailError) throw emailError
      
      showMessage('Perfil atualizado! Verifique seu novo e-mail para confirmar a alteração.', 'success')
    } else {
      showMessage('Perfil atualizado com sucesso!', 'success')
    }

    originalData.value = { ...form.value }
  } catch (err: any) {
    console.error('Erro ao atualizar perfil:', err)
    showMessage(err.message || 'Erro ao atualizar perfil', 'error')
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  form.value = { ...originalData.value }
  message.value = ''
}

const showMessage = (msg: string, type: 'success' | 'error') => {
  message.value = msg
  messageType.value = type
  setTimeout(() => {
    message.value = ''
  }, 5000)
}

onMounted(() => {
  loadProfile()
})
</script>
