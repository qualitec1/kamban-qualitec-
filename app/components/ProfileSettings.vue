<template>
  <div class="max-w-2xl">
    <!-- Header -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-neutral-900">Informações do Perfil</h2>
      <p class="mt-1 text-sm text-neutral-600">Atualize suas informações pessoais e de contato</p>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">

      <!-- Avatar -->
      <div>
        <label class="block text-sm font-medium text-neutral-700 mb-3">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Foto de Perfil
          </div>
        </label>

        <div class="flex items-center gap-5 mb-4">
          <!-- Preview do avatar atual -->
          <div class="w-20 h-20 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center border-2 border-neutral-200 shrink-0">
            <img v-if="form.avatarUrl" :src="form.avatarUrl" alt="Avatar" class="w-full h-full object-cover" />
            <span v-else class="text-2xl font-bold text-primary-600">
              {{ (form.fullName || form.email).charAt(0).toUpperCase() }}
            </span>
          </div>

          <div class="flex flex-col gap-2">
            <button type="button" @click="showAvatarPicker = !showAvatarPicker"
              class="px-4 py-2 text-sm font-medium text-primary-600 border border-primary-300 rounded-lg hover:bg-primary-50 transition-colors">
              Escolher personagem
            </button>
            <button v-if="form.avatarUrl" type="button" @click="form.avatarUrl = ''"
              class="px-4 py-2 text-sm font-medium text-neutral-500 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
              Remover foto
            </button>
          </div>
        </div>

        <!-- Picker de personagens -->
        <div v-if="showAvatarPicker" class="border border-neutral-200 rounded-xl overflow-hidden">
          <!-- Tabs -->
          <div class="flex border-b border-neutral-200 bg-neutral-50">
            <button
              v-for="tab in avatarTabs" :key="tab.id" type="button"
              @click="activeAvatarTab = tab.id; searchCharacters()"
              :class="['flex-1 px-4 py-2.5 text-sm font-medium transition-colors',
                activeAvatarTab === tab.id
                  ? 'bg-white text-primary-600 border-b-2 border-primary-500'
                  : 'text-neutral-500 hover:text-neutral-700']">
              {{ tab.label }}
            </button>
          </div>

          <!-- Busca -->
          <div class="p-3 border-b border-neutral-100">
            <div class="relative">
              <svg class="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                v-model="charSearch"
                type="text"
                :placeholder="activeAvatarTab === 'disney' ? 'Mickey Mouse, Simba...' : 'Spider-Man, Iron Man...'"
                class="w-full pl-9 pr-4 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
                @keydown.enter.prevent="searchCharacters"
              />
              <button type="button" @click="searchCharacters"
                class="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-medium bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
                Buscar
              </button>
            </div>
          </div>

          <!-- Resultados -->
          <div class="p-3 min-h-[120px]">
            <div v-if="charLoading" class="flex items-center justify-center py-8">
              <div class="w-6 h-6 rounded-full border-2 border-primary-400 border-t-transparent animate-spin" />
            </div>
            <div v-else-if="charError" class="text-center py-6 text-sm text-red-500">{{ charError }}</div>
            <div v-else-if="charResults.length === 0 && charSearch" class="text-center py-6 text-sm text-neutral-400">
              Nenhum personagem encontrado
            </div>
            <div v-else class="grid grid-cols-4 sm:grid-cols-6 gap-2">
              <button
                v-for="char in charResults" :key="char.id" type="button"
                @click="selectAvatar(char.imageUrl)"
                :class="['group flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all hover:bg-primary-50',
                  form.avatarUrl === char.imageUrl ? 'ring-2 ring-primary-500 bg-primary-50' : '']">
                <div class="w-12 h-12 rounded-full overflow-hidden bg-neutral-100 border-2 border-transparent group-hover:border-primary-300 transition-colors">
                  <img :src="char.imageUrl" :alt="char.name" class="w-full h-full object-cover" loading="lazy" />
                </div>
                <span class="text-[10px] text-neutral-500 text-center leading-tight line-clamp-2 w-full">{{ char.name }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

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
  phone: '',
  avatarUrl: ''
})

const originalData = ref({
  fullName: '',
  email: '',
  phone: '',
  avatarUrl: ''
})

// ── Avatar picker ──────────────────────────────────────────────────────────
const showAvatarPicker = ref(false)
const activeAvatarTab = ref<'disney' | 'marvel'>('disney')
const charSearch = ref('')
const charLoading = ref(false)
const charError = ref('')
const charResults = ref<{ id: string | number; name: string; imageUrl: string }[]>([])

