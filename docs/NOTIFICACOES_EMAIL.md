# Sistema de Notificações por Email

## Visão Geral

Sistema completo de notificações por email com configurações personalizáveis por usuário, incluindo:
- Notificações automáticas quando tarefas são atribuídas
- Controle de frequência e limites de emails
- Resumos periódicos (digest)
- Rate limiting para evitar spam

## Funcionalidades

### 1. Notificações Automáticas

#### Tarefa Atribuída
- **Trigger**: Quando um usuário é adicionado como responsável de uma tarefa
- **Conteúdo**: Email completo com TODAS as informações da tarefa:
  - Título e descrição
  - Status e prioridade
  - Datas (início e vencimento)
  - Orçamento
  - Grupo e board
  - Etiquetas
  - Subtarefas (com status e responsáveis)
  - Anexos
  - Outros responsáveis
  - Link direto para a tarefa

#### Outras Notificações (Configuráveis)
- Atualizações em tarefas que participa
- Tarefas próximas do vencimento
- Tarefas concluídas

### 2. Configurações Personalizáveis

Cada usuário pode configurar:

#### Tipos de Notificação
- ✅ Tarefa atribuída (padrão: ativado)
- ✅ Atualizações em tarefas (padrão: ativado)
- ✅ Vencimento próximo (padrão: ativado)
- ⬜ Tarefas concluídas (padrão: desativado)

#### Resumos Periódicos (Digest)
- **Frequência**: Diário, Semanal ou Nunca
- **Horário**: Configurável (formato 24h)
- **Dia da semana**: Para resumos semanais

#### Limites de Email
- **Por hora**: 1-100 emails (padrão: 10)
- **Por dia**: 1-500 emails (padrão: 50)

### 3. Rate Limiting

O sistema verifica automaticamente:
- Quantos emails foram enviados na última hora
- Quantos emails foram enviados nas últimas 24 horas
- Bloqueia envio se limites forem excedidos

### 4. Estatísticas

Dashboard com:
- Emails enviados na última hora
- Emails enviados nas últimas 24 horas
- Histórico dos últimos 10 emails
- Comparação com limites configurados

## Estrutura do Banco de Dados

### Tabela: `email_preferences`

```sql
- user_id (PK, FK → profiles)
- task_assigned_enabled (boolean)
- task_updated_enabled (boolean)
- task_due_soon_enabled (boolean)
- task_completed_enabled (boolean)
- digest_enabled (boolean)
- digest_frequency (text: 'daily', 'weekly', 'never')
- digest_time (time)
- digest_day_of_week (int: 0-6)
- max_emails_per_hour (int)
- max_emails_per_day (int)
- created_at, updated_at (timestamptz)
```

### Tabela: `email_sent_log`

```sql
- id (PK)
- user_id (FK → profiles)
- email_type (text)
- task_id (FK → tasks, nullable)
- sent_at (timestamptz)
- created_at (timestamptz)
```

## APIs

### POST `/api/emails/task-assigned`

Envia email de notificação quando tarefa é atribuída.

**Body:**
```json
{
  "taskId": "uuid",
  "assigneeId": "uuid"
}
```

**Resposta:**
```json
{
  "success": true,
  "sent": true
}
```

**Casos de erro:**
```json
{
  "success": true,
  "skipped": true,
  "reason": "notifications_disabled"
}
```

```json
{
  "success": false,
  "error": "hourly_limit_exceeded"
}
```

## Composables

### `useEmailNotifications()`

```typescript
const {
  getEmailPreferences,      // Buscar preferências do usuário
  updateEmailPreferences,   // Atualizar preferências
  sendTaskAssignedEmail,    // Enviar email de tarefa atribuída
  getEmailStats            // Buscar estatísticas de emails
} = useEmailNotifications()
```

## Componentes

### `<EmailPreferencesSettings />`

Componente completo de configuração de preferências de email.

**Uso:**
```vue
<template>
  <EmailPreferencesSettings />
</template>
```

## Integração Automática

O envio de email é **automático** quando:

