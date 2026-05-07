# 🔔 Setup de Lembretes Automáticos

## ✅ O que já está funcionando

- Interface para configurar lembretes nas tarefas
- Salvamento das configurações no banco de dados
- Edge Function criada e deployada no Supabase

## 📋 Próximos passos para ativar os emails

### 1. Criar conta no Resend (Serviço de Email)

1. Acesse: https://resend.com/signup
2. Crie uma conta gratuita (3000 emails/mês grátis)
3. Verifique seu email
4. Acesse: https://resend.com/api-keys
5. Clique em "Create API Key"
6. Copie a chave (começa com `re_`)

### 2. Configurar variáveis de ambiente no Supabase

1. Acesse: https://supabase.com/dashboard/project/ifftngadjtwgjsadqvep/settings/functions
2. Vá em "Edge Functions" → "Environment Variables"
3. Adicione as seguintes variáveis:

```
RESEND_API_KEY=re_sua_chave_aqui
APP_URL=http://localhost:3000
```

(ou use a URL de produção se já tiver deployado)

### 3. Configurar Cron Job (Agendamento)

Você tem 2 opções:

#### Opção A: Cron Job Externo (Recomendado para teste)

Use um serviço como https://cron-job.org (gratuito):

1. Crie uma conta
2. Crie um novo cron job:
   - **URL**: `https://ifftngadjtwgjsadqvep.supabase.co/functions/v1/send-task-reminders`
   - **Schedule**: A cada 5 minutos (para teste): `*/5 * * * *`
   - **Headers**: 
     - `Authorization: Bearer SEU_ANON_KEY_AQUI`
     - `Content-Type: application/json`

Para pegar o ANON_KEY:
```bash
# No terminal do projeto
cat .env | grep SUPABASE_KEY
```

#### Opção B: Supabase Cron (Nativo)

Execute esta query no SQL Editor do Supabase:

```sql
-- Criar extensão pg_cron se não existir
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendar para rodar a cada 5 minutos
SELECT cron.schedule(
  'send-task-reminders',
  '*/5 * * * *',
  $$
  SELECT
    net.http_post(
      url:='https://ifftngadjtwgjsadqvep.supabase.co/functions/v1/send-task-reminders',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer SEU_ANON_KEY_AQUI"}'::jsonb
    ) as request_id;
  $$
);
```

### 4. Testar

1. Configure um lembrete para uma tarefa com prazo próximo
2. Aguarde o cron job rodar (máximo 5 minutos)
3. Verifique seu email!

## 🔍 Como verificar se está funcionando

### Ver logs da função:

1. Acesse: https://supabase.com/dashboard/project/ifftngadjtwgjsadqvep/logs/edge-functions
2. Selecione a função `send-task-reminders`
3. Veja os logs em tempo real

### Testar manualmente:

Você pode chamar a função manualmente via curl:

```bash
curl -X POST \
  'https://ifftngadjtwgjsadqvep.supabase.co/functions/v1/send-task-reminders' \
  -H 'Authorization: Bearer SEU_ANON_KEY' \
  -H 'Content-Type: application/json'
```

## 📧 Como funciona

1. **Cron job roda a cada 5 minutos** (ou no horário que você configurar)
2. **Busca todos os lembretes ativos** no banco
3. **Para cada lembrete**:
   - Verifica se hoje é o dia de enviar (baseado em `days_before`)
   - Verifica se está no horário correto (±5 minutos de margem)
   - Se sim, envia o email via Resend
4. **Email contém**:
   - Título da tarefa
   - Descrição
   - Nome do quadro
   - Data de vencimento
   - Botão para acessar a tarefa

## 🎯 Configurações de produção

Para produção, recomendo:

1. **Cron a cada hora**: `0 * * * *` (no minuto 0 de cada hora)
2. **Domínio verificado no Resend** para não usar `onboarding@resend.dev`
3. **Monitoramento** dos logs para ver se emails estão sendo enviados
4. **Backup** da tabela `task_reminders`

## 🐛 Troubleshooting

### Emails não estão chegando?

1. Verifique os logs da Edge Function
2. Confirme que `RESEND_API_KEY` está configurada
3. Verifique se o cron job está rodando
4. Teste manualmente com curl

### Emails indo para spam?

1. Configure um domínio verificado no Resend
2. Adicione SPF/DKIM records no seu DNS

### Horário errado?

O Supabase usa UTC. Ajuste o horário do lembrete considerando o fuso horário.