const avatarTabs = [
  { id: 'disney' as const, label: '🏰 Disney' },
  { id: 'marvel' as const, label: '🦸 Marvel' },
]

async function searchCharacters() {
  charError.value = ''
  charResults.value = []
  charLoading.value = true

  try {
    if (activeAvatarTab.value === 'disney') {
      await searchDisney()
    } else {
      await searchMarvel()
    }
  } catch (e: any) {
    charError.value = 'Erro ao buscar personagens'
    console.error(e)
  } finally {
    charLoading.value = false
  }
}

async function searchDisney() {
  const query = charSearch.value.trim() || 'Mickey Mouse'
  const encoded = encodeURIComponent(query)
  const res = await fetch(`https://api.disneyapi.dev/character?name=${encoded}`)
  const data = await res.json()
  const list = data.data ?? []
  charResults.value = list
    .filter((c: any) => c.imageUrl)
    .slice(0, 18)
    .map((c: any) => ({ id: c._id, name: c.name, imageUrl: c.imageUrl }))
}

async function searchMarvel() {
  // A biblioteca npm 'marvel' usa a API pública da Marvel (developer.marvel.com)
  // Precisamos de chaves públicas/privadas — usamos fetch direto com timestamp + hash
  const publicKey = useRuntimeConfig().public.marvelPublicKey as string | undefined
  const privateKey = useRuntimeConfig().public.marvelPrivateKey as string | undefined

  if (!publicKey || !privateKey) {
    // Fallback: usar a API sem chaves (endpoint público limitado)
    charError.value = 'Configure MARVEL_PUBLIC_KEY e MARVEL_PRIVATE_KEY no .env para buscar personagens Marvel'
    return
  }

  const ts = Date.now().toString()
  // Hash md5(ts + privateKey + publicKey)
  const hashInput = ts + privateKey + publicKey
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(hashInput))
  const hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

  const query = charSearch.value.trim() || 'Spider-Man'
  const url = `https://gateway.marvel.com/v1/public/characters?nameStartsWith=${encodeURIComponent(query)}&ts=${ts}&apikey=${publicKey}&hash=${hash}&limit=18`
  const res = await fetch(url)
  const data = await res.json()
  const list = data.data?.results ?? []
  charResults.value = list
    .filter((c: any) => c.thumbnail?.path && !c.thumbnail.path.includes('image_not_available'))
    .map((c: any) => ({
      id: c.id,
      name: c.name,
      imageUrl: `${c.thumbnail.path}.${c.thumbnail.extension}`
    }))
}

function selectAvatar(url: string) {
  form.value.avatarUrl = url
  showAvatarPicker.value = false
}

// ── Profile CRUD ───────────────────────────────────────────────────────────
const hasChanges = computed(() => {
  return form.value.fullName !== originalData.value.fullName ||
         form.value.email !== originalData.value.email ||
         form.value.phone !== originalData.value.phone ||
         form.value.avatarUrl !== originalData.value.avatarUrl
})

const loadProfile = async () => {
  if (!user.value) return
  loading.value = true
  try {
    const { $supabase } = useNuxtApp()
    const supabase = $supabase as any
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, email, phone, avatar_url')
      .eq('id', user.value.id)
      .single()
    if (error) throw error
    if (data) {
      form.value = {
        fullName: data.full_name || '',
        email: data.email || '',
        phone: data.phone || '',
        avatarUrl: data.avatar_url || ''
      }
      originalData.value = { ...form.value }
    }
  } catch (err: any) {
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
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: form.value.fullName,
        phone: form.value.phone,
        avatar_url: form.value.avatarUrl || null
      })
      .eq('id', user.value.id)
    if (profileError) throw profileError

    if (form.value.email !== originalData.value.email) {
      const { error: emailError } = await supabase.auth.updateUser({ email: form.value.email })
      if (emailError) throw emailError
      showMessage('Perfil atualizado! Verifique seu novo e-mail para confirmar a alteração.', 'success')
    } else {
      showMessage('Perfil atualizado com sucesso!', 'success')
    }
    originalData.value = { ...form.value }
  } catch (err: any) {
    showMessage(err.message || 'Erro ao atualizar perfil', 'error')
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  form.value = { ...originalData.value }
  message.value = ''
  showAvatarPicker.value = false
}

const showMessage = (msg: string, type: 'success' | 'error') => {
  message.value = msg
  messageType.value = type
  setTimeout(() => { message.value = '' }, 5000)
}

onMounted(() => {
  loadProfile()
  // Carregar personagens Disney por padrão
  charSearch.value = ''
  searchCharacters()
})
</script>
