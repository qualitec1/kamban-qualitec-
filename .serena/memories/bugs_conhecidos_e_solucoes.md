# Bugs Conhecidos e Soluções — Qualitec

## 1. IPC connection closed (Nuxt dev server crasha)

**Sintoma:**
```
ERROR [request error] [unhandled] [GET] http://localhost:3000/
Error: IPC connection closed
at Socket.onClose (vite-node.mjs:140:101)
```

**Causa:**
O processo filho do Nitro (SSR) crasha durante a compilação ou runtime. Geralmente causado por:
- Tag HTML sem fechar em algum arquivo `.vue` (ex: `<div>` sem `</div>`)
- Erro de sintaxe em arquivo Vue que o compilador não consegue processar
- Cache corrompido do `.nuxt`

**Como diagnosticar:**
1. Procurar por `Element is missing end tag` nos logs — indica qual arquivo e linha tem a tag sem fechar
2. Contar `<div>` vs `</div>` no template: `node -e "const fs=require('fs');const c=fs.readFileSync('arquivo.vue','utf8');const t=c.split('<script')[0];const o=(t.match(/<div[\s>]/g)||[]).length;const cl=(t.match(/<\/div>/g)||[]).length;const s=(t.match(/<div[^>]*\/>/g)||[]).length;console.log('Diff:',o-s-cl)"`
3. Se diff > 0, há divs sem fechar

**Solução:**
1. Corrigir a tag sem fechar no arquivo indicado
2. Limpar cache: `Remove-Item -Recurse -Force .nuxt`
3. Reiniciar: `npm run dev`

**Nota:** Só reiniciar o servidor NÃO resolve se o cache estiver corrompido. Sempre limpar o `.nuxt` junto.

---

## 2. POST boards 403 (Forbidden) — RLS com INSERT + SELECT

**Sintoma:**
```
POST /rest/v1/boards?select=* 403 (Forbidden)
new row violates row-level security policy for table "boards"
```

**Causa:**
O PostgREST, ao fazer `INSERT ... .select()`, tenta ler o registro recém-inserido via SELECT logo após o INSERT. Se o board for `private` e o usuário ainda não estiver em `board_members`, a política de SELECT bloqueia o retorno — resultando em 403 mesmo que o INSERT tenha permissão.

**Causa secundária:**
Políticas RLS com `ALL` sem `WITH CHECK` explícito causam 403 em INSERT/UPDATE mesmo para usuários com permissão.

**Solução aplicada:**
Criar uma função RPC `SECURITY DEFINER` que executa INSERT + board_members + task_groups numa única transação, contornando o problema de RLS no retorno:

```sql
CREATE OR REPLACE FUNCTION public.create_board_with_owner(...)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$ ... $$;
```

**Regra geral:**
- Sempre separar políticas por comando (`INSERT`, `SELECT`, `UPDATE`, `DELETE`) em vez de usar `ALL`
- Sempre incluir `WITH CHECK` em políticas de INSERT e UPDATE
- Quando INSERT precisa retornar o registro e há RLS complexo, usar função RPC `SECURITY DEFINER`

---

## 3. POST board_members 500 — Recursão infinita em RLS

**Sintoma:**
```
POST /rest/v1/board_members 500 (Internal Server Error)
infinite recursion detected in policy for relation "board_members"
```

**Causa:**
A política de SELECT em `boards` fazia subquery em `board_members`, e a política de `board_members` fazia subquery em `boards` — criando loop infinito.

**Solução:**
Usar a função `my_board_ids()` que é `SECURITY DEFINER` (executa sem RLS) em vez de subquery direta:

```sql
-- ERRADO — causa recursão:
USING (id IN (SELECT board_id FROM board_members WHERE user_id = auth.uid()))

-- CORRETO — usa função SECURITY DEFINER:
USING (id IN (SELECT public.my_board_ids()))
```

---

## 4. GET boards 406 — .single() sem resultado

**Sintoma:**
```
GET /rest/v1/boards?...&limit=1 406 (Not Acceptable)
```

**Causa:**
O `.single()` do Supabase retorna 406 quando a query retorna 0 ou mais de 1 resultado. Ocorreu ao tentar buscar o board recém-criado por nome+workspace antes de ter o `board_members` inserido (RLS bloqueava o SELECT).

**Solução:**
Usar função RPC que retorna o UUID do board criado, eliminando a necessidade de buscar por nome.
