# Referência do Schema — Banco de Dados Qualitec Kanban

> Gerado em 27/05/2026 a partir de inspeção direta via MCP Supabase  
> Projeto: `ifftngadjtwgjsadqvep`

---

## Visão Geral

| Métrica | Valor |
|---|---|
| Total de tabelas | 38 |
| Tabelas com dados | 22 |
| Tabelas vazias | 16 |
| Total de registros | ~1.900 |

---

## Tabelas com Dados (em uso ativo)

### `activity_logs` — 1.300 registros
Registro de todas as ações realizadas no sistema (quem fez o quê e quando). Alimentado automaticamente por triggers no banco. É a base para o histórico de atividade visível nas tarefas.

Colunas principais: `actor_id`, `entity_type`, `entity_id`, `action`, `meta_json`

---

### `notifications` — 116 registros
Notificações in-app para os usuários (atribuição de tarefa, menção, mudança de status, etc). Exibidas no sino de notificações no header.

Colunas principais: `user_id`, `type`, `title`, `body`, `link`, `read_at`

---

### `tasks` — 92 registros
Tabela central do sistema. Cada linha é uma tarefa com título, descrição, datas, orçamento, status, prioridade e grupo.

Colunas principais: `board_id`, `group_id`, `title`, `status_id`, `priority_id`, `due_date`, `start_date`, `budget`, `notes`, `position`, `archived_at`

---

### `email_sent_log` — 73 registros
Log de todos os emails enviados pelo sistema (lembretes, notificações de atribuição, etc). Usado para controle de rate limiting e auditoria.

Colunas principais: `user_id`, `email_type`, `task_id`, `sent_at`

---

### `task_assignees` — 59 registros
Relacionamento N:N entre tarefas e usuários responsáveis. Cada linha representa um usuário atribuído a uma tarefa.

Colunas principais: `task_id`, `user_id`, `assigned_at`

---

### `task_statuses` — 40 registros
Status personalizados por board (ex: "A Fazer", "Em Progresso", "Concluído"). Cada board tem seu próprio conjunto de status. O campo `is_done` marca status que representam conclusão.

Colunas principais: `board_id`, `name`, `color`, `sort_order`, `is_done`

---

### `task_priorities` — 40 registros
Prioridades personalizadas por board (ex: "Crítica", "Alta", "Média", "Baixa"). Cada board tem seu próprio conjunto.

Colunas principais: `board_id`, `name`, `color`, `sort_order`

---

### `task_attachments` — 26 registros
Arquivos anexados às tarefas (documentos, imagens, etc). Armazenados no Supabase Storage, com metadados aqui.

Colunas principais: `task_id`, `file_name`, `file_path`, `mime_type`, `size_bytes`, `category`, `description`, `sort_order`, `uploaded_by`

---

### `subtasks` — 29 registros
Subtarefas vinculadas a uma tarefa principal. Têm seu próprio status, prioridade, data de vencimento e notas.

Colunas principais: `task_id`, `title`, `is_done`, `sort_order`, `status_id`, `priority_id`, `due_date`, `notes`

---

### `task_reminders` — 10 registros
Configurações de lembrete por email para cada usuário em cada tarefa. Quando `notify_all_assignees = true`, o lembrete é replicado para todos os responsáveis via RPC.

Colunas principais: `task_id`, `user_id`, `enabled`, `reminder_time`, `days_before`, `notify_all_assignees`

---

### `boards` — 10 registros
Boards (quadros) do sistema. Cada board pertence a um workspace e tem tipo (kanban, lista, etc) e visibilidade.

Colunas principais: `workspace_id`, `name`, `board_type`, `visibility`, `cover_color`, `created_by`

---

### `board_members` — 16 registros
Membros com acesso explícito a um board. Define o papel de cada usuário (`owner`, `editor`, `viewer`).

Colunas principais: `board_id`, `user_id`, `access_role`

---

