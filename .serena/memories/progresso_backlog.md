# Progresso do Backlog — Qualitec Kanban App

## Stack
- Nuxt 4, Vue 3, TypeScript, Tailwind CSS
- Supabase (Postgres + RLS + Auth)
- Estrutura: `app/pages`, `app/composables`, `app/components`, `shared/types`

## Tarefas concluídas nessa conversa

### Fase 3 — Workspaces e Boards
- ✅ 3.2.7 — Convidados em board (`BoardGuestManager.vue`, `useBoardGuests.ts`, RLS)
- ✅ 3.2.8 — Observadores (`board_access_role` enum + `observer`, RLS)
- ✅ 3.2.9 — Templates de boards (`board_templates` table, `useBoardTemplates.ts`)
- ✅ 3.2.10 — Coleções de boards (`board_collections` + `board_collection_items`, `useBoardCollections.ts`, `BoardCollectionCard.vue`, `collections.vue`)

### Fase 4 — Estrutura interna do board
- ✅ 4.1.1 — Grupo padrão ao criar board (criado via RPC `create_board_with_owner`)
- ✅ 4.1.2 — Criar novo grupo manualmente (`useTaskGroups.ts`, `boards/[id].vue`)
- ✅ 4.1.3 — Renomear grupo (inline, já implementado junto com 4.1.2)
- ✅ 4.1.4 — Reordenar grupos (drag & drop mouse + touch, `reorderGroups`)
- ✅ 4.1.5 — Colapsar grupo (já implementado junto com 4.1.2)
- ✅ 4.1.6 — Exibir/ocultar grupos vazios (toggle + localStorage)

## Próxima tarefa
**4.1.7 — Criar coluna Responsável**
- Exibir responsáveis de forma padronizada
- Coluna renderiza avatar e estado vazio
- Dependência: `board_columns` (type=`assignee`) + `task_assignees`
- Ainda não implementada

## Arquivos-chave criados/modificados
- `app/pages/boards/index.vue` — listagem de boards (movido de `boards.vue`)
- `app/pages/boards/[id].vue` — página interna do board com grupos
- `app/composables/useTaskGroups.ts` — CRUD + reorder + collapse de grupos
- `app/composables/useBoards.ts` — usa RPC `create_board_with_owner`
- `app/composables/useBoardTemplates.ts`
- `app/composables/useBoardCollections.ts`
- `app/composables/useBoardGuests.ts`
- `app/components/BoardGuestManager.vue`
- `app/components/BoardCollectionCard.vue`
- `app/pages/collections.vue`
- `shared/types/database.ts` — atualizado com board_templates, board_collections, board_collection_items, observer no enum

## Problemas resolvidos (ver bugs_conhecidos_e_solucoes.md)
- IPC connection closed → tag HTML sem fechar + cache .nuxt corrompido
- POST boards 403 → RLS com INSERT+SELECT, resolvido com RPC SECURITY DEFINER
- board_members 500 → recursão infinita em RLS, resolvido com my_board_ids()
- boards 406 → .single() sem resultado, resolvido com RPC que retorna UUID

## Configuração importante
- `nuxt.config.ts` tem `ssr: false` (adicionado para debug, pode remover se SSR for necessário)
- Função RPC `create_board_with_owner` no Supabase (SECURITY DEFINER)
- Função `my_board_ids()` no Supabase (SECURITY DEFINER, evita recursão RLS)
