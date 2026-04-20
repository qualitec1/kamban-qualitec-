import { fileURLToPath } from 'node:url'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@vercel/analytics/nuxt'],
  css: ['~/assets/css/main.css'],
  alias: {
    '#shared': fileURLToPath(new URL('./shared', import.meta.url))
  },
  runtimeConfig: {
    // Private keys (server-side only)
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    emailUser: process.env.NUXT_EMAIL_USER ?? '',
    emailPass: process.env.NUXT_EMAIL_PASS ?? '',
    emailSmtp: process.env.NUXT_EMAIL_SMTP ?? '',
    emailPort: process.env.NUXT_EMAIL_PORT ?? '465',
    emailFromName: process.env.NUXT_EMAIL_FROM_NAME ?? 'Sistema Kanban',
    
    // Public keys (exposed to client)
    public: {
      supabaseUrl: process.env.SUPABASE_URL ?? '',
      supabaseAnonKey: process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? '',
      appUrl: process.env.NUXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    }
  },
  app: {
    head: {
      title: 'Qualitec',
      titleTemplate: '%s · Qualitec',
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'shortcut icon', href: '/favicon.png' },
        { rel: 'apple-touch-icon', href: '/favicon.png' },
      ],
      meta: [
        { name: 'description', content: 'Gestão de tarefas em equipe — Qualitec' },
        { property: 'og:title', content: 'Qualitec · Kanban' },
        { property: 'og:description', content: 'Gestão de tarefas em equipe — Qualitec' },
        { property: 'og:image', content: '/favicon.png' },
        { property: 'og:type', content: 'website' },
      ]
    }
  }
})