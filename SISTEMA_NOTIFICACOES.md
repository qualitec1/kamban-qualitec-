# Sistema de Notificações em Tempo Real

## Visão Geral

Sistema de notificações automáticas similar ao Instagram, que notifica usuários sobre atividades em tarefas em tempo real.

## Funcionalidades

### 1. Tipos de Notificações

O sistema gera notificações automáticas para os seguintes eventos:

#### 📝 Novos Comentários (`task_comment`)
- **Quando**: Alguém adiciona um comentário em uma tarefa
- **Quem recebe**: 
  - Todos os responsáveis pela tarefa (exceto o autor do comentário)
  - Criador da tarefa (se não for responsável)
- **Mensagem**: "[Nome] comentou em '[Título da Tarefa]'"

#### ❤️ Curtidas em Comentários (`comment_like`)
- **Quando**: Alguém curte um comentário
- **Quem recebe**: Autor do comentário (exceto se curtiu o próprio comentário)
- **Mensagem**: "[Nome] curtiu seu comentário em '[Título da Tarefa]'"

#### 🔄 Mudança de Status (`task_status_change`)
- **Quando**: Status de uma tarefa é alterado
- **Quem recebe**: 
  - Todos os responsáveis pela tarefa
  - Criador da tarefa (se não for responsável)
- **Mensagem**: "Status de '[Título da Tarefa]' mudou para [Novo Status]"

#### 👤 Nova Atribuição (`task_assigned`)
- **Quando**: Alguém é atribuído como responsável de uma tarefa
- **Quem recebe**: Novo responsável
- **Mensagem**: "[Nome] atribuiu você à tarefa '[Título da Tarefa]'"

#### @️⃣ Menções (`task_mention`)
- **Quando**: Alguém menciona um usuário em um comentário (@usuario)
- **Quem recebe**: Usuário mencionado
- **Mensagem**: "[Nome] mencionou você em '[Título da Tarefa]'"

### 2. Interface Visual

#### Ícone de Notificação
- **Localização**: Header da aplicação (canto superior direito)
- **Badge vermelho**: Mostra o número de notificações não lidas
  - Exibe número até 9
  - Mostra "9+" quando há mais de 9 notificações
- **Animações**:
  - **Wiggle**: Ícone balança quando chega nova notificação
  - **Pulse**: Badge pulsa continuamente quando há notificações não lidas

#### Painel de Notificações
- **Abertura**: Clique no ícone de notificação
- **Conteúdo**:
  - Lista de notificações (mais recentes primeiro)
  - Indicador visual de não lidas (ponto azul)
  - Timestamp relativo (há 5min, há 2h, etc.)
  - Ações: Marcar como lida, Excluir
- **Header**: 
  - Contador de não lidas
  - Botão "Marcar todas como lidas"

### 3. Realtime

As notificações são sincronizadas em tempo real usando Supabase Realtime:
- Novas notificações aparecem instantaneamente
- Não é necessário recarregar a página
- Animações visuais alertam sobre novas notificações

## Implementação Técnica

### Banco de Dados

#### Tabela `notifications`
```sql
- id: UUID (PK)
- user_id: UUID (FK → profiles)
- type: TEXT (task_comment, comment_like, task_status_change, task_assigned, task_mention)
- title: TEXT
- body: TEXT
- link: TEXT (URL para a tarefa)
- read_at: TIMESTAMP (NULL = não lida)
- created_at: TIMESTAMP
```

#### Triggers Automáticos

1. **`trigger_notify_task_comment`**: Dispara ao inserir em `task_updates`
2. **`trigger_notify_comment_like`**: Dispara ao inserir em `task_update_likes`
3. **`trigger_notify_task_status_change`**: Dispara ao atualizar `tasks.status_id`
4. **`trigger_notify_task_assignment`**: Dispara ao inserir em `task_assignees`
5. **`trigger_notify_task_mention`**: Dispara ao inserir em `task_update_mentions`

#### Funções Auxiliares

- `get_task_assignees(task_id)`: Retorna responsáveis de uma tarefa
- `get_task_creator(task_id)`: Retorna criador de uma tarefa
- `get_task_title(task_id)`: Retorna título de uma tarefa
- `get_user_name(user_id)`: Retorna nome do usuário

### Frontend

#### Composable `useNotifications`
```typescript
- notifications: Ref<Notification[]>
- unreadCount: Ref<number>
- loading: Ref<boolean>
- fetchNotifications(): Promise<void>
- markAsRead(id: string): Promise<void>
- markAllAsRead(): Promise<void>
- deleteNotification(id: string): Promise<void>
- subscribeToNotifications(): Promise<() => void>
```

#### Componente `NotificationsPanel.vue`
- Ícone com badge no header
- Painel dropdown com lista de notificações
- Animações CSS (wiggle, pulse-scale)
- Watch para detectar novas notificações

## Fluxo de Funcionamento

1. **Evento ocorre** (ex: usuário comenta em tarefa)
2. **Trigger dispara** no banco de dados
3. **Notificação é criada** na tabela `notifications`
4. **Realtime envia** notificação para o frontend
5. **Frontend recebe** via subscription
6. **Animação dispara** (wiggle + pulse)
7. **Badge atualiza** com novo contador
8. **Usuário clica** no ícone
9. **Painel abre** mostrando notificações
10. **Usuário marca como lida** ou exclui

## Arquivos Relacionados

### Migrations
- `supabase/migrations/20260508000004_create_task_notification_triggers.sql`

### Frontend
- `app/composables/useNotifications.ts`
- `app/components/NotificationsPanel.vue`
- `app/components/AppHeader.vue`

## Melhorias Futuras

- [ ] Notificações push (browser notifications)
- [ ] Som ao receber notificação
- [ ] Filtros por tipo de notificação
- [ ] Configurações de preferências de notificação
- [ ] Notificações por email
- [ ] Agrupamento de notificações similares
- [ ] Marcar como lida ao clicar no link
- [ ] Histórico de notificações antigas (paginação)
