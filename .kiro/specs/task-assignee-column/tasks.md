# Plano de Implementação — Coluna Responsável (Assignee Column)

## Visão Geral

Implementação da coluna de responsável na linha de tarefa do board. Escopo restrito à tarefa 4.1.7: criar os componentes `Avatar`, `AvatarStack`, `AssigneeCell`, `TaskRow` e o composable `useTaskAssignees`, integrando-os ao board existente.

---

## Tarefas

- [x] 1. Criar o tipo compartilhado `AssigneeProfile`
  - Criar `shared/types/assignee.ts` com a interface `AssigneeProfile` (campos: `id`, `full_name`, `email`, `avatar_url`)
  - _Requisitos: 3.3_

- [x] 2. Implementar o composable `useTaskAssignees`
  - [x] 2.1 Criar `app/composables/useTaskAssignees.ts`
    - Aceitar `taskId` como parâmetro
    - Query Supabase: `task_assignees` com join em `profiles` (campos: `id`, `full_name`, `email`, `avatar_url`)
    - Expor `assignees: Ref<AssigneeProfile[]>`, `loading: Ref<boolean>`, `error: Ref<string | null>`
    - Tratar erro sem lançar exceção; manter `assignees` como `[]` em caso de falha
    - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 2.2 Escrever teste de propriedade para `useTaskAssignees`
    - **Propriedade 6: Invariante de campos do composable**
    - **Valida: Requisitos 3.1, 3.3**
    - **Propriedade 7: Estado de loading do composable**
    - **Valida: Requisito 3.5**

- [x] 3. Implementar o componente `Avatar`
  - [x] 3.1 Criar `app/components/Avatar.vue`
    - Props: `profile: AssigneeProfile`, `size?: 'sm' | 'md'` (padrão `'sm'`)
    - Lógica de fallback: `avatar_url` → iniciais de `full_name` → iniciais de `email`
    - Quando renderizar `<img>`: incluir `alt` e `title` com o nome do responsável
    - Tratar erro de carregamento de imagem (`onerror`) ativando fallback para iniciais
    - Tamanhos: `sm` = `w-6 h-6`, `md` = `w-8 h-8`; usar `rounded-full` e `border border-white`
    - _Requisitos: 1.3, 1.4, 1.5, 5.1, 5.2_

  - [ ]* 3.2 Escrever testes de propriedade para `Avatar`
    - **Propriedade 3: Fallback de iniciais para avatar ausente**
    - **Valida: Requisitos 1.4, 1.5**
    - **Propriedade 4: Atributos de acessibilidade no Avatar com imagem**
    - **Valida: Requisitos 1.3, 5.1, 5.2**

- [x] 4. Implementar o componente `AvatarStack`
  - [x] 4.1 Criar `app/components/AvatarStack.vue`
    - Props: `assignees: AssigneeProfile[]`, `maxVisible?: number` (padrão `3`)
    - Renderizar todos os avatares quando `assignees.length <= maxVisible`
    - Renderizar os primeiros `maxVisible` + badge `+N` quando `assignees.length > maxVisible`
    - Aplicar sobreposição com `ml-[-8px]` nos avatares a partir do segundo
    - Atributo `title` no elemento raiz com todos os nomes completos (separados por vírgula)
    - _Requisitos: 2.1, 2.2, 2.3, 2.4_

  - [ ]* 4.2 Escrever testes de propriedade para `AvatarStack`
    - **Propriedade 1: Avatares renderizados para todos os responsáveis (≤ maxVisible)**
    - **Valida: Requisitos 1.1, 2.1**
    - **Propriedade 2: Truncamento correto para listas grandes**
    - **Valida: Requisito 2.2**
    - **Propriedade 5: Tooltip do AvatarStack contém todos os nomes**
    - **Valida: Requisito 2.3**

- [x] 5. Implementar o componente `AssigneeCell`
  - [x] 5.1 Criar `app/components/AssigneeCell.vue`
    - Props: `taskId: string`
    - Usar `useTaskAssignees(taskId)` para buscar responsáveis
    - Renderizar `AvatarStack` quando `assignees.length > 0`
    - Renderizar ícone de usuário neutro (`text-neutral-300`) quando `assignees` está vazio
    - Renderizar skeleton de carregamento enquanto `loading === true`
    - Em caso de erro, exibir estado vazio (sem mensagem de erro visível)
    - _Requisitos: 1.1, 1.2, 5.3, 5.4_

- [x] 6. Implementar o componente `TaskRow`
  - [x] 6.1 Criar `app/components/TaskRow.vue`
    - Props: `task` tipado com os campos necessários de `shared/types/database.ts` (`id`, `title`, `group_id`, `board_id`, `status_id`, `priority_id`, `due_date`)
    - Layout: `flex items-center gap-2 px-4 py-2 border-b border-neutral-100 hover:bg-neutral-50`
    - Renderizar título da tarefa (coluna principal, `flex-1`)
    - Renderizar `AssigneeCell` passando `task.id`
    - _Requisitos: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 6.2 Escrever teste de propriedade para `TaskRow`
    - **Propriedade 8: TaskRow renderiza título e AssigneeCell juntos**
    - **Valida: Requisitos 4.2, 4.3**

- [x] 7. Integrar `TaskRow` ao board existente
  - Editar `app/pages/boards/[id].vue`
  - Substituir o placeholder `<p class="text-label-sm text-muted italic">Nenhuma tarefa ainda.</p>` pela renderização de `TaskRow` para cada tarefa do grupo
  - Buscar tarefas do grupo via query Supabase (select básico: `id`, `title`, `group_id`, `board_id`, `status_id`, `priority_id`, `due_date`) filtrado por `group_id`
  - Manter o placeholder quando o grupo não possui tarefas
  - Atualizar `taskCountByGroup` com a contagem real de tarefas por grupo
  - _Requisitos: 4.4_

- [x] 8. Checkpoint — Verificar funcionamento completo
  - Garantir que todos os testes passam
  - Verificar que o board renderiza linhas de tarefa com avatares de responsáveis
  - Verificar que o estado vazio é exibido corretamente para tarefas sem responsável
  - Perguntar ao usuário se há dúvidas antes de concluir.

---

## Notas

- Tarefas marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido.
- Biblioteca de testes de propriedade recomendada: **`fast-check`** com Vitest (mínimo 100 iterações por propriedade).
- Cada teste de propriedade deve referenciar a propriedade do design no formato: `// Feature: task-assignee-column, Propriedade N: <texto>`.
- A busca de tarefas por grupo (tarefa 7) é intencional nesta fase — o composable dedicado de tarefas será criado em fase posterior do backlog.
