# Guia de Otimização de Performance

## Otimizações Implementadas

### 1. Eliminação de N+1 Queries
**Problema anterior:**
- `fetchGroups()` → 1 query
- `fetchBoards()` → 1 query  
- `fetchBoardAccessRole()` → 1 query
- `fetchTasksForGroup()` para cada grupo → N queries

**Solução implementada:**
- Todas as queries executam em paralelo com `Promise.all()`
- Tarefas de TODOS os grupos carregam em UMA ÚNICA query usando `.in('group_id', groupIds)`
- Redução de N+3 queries para apenas 4 queries totais

### 2. Cache com Stale-While-Revalidate
**Implementação:**
- Cache em memória com TTL de 30 segundos
- Primeira visita: carrega do banco
- Visitas subsequentes: retorna cache instantaneamente + revalida em background
- Invalidação automática após mutações (criar/deletar grupo/tarefa)

**Benefícios:**
- Carregamento instantâneo em navegações repetidas
- Dados sempre atualizados em background
- Reduz carga no banco de dados

### 3. Composable Otimizado: useBoardData
**Responsabilidades:**
- Gerenciamento de cache
- Carregamento paralelo de dados
- Invalidação de cache
- Refresh seletivo de grupos

**Uso:**
```typescript
const {
  board,
  groups,
  tasksByGroup,
  canEdit,
  loading,
  error,
  fetchAll,
  invalidateCache,
  refreshGroupTasks
} = useBoardData(boardId)
```

## Próximas Otimizações Recomendadas

### 1. Loading Skeletons (Alta Prioridade)
Substituir loading state completo por skeletons:
- Mostrar estrutura do board enquanto carrega
- Melhor percepção de performance
- Usuário vê progresso visual

### 2. Virtual Scrolling (Média Prioridade)
Para boards com muitas tarefas (>100):
- Renderizar apenas tarefas visíveis no viewport
- Usar biblioteca como `vue-virtual-scroller`
- Reduz DOM nodes e melhora scroll

### 3. Paginação de Tarefas (Média Prioridade)
Para grupos com muitas tarefas:
- Carregar primeiras 50 tarefas
- "Load more" ou infinite scroll
- Reduz payload inicial

### 4. Debounce em Edições Inline (Baixa Prioridade)
Para campos editáveis (título, notas):
- Aguardar 500ms antes de salvar
- Reduz requests durante digitação
- Melhor UX

## Quando Usar Arquiteturas Avançadas

### Load Balancer
**Quando usar:**
- Múltiplas instâncias da aplicação
- Tráfego > 10.000 req/min
- Necessidade de alta disponibilidade

**Não aplicável agora porque:**
- Supabase já tem load balancing interno
- Tráfego atual não justifica

### DDD (Domain-Driven Design)
**Quando usar:**
- Domínio de negócio complexo
- Múltiplos bounded contexts
- Equipe grande (>10 devs)

**Aplicável parcialmente:**
- Já temos separação de domínios (boards, tasks, users)
- Composables funcionam como "services"
- Não precisa de camadas adicionais agora

### Event Sourcing
**Quando usar:**
- Necessidade de auditoria completa
- Replay de eventos
- Análise temporal de dados

**Não aplicável agora porque:**
- Já temos `activity_logs` para auditoria
- Complexidade não justifica benefício
- Aumentaria latência

### CQRS (Command Query Responsibility Segregation)
**Quando usar:**
- Leitura e escrita com padrões muito diferentes
- Necessidade de otimizar queries complexas
- Escalabilidade extrema

**Não aplicável agora porque:**
- Supabase já separa leitura (Postgres read replicas) e escrita
- Queries atuais são simples
- Overhead de sincronização não vale a pena

### Kafka / Message Queue
**Quando usar:**
- Processamento assíncrono pesado
- Integração entre múltiplos sistemas
- Necessidade de garantia de entrega

**Aplicável para:**
- Notificações (já temos via Supabase Realtime)
- Processamento de anexos grandes
- Relatórios pesados

**Não urgente porque:**
- Supabase Realtime resolve notificações
- Processamento atual é leve

## Métricas para Decisão

### Quando otimizar mais:
- Time to Interactive > 3s
- Largest Contentful Paint > 2.5s
- Total Blocking Time > 300ms
- Queries > 10 por página

### Quando escalar arquitetura:
- Requests simultâneos > 500/s
- Database CPU > 80% consistente
- Response time p95 > 1s
- Downtime > 0.1%

## Recomendação Atual

**Foco em:**
1. ✅ Cache e queries otimizadas (implementado)
2. 🔄 Loading skeletons (próximo passo)
3. 🔄 Virtual scrolling para listas grandes
4. 🔄 Monitoramento de performance (Sentry, Vercel Analytics)

**Não fazer agora:**
- Event sourcing
- CQRS
- Kafka
- Microservices

**Razão:** Otimizações de frontend e queries resolvem 90% dos problemas de performance. Arquiteturas complexas só se justificam com escala real (>1000 usuários simultâneos).
