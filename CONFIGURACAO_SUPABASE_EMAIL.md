# Configuração do Supabase - Desabilitar Confirmação de Email

## Problema Identificado

Os usuários conseguem se cadastrar (o registro aparece na tabela `auth.users`), mas não conseguem fazer login porque o Supabase está exigindo confirmação de email.

## Solução

Desabilitar a confirmação de email obrigatória no Supabase Dashboard.

## Passos para Configurar

1. Acesse o Supabase Dashboard: https://supabase.com/dashboard
2. Selecione seu projeto: `kamban-qualitec`
3. No menu lateral, vá em **Authentication** → **Providers**
4. Clique em **Email**
5. Desabilite a opção **"Confirm email"** (ou "Enable email confirmations")
6. Clique em **Save**

## Configuração Alternativa (via SQL)

Se preferir, você pode executar este SQL no Supabase SQL Editor:

```sql
-- Confirmar todos os emails existentes que ainda não foram confirmados
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;
```

## Verificação

Após a configuração, teste:

1. Crie uma nova conta com email e senha
2. Tente fazer login imediatamente (sem confirmar email)
3. O login deve funcionar sem problemas

## Observações

- Esta configuração permite que usuários façam login imediatamente após o cadastro
- Não é necessário confirmar o email para acessar o sistema
- Se você quiser manter a confirmação de email no futuro, será necessário implementar um fluxo de confirmação adequado
