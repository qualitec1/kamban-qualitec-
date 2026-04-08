# Tecnologias do Projeto

## Stack Principal

### Frontend Framework
- **Nuxt 4** (`nuxt ^4.4.2`) — Framework full-stack baseado em Vue 3, com SSR desabilitado (SPA mode)
- **Vue 3** (`vue ^3.5.30`) — Framework reativo para construção de interfaces
- **Vue Router 5** (`vue-router ^5.0.4`) — Roteamento client-side

### Linguagem
- **TypeScript** — Tipagem estática em todo o projeto (composables, plugins, tipos compartilhados)

---

## Backend / Banco de Dados

### Supabase
- **@supabase/supabase-js** (`^2.101.0`) — SDK oficial do Supabase
- **PostgreSQL** — Banco de dados relacional gerenciado pelo Supabase
- **Row Level Security (RLS)** — Políticas de segurança por linha no banco
- **Supabase Auth** — Autenticação com sessão persistente e auto-refresh de token
- **Supabase Storage** — Armazenamento de arquivos/anexos

### Estrutura do Banco
- `organizations` — Organizações
- `profiles` — Perfis de usuários
- `workspaces` — Espaços de trabalho
- `boards` — Quadros (kanban, scrum, list)
- `board_members` — Membros com roles (owner, editor, viewer, guest)
- `board_columns` — Colunas configuráveis por board
- `board_views` — Visualizações (board, kanban, calendar, timeline, gantt, cards, table)
- `tasks` — Tarefas
- `task_statuses` — Status customizáveis por board
- `task_priorities` — Prioridades customizáveis por board
- `task_groups` — Grupos de tarefas

---

## Estilização

### Tailwind CSS
- **@nuxtjs/tailwindcss** (`^6.14.0`) — Integração oficial do Tailwind com Nuxt
- **Tailwind CSS v3** — Utility-first CSS framework
- Configuração customizada com design tokens:
  - Cores: `primary`, `secondary`, `neutral`, `success`, `warning`, `error`, `info`
  - Tipografia: Escala customizada com Inter
  - Breakpoints: `sm (640px)`, `md (768px)`, `lg (1024px)`, `xl (1280px)`, `2xl (1536px)`

### Fonte
- **Inter** — Fonte principal (Google Fonts / system-ui fallback)

### CSS Customizado
- `app/assets/css/main.css` — Estilos globais
- `app/assets/css/tokens.css` — Design tokens como variáveis CSS
- `app/assets/css/typography.css` — Escala tipográfica

---

## Utilitários e Composables

### VueUse
- **@vueuse/core** (`^14.2.1`) — Coleção de composables utilitários para Vue
- **@vueuse/integrations** (`^14.2.1`) — Integrações do VueUse com bibliotecas externas

### Drag and Drop
- **SortableJS** (`sortablejs ^1.15.7`) — Biblioteca para drag-and-drop de listas e grids

### 3D / Animações
- **Three.js** (`three ^0.183.2`) — Biblioteca 3D WebGL para a cena de login animada
- **@types/three** (`^0.183.1`) — Tipos TypeScript para Three.js

---

## Deploy / Infraestrutura

### Vercel
- **@vercel/analytics** (`^2.0.1`) — Analytics integrado da Vercel
- Deploy automático via Vercel (configuração em `.vercel/`)

---

## Testes

### Vitest
- **vitest** (`^4.1.2`) — Framework de testes unitários (compatível com Vite)
- **@vitest/coverage-v8** (`^4.1.2`) — Cobertura de código com V8
- **@vue/test-utils** (`^2.4.6`) — Utilitários de teste para componentes Vue
- **happy-dom** (`^20.8.9`) — Implementação leve de DOM para ambiente de testes

---

## Ferramentas de Desenvolvimento

- **Nuxt DevTools** — Painel de debug integrado (habilitado em dev)
- **TypeScript** — Verificação de tipos em tempo de desenvolvimento
- **ESLint** — Linting (via Nuxt)
- **PostCSS** — Processamento de CSS (via Tailwind)

---

## Arquitetura do Projeto

```
/
├── app/
│   ├── components/     # Componentes Vue reutilizáveis
│   ├── composables/    # Lógica reativa compartilhada (useXxx)
│   ├── pages/          # Rotas automáticas do Nuxt
│   ├── plugins/        # Plugins Nuxt (Supabase, Auth)
│   ├── middleware/     # Guards de rota (auth, roles)
│   ├── assets/css/     # Estilos globais e tokens
│   └── utils/          # Funções utilitárias
├── shared/
│   └── types/          # Tipos TypeScript compartilhados (database.ts)
├── supabase/
│   └── migrations/     # Migrações SQL do banco de dados
├── tests/
│   └── security/       # Testes de segurança
├── nuxt.config.ts      # Configuração do Nuxt
├── tailwind.config.ts  # Configuração do Tailwind
└── package.json        # Dependências
```

---

## Padrões Utilizados

- **Composables** — Lógica de negócio encapsulada em funções reativas (`useBoards`, `useTasks`, etc.)
- **Teleport** — Dropdowns e modais renderizados no `<body>` para evitar problemas de z-index
- **RLS (Row Level Security)** — Segurança no nível do banco, não apenas no frontend
- **Mobile-First** — Layout responsivo com breakpoints Tailwind
- **SPA (Single Page Application)** — SSR desabilitado, renderização client-side