### `task_groups` — 9 registros
Grupos de tarefas dentro de um board (equivalente às "seções" ou "grupos" do monday.com). As tarefas são organizadas dentro de grupos.

Colunas principais: `board_id`, `name`, `color`, `sort_order`, `is_collapsed`

---

### `profiles` — 7 registros
Perfil de cada usuário autenticado. Criado automaticamente via trigger quando um novo usuário se registra no Supabase Auth.

Colunas principais: `id` (= auth.users.id), `organization_id`, `full_name`, `email`, `avatar_url`, `role_global`, `status`, `job_title`, `phone`

---

### `email_preferences` — 7 registros
Preferências de notificação por email de cada usuário (quais tipos de email receber, horário do digest, limites de envio).

Colunas principais: `user_id`, `task_assigned_enabled`, `task_updated_enabled`, `task_due_soon_enabled`, `digest_enabled`, `digest_frequency`, `digest_time`, `max_emails_per_day`

---

### `user_managed_users` — 5 registros
Relacionamento de gestão entre usuários: um usuário "master" pode gerenciar outros usuários. Usado para delegação de acesso.

Colunas principais: `master_user_id`, `managed_user_id`

---

### `workspaces` — 2 registros
Workspaces da organização. Um workspace agrupa vários boards. Tem visibilidade própria (`public`, `org`, `private`).

Colunas principais: `organization_id`, `name`, `slug`, `visibility`, `created_by`

---

### `workspace_members` — 2 registros
Membros explícitos de um workspace privado. Necessário quando `visibility = 'private'`.

Colunas principais: `workspace_id`, `user_id`, `added_at`

---

### `board_collections` — 2 registros
Coleções que agrupam boards relacionados (ex: "Projetos 2026", "Clientes"). Visível na tela de coleções.

Colunas principais: `organization_id`, `name`, `description`, `color`, `created_by`

---

### `board_collection_items` — 2 registros
Relacionamento N:N entre coleções e boards. Define quais boards pertencem a qual coleção e a ordem de exibição.

Colunas principais: `collection_id`, `board_id`, `sort_order`

---

### `subtask_assignees` — 2 registros
Responsáveis atribuídos a subtarefas. Mesma lógica do `task_assignees`, mas para subtarefas.

Colunas principais: `subtask_id`, `user_id`

---

### `organizations` — 1 registro
Organização raiz do sistema. Todos os workspaces, boards e usuários pertencem a uma organização. Atualmente há apenas 1 organização (Qualitec).

Colunas principais: `name`, `slug`, `logo_url`, `cnpj`

---

## Tabelas Vazias (estrutura pronta, sem dados)

Estas tabelas existem e estão funcionais, mas ainda não têm dados porque as funcionalidades correspondentes ainda não foram implementadas no frontend ou não foram utilizadas.

---

### `task_updates` — 0 registros
Sistema de comentários e atualizações nas tarefas (feed de atividade). Suporta respostas aninhadas via `parent_id` e edição via `edited_at`. **Funcionalidade planejada.**

---

### `task_update_likes` — 0 registros
Curtidas em atualizações/comentários de tarefas. Depende de `task_updates`.

---

### `task_update_mentions` — 0 registros
Menções de usuários dentro de comentários (`@usuario`). Depende de `task_updates`.

---

### `task_update_reads` — 0 registros
Controle de leitura de atualizações por usuário (equivalente ao "visto" do WhatsApp). Depende de `task_updates`.

---

### `task_update_attachments` — 0 registros
Arquivos anexados diretamente em comentários/atualizações. Depende de `task_updates`. Armazena o arquivo em `file_data` (bytea).

---

### `user_favorites` — 0 registros
Boards marcados como favoritos pelo usuário. O botão de estrela já existe no header, mas o salvamento ainda não foi implementado.

---

### `user_recent_boards` — 0 registros
Histórico dos boards visitados recentemente por cada usuário. Seria alimentado automaticamente ao abrir um board.

