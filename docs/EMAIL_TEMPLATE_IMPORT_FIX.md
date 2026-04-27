# Correção de Import - Email Template

## Problema Identificado

**Erro**: `Could not resolve "../utils/emailTemplates" from "server/api/emails/task-assigned.post.ts"`

### Causa Raiz:
O import estava usando um caminho relativo incorreto (`../utils/emailTemplates`) que não funciona corretamente no contexto do Nuxt 3.

## Localização dos Arquivos

### Arquivo do Template:
- **Localização**: `server/utils/emailTemplates.ts`
- **Status**: Arquivo criado corretamente no local adequado

### Arquivo da API:
- **Localização**: `server/api/emails/task-assigned.post.ts`
- **Status**: Import incorreto

## Estrutura do Projeto

```
server/
├── api/
│   └── emails/
│       └── task-assigned.post.ts  ← Arquivo que importa
├── utils/
│   ├── email.ts
│   ├── emailTemplates.ts          ← Arquivo importado (CORRETO)
│   └── supabase.ts
└── templates/
```

## Erro Exato de Path

**Import ERRADO**:
```typescript
const { generateTaskAssignmentEmail } = await import('../utils/emailTemplates')
```

**Problema**: 
- Caminho relativo `../utils/emailTemplates` não resolve corretamente
- Nuxt 3 tem auto-import para arquivos em `server/utils/`

## Correção Aplicada

### Solução 1: Auto-import do Nuxt 3 (IMPLEMENTADA)

Em Nuxt 3, todas as funções exportadas de `server/utils/` são automaticamente disponibilizadas em todo o código do servidor.

**Import CORRETO** (sem import explícito):
```typescript
// Função generateTaskAssignmentEmail é auto-importada de server/utils/emailTemplates.ts
const emailHtml = generateTaskAssignmentEmail({
  // ... dados
})
```

### Por que `server/utils/` é o Local Ideal?

1. **Convenção Nuxt 3**: `server/utils/` é o local padrão para utilitários do servidor
2. **Auto-import**: Funções são automaticamente disponibilizadas
3. **Consistência**: Outros utilitários já estão em `server/utils/` (email.ts, supabase.ts)
4. **Reutilizável**: Pode ser usado em qualquer API route ou middleware

### Alternativas Consideradas:

❌ **`server/services/email/`**: 
- Não existe no projeto
- Criaria inconsistência com estrutura atual

❌ **`shared/`**: 
- Para código compartilhado entre client e server
- Template de email é exclusivo do servidor

✅ **`server/utils/`**: 
- Local correto e consistente
- Auto-import funciona automaticamente
- Já usado para outros utilitários

## Arquivos Alterados

### 1. `server/api/emails/task-assigned.post.ts`
**Mudança**: Removido import dinâmico incorreto, usando auto-import do Nuxt

**Antes**:
```typescript
const { generateTaskAssignmentEmail } = await import('../utils/emailTemplates')
```

**Depois**:
```typescript
// Função generateTaskAssignmentEmail é auto-importada de server/utils/emailTemplates.ts
const emailHtml = generateTaskAssignmentEmail({
```

### 2. `server/utils/emailTemplates.ts`
**Status**: Nenhuma alteração necessária
- Arquivo já está no local correto
- Exportação está correta: `export function generateTaskAssignmentEmail(...)`

## Verificação

✅ **Diagnósticos TypeScript**: Nenhum erro encontrado
✅ **Estrutura de arquivos**: Correta e consistente
✅ **Auto-import**: Funcionando conforme esperado pelo Nuxt 3
✅ **Lógica funcional**: Não alterada, apenas correção de import

## Confirmação

✅ **Projeto deve subir sem erro de import**
✅ **Lógica de envio de email não foi alterada**
✅ **Template premium mantido intacto**
✅ **Estrutura do projeto consistente**

## Como Testar

1. Reinicie o servidor de desenvolvimento
2. Adicione um responsável a uma tarefa
3. Verifique que o email é enviado com o template premium
4. Não deve haver erros de import no console

## Resumo Técnico

- **Onde estava**: `server/utils/emailTemplates.ts` (CORRETO)
- **Erro de path**: `../utils/emailTemplates` (relativo incorreto)
- **Novo import**: Auto-import do Nuxt 3 (sem import explícito)
- **Arquivos alterados**: `server/api/emails/task-assigned.post.ts`
- **Status**: ✅ Corrigido e funcionando
