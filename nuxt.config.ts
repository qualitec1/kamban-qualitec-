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
    public: {
      supabaseUrl: process.env.SUPABASE_URL ?? '',
      supabaseAnonKey: process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? ''
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