---

### `task_invitations` — 0 registros
Convites por email para adicionar pessoas externas como responsáveis de uma tarefa. Inclui token de convite, expiração e status (`pending`, `accepted`, `rejected`). **Funcionalidade não implementada no frontend.**

---

### `task_labels` — 0 registros
Etiquetas aplicadas às tarefas. Depende da tabela `labels`. **Funcionalidade não implementada no frontend.**

---

### `labels` — 0 registros
Etiquetas coloridas personalizadas por board (ex: "Urgente", "Bug", "Feature"). Seriam exibidas como badges nas tarefas.

---

### `saved_filters` — 0 registros
Filtros salvos pelo usuário em um board específico (ou globais). Permite reutilizar combinações de filtros sem reconfigurar. **Não implementado no frontend.**

---

### `board_views` — 0 registros
Visualizações salvas de um board (kanban, lista, tabela, timeline, calendário, gantt). Cada view tem suas próprias configurações. **Estrutura pronta, frontend usa apenas kanban/tabela por enquanto.**

---

### `board_columns` — 0 registros
Colunas customizáveis por board, similar ao monday.com (texto, número, data, select, pessoa, etc). Suporta 24 tipos diferentes via enum `column_type`. **Funcionalidade avançada, não implementada.**

---

### `board_templates` — 0 registros
Templates de board para criar novos boards a partir de um modelo pré-configurado (estrutura de grupos, status, prioridades). **Não implementado no frontend.**

---

### `automations` — 0 registros
Regras de automação por board (ex: "quando status mudar para Concluído, notificar o criador"). Suporta `trigger_type` e `action_type` configuráveis via JSON. **Funcionalidade avançada, não implementada.**

---

### `subtask_attachments` — 0 registros
Anexos em subtarefas. A estrutura é idêntica ao `task_attachments`. O upload de arquivos em subtarefas ainda não foi implementado no frontend.

---

## Funções e Triggers

| Nome | Tipo | Descrição |
|---|---|---|
| `handle_new_user` | Trigger (auth.users) | Cria automaticamente um `profile` quando um novo usuário se registra |
| `handle_updated_at` | Trigger (várias tabelas) | Atualiza `updated_at` automaticamente em tasks, subtasks, task_updates, task_reminders |
| `upsert_reminders_for_assignees` | RPC (SECURITY DEFINER) | Cria/atualiza lembretes para todos os responsáveis de uma tarefa, bypassando RLS |
| `my_board_ids` | Função | Retorna os IDs dos boards acessíveis pelo usuário atual |
| `my_org` | Função | Retorna o `organization_id` do usuário atual |
| `my_role` | Função | Retorna o `role_global` do usuário atual |
| `log_task_activity` | Função | Registra ações em tarefas no `activity_logs` |
| `log_assignee_activity` | Função | Registra atribuições/remoções de responsáveis |
| `log_subtask_activity` | Função | Registra ações em subtarefas |
| `notify_task_assignment` | Função | Cria notificação ao atribuir uma tarefa |
| `notify_task_status_change` | Função | Cria notificação ao mudar status de uma tarefa |
| `create_default_email_preferences` | Função | Cria preferências de email padrão para novos usuários |
| `create_board_with_owner` | Função | Cria um board e adiciona o criador como `owner` em `board_members` |

---

## Enums

| Nome | Valores |
|---|---|
| `board_access_role` | `owner`, `editor`, `viewer` |
| `board_type` | `kanban`, `scrum`, `list`, `timeline` |
| `column_type` | 24 tipos (text, number, date, select, person, status, priority, ...) |
| `user_role` | `admin`, `manager`, `collaborator` |
| `user_status` | `active`, `inactive`, `pending` |
| `view_type` | `kanban`, `list`, `table`, `timeline`, `calendar`, `gantt` |
| `visibility_type` | `public`, `org`, `private` |