1. Um responsável é adicionado a uma tarefa via `useTaskAssignees().addAssignee()`
2. As preferências do usuário permitem (`task_assigned_enabled = true`)
3. Os limites de rate não foram excedidos

**Exemplo:**
```typescript
const { addAssignee } = useTaskAssignees(taskId)

// Adiciona responsável E envia email automaticamente
await addAssignee(userId)
```

## Configuração de Email

### Variáveis de Ambiente

```env
NUXT_EMAIL_USER=seu-email@dominio.com
NUXT_EMAIL_PASS=sua-senha
NUXT_EMAIL_SMTP=smtp.servidor.com
NUXT_EMAIL_PORT=465
NUXT_EMAIL_FROM_NAME=Nome do Sistema
NUXT_PUBLIC_APP_URL=https://seu-dominio.com
```

### Servidor SMTP

Atualmente configurado para **Skymail (Locaweb)**:
- Host: `smtp.skymail.net.br`
- Porta: `465` (SSL/TLS)
- Requer autenticação

## Template de Email

O email enviado inclui:

### Header
- Gradiente roxo com título "Nova Tarefa Atribuída"

### Conteúdo Principal
- Saudação personalizada
- Card da tarefa com:
  - Título em destaque
  - Descrição (se houver)
  - Nota resumida (se houver)
  - Grid de detalhes (status, prioridade, datas, orçamento, grupo)
  - Etiquetas coloridas
  - Lista de outros responsáveis

### Subtarefas
- Lista completa com:
  - Checkbox visual (✓ ou ○)
  - Status colorido
  - Data de vencimento
  - Responsáveis

### Anexos
- Lista de arquivos com:
  - Nome do arquivo
  - Categoria (se houver)

### CTA
- Botão "Ver Tarefa Completa" com link direto

### Footer
- Informações de quem atribuiu
- Data de criação
- Link para gerenciar preferências

## Segurança

### RLS (Row Level Security)

- ✅ Usuários só podem ver/editar suas próprias preferências
- ✅ Apenas masters podem ver logs de emails
- ✅ Preferências criadas automaticamente ao criar perfil

### Rate Limiting

- ✅ Verificação antes de cada envio
- ✅ Logs persistidos no banco
- ✅ Índices otimizados para queries rápidas

## Próximas Funcionalidades

- [ ] Notificações de atualização de tarefa
- [ ] Notificações de vencimento próximo
- [ ] Resumos periódicos (digest)
- [ ] Templates personalizáveis
- [ ] Notificações de menções (@user)
- [ ] Notificações de comentários
- [ ] Webhooks para integrações externas

## Troubleshooting

### Email não está sendo enviado

1. Verificar variáveis de ambiente
2. Verificar preferências do usuário (`task_assigned_enabled`)
3. Verificar limites de rate (console do navegador)
4. Verificar logs do servidor
5. Verificar credenciais SMTP

### Limites sendo excedidos

1. Aumentar `max_emails_per_hour` ou `max_emails_per_day`
2. Verificar se há loop de atribuições
3. Revisar logs em `email_sent_log`

### Preferências não salvando

1. Verificar RLS policies
2. Verificar se usuário está autenticado
3. Verificar console do navegador para erros

## Manutenção

### Limpeza de Logs

Recomenda-se limpar logs antigos periodicamente:

```sql
DELETE FROM email_sent_log
WHERE sent_at < NOW() - INTERVAL '30 days';
```

### Monitoramento

Queries úteis:

```sql
-- Emails enviados por usuário (últimas 24h)
SELECT 
  p.full_name,
  COUNT(*) as total_emails
FROM email_sent_log esl
JOIN profiles p ON p.id = esl.user_id
WHERE esl.sent_at >= NOW() - INTERVAL '24 hours'
GROUP BY p.id, p.full_name
ORDER BY total_emails DESC;

-- Tipos de email mais enviados
SELECT 
  email_type,
  COUNT(*) as total
FROM email_sent_log
WHERE sent_at >= NOW() - INTERVAL '7 days'
GROUP BY email_type
ORDER BY total DESC;
```
