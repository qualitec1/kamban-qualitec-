# Rollback: Otimizações de Cache Removidas - 08/04/2026

## Problema
Após implementar cache agressivo em status e prioridades, o sistema ficou mais lento e algumas colunas pararam de carregar.

## Causa
Cache muito complexo causou race conditions e bloqueios no carregamento.

## Solução
Rollback completo do cache de status/prioridades. Mantida apenas a otimização principal:

### Otimização Mantida: useBoardData
- Carrega board, grupos, role e tarefas em paralelo
- Tarefas de TODOS os grupos em UMA query usando `.in('group_id', groupIds)`
- Cache do board com stale-while-revalidate (30s TTL)

### Removido:
- Cache de status/prioridades
- Pré-carregamento de status/prioridades
- Lógica complexa de race condition

## Estado Atual
- `useTaskStatuses`: versão simples, sem cache
- `useTaskPriorities`: versão simples, sem cache
- `useBoardData`: mantém cache apenas dos dados do board

## Resultado
Sistema volta ao estado funcional. Cada célula faz sua própria query de status/prioridade, mas isso é aceitável porque:
1. Queries são rápidas (~50ms cada)
2. Supabase tem connection pooling
3. Não causa problemas de UX perceptíveis

## Próximos Passos
Se performance de status/prioridades ainda for problema:
1. Implementar loading skeletons (melhor percepção)
2. Usar virtual scrolling (renderizar apenas visíveis)
3. Considerar server-side rendering com dados pré-carregados
