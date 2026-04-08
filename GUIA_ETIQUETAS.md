# Guia de Etiquetas (Labels)

## Visão Geral

Este projeto possui dois sistemas de etiquetas distintos, inspirados no Monday.com e Trello:

### 1. Etiquetas de Status e Prioridade (Monday.com)
- **Status** e **Prioridade** são as "etiquetas" principais do Monday.com
- Aparecem como botões grandes e coloridos (full-width)
- Cada tarefa tem apenas um status e uma prioridade
- Estilo visual: botões com fundo colorido e texto branco centralizado
- Componentes: `StatusCell.vue`, `PriorityCell.vue`

### 2. Labels/Tags Adicionais (Trello)
- Sistema complementar de tags coloridas para categorização livre
- Múltiplas labels por tarefa
- Estilo visual: badges pequenas com cores vibrantes
- Componente: `LabelsCell.vue`
- Útil para: categorias, projetos, departamentos, tipos de tarefa, etc.

## Funcionalidades

### Status e Prioridade (Etiquetas Monday.com)

**Estilo Visual:**
- Botões grandes e coloridos (120-200px de largura)
- Texto branco centralizado
- Fundo com cor sólida
- Hover com leve transparência
- Mobile: min-height 44px / Desktop: min-height 36px

**Dropdown:**
- Largura fixa de 280px
- Header com título da seção
- Botões grandes para cada opção (mesmo estilo do botão principal)
- Footer com "Editar etiquetas" para gerenciar opções
- Posicionamento inteligente (não sai da viewport)

**Como usar:**
1. Clique no botão de status ou prioridade da tarefa
2. Selecione uma opção no dropdown
3. A mudança é salva automaticamente

### Labels/Tags Adicionais (Sistema Trello)

**Estilo Visual:**
- Badges pequenas e coloridas
- Múltiplas labels por tarefa
- Mostra até 2 labels na linha (configurável)
- Indicador "+N" para labels adicionais

**Como criar:**
1. Clique na célula de labels de qualquer tarefa
2. Clique em "Criar nova etiqueta"
3. Digite o nome da label (máx. 50 caracteres)
4. Escolha uma cor da paleta
5. Clique em "Criar"

**Cores disponíveis:**
- 18 cores pré-definidas inspiradas no Tailwind CSS
- Formato hexadecimal (#RRGGBB)
- Cores vibrantes para fácil identificação visual

### Adicionar Labels às Tarefas

**Na linha da tarefa:**
- Clique na célula de labels
- Selecione as labels desejadas (múltipla seleção)
- As labels aparecem imediatamente

**No modal da tarefa:**
- Abra o modal da tarefa
- Na seção "Labels", clique para abrir o dropdown
- Selecione ou desmarque labels

### Visualização

**Na linha da tarefa:**
- Mostra até 2 labels por padrão (configurável)
- Labels adicionais são indicadas com "+N"
- Cores vibrantes para fácil identificação

**No modal da tarefa:**
- Mostra até 5 labels
- Lista completa disponível no dropdown

### Buscar Labels

No dropdown de labels:
- Digite no campo de busca
- Filtra labels por nome
- Busca case-insensitive

### Gerenciar Labels

**Editar label:**
- Atualmente não implementado (futuro)
- Será possível editar nome e cor

**Excluir label:**
- Atualmente não implementado (futuro)
- Removerá a label de todas as tarefas

## Diferenças entre os Sistemas

### Status/Prioridade (Monday.com)
- ✅ Um valor por tarefa (single-select)
- ✅ Botões grandes e coloridos
- ✅ Dropdown com botões grandes
- ✅ Gerenciamento centralizado por board
- ✅ Usado para workflow e organização principal

### Labels/Tags (Trello)
- ✅ Múltiplos valores por tarefa (multi-select)
- ✅ Badges pequenas e compactas
- ✅ Dropdown com checkboxes
- ✅ Criação inline rápida
- ✅ Usado para categorização livre e filtros

## Quando Usar Cada Sistema

**Use Status/Prioridade para:**
- Workflow da tarefa (A fazer, Em progresso, Concluído)
- Nível de urgência (Baixa, Média, Alta, Crítica)
- Estados mutuamente exclusivos

**Use Labels/Tags para:**
- Categorias de projeto (Frontend, Backend, Design)
- Departamentos (Marketing, Vendas, Suporte)
- Tipos de tarefa (Bug, Feature, Melhoria)
- Tags personalizadas e filtros customizados

## Segurança

### Validações Implementadas

**Nome da etiqueta:**
- Não pode ser vazio
- Máximo 50 caracteres
- Previne XSS (< > & " ' `)
- Previne SQL injection

**Cor da etiqueta:**
- Formato hexadecimal obrigatório (#RRGGBB)
- Validação no frontend e backend
- Normalização para lowercase

### Políticas RLS

**Tabela `labels`:**
- Apenas colaboradores e masters podem criar/editar/excluir
- Guests e observers têm acesso somente leitura

**Tabela `task_labels`:**
- Apenas colaboradores e masters podem adicionar/remover
- Vinculada às permissões da tarefa

### Índices de Performance

Índices criados para otimizar consultas:
- `idx_labels_board_id` - Buscar labels por board
- `idx_task_labels_task_id` - Buscar labels de uma tarefa
- `idx_task_labels_label_id` - Buscar tarefas com uma label
- `idx_task_labels_task_label` - Índice composto para queries complexas

## Arquitetura

### Sistemas de Etiquetas

**1. Status e Prioridade (Monday.com)**

Componentes:
- `StatusCell.vue` - Botão de status com dropdown
- `PriorityCell.vue` - Botão de prioridade com dropdown

Composables:
- `useTaskStatuses(boardId)` - Gerencia status do board
- `useTaskPriorities(boardId)` - Gerencia prioridades do board

Características:
- Botões grandes coloridos (120-200px)
- Dropdown com botões grandes (280px)
- Single-select (um valor por tarefa)
- Footer "Editar etiquetas" para gerenciamento

**2. Labels/Tags (Trello)**

Componentes:
- `LabelsCell.vue` - Badges de labels com dropdown

Composables:
- `useLabels(boardId)` - Gerencia labels de um board (CRUD completo)
- `useTaskLabels(taskId)` - Gerencia labels de uma tarefa específica

Características:
- Badges pequenas coloridas
- Dropdown com checkboxes (multi-select)
- Criação inline de novas labels
- Busca por nome

### Detalhes dos Composables

**`useLabels(boardId)`**
- Gerencia labels de um board
- CRUD completo de labels
- Validação de input
- Cache local reativo

**`useTaskLabels(taskId)`**
- Gerencia labels de uma tarefa específica
- Adicionar/remover labels
- Toggle de labels
- Sincronização com banco

### Componentes

**`LabelsCell.vue`**
- Exibe labels na linha da tarefa
- Dropdown para seleção
- Criação inline de novas labels
- Mobile-first (touch targets >= 44px)

### Banco de Dados

**Tabela `labels`:**
```sql
CREATE TABLE labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id),
  name TEXT NOT NULL,
  color TEXT NOT NULL
);
```

**Tabela `task_labels`:**
```sql
CREATE TABLE task_labels (
  task_id UUID NOT NULL REFERENCES tasks(id),
  label_id UUID NOT NULL REFERENCES labels(id),
  PRIMARY KEY (task_id, label_id)
);
```

## Uso no Código

### Criar uma label

```typescript
import { useLabels } from '~/composables/useLabels'

const { createLabel } = useLabels(boardId)

await createLabel('Urgente', '#ef4444')
```

### Adicionar label a uma tarefa

```typescript
import { useTaskLabels } from '~/composables/useTaskLabels'

const { addLabel } = useTaskLabels(taskId)

await addLabel(labelId)
```

### Listar labels de uma tarefa

```typescript
import { useTaskLabels } from '~/composables/useTaskLabels'

const { taskLabels, fetchTaskLabels } = useTaskLabels(taskId)

await fetchTaskLabels()
console.log(taskLabels.value) // Array de labels
```

## Filtros (Futuro)

Funcionalidades planejadas:
- Filtrar tarefas por label
- Filtros combinados (múltiplas labels)
- Salvar filtros personalizados
- Visualização por label (agrupamento)

## Boas Práticas

1. **Nomenclatura:**
   - Use nomes descritivos e curtos
   - Evite abreviações confusas
   - Mantenha consistência entre boards

2. **Cores:**
   - Use cores consistentes para categorias similares
   - Evite muitas cores diferentes
   - Considere acessibilidade (contraste)

3. **Organização:**
   - Crie labels antes de começar a usá-las
   - Não crie labels duplicadas
   - Revise e limpe labels não utilizadas

4. **Performance:**
   - Limite o número de labels por tarefa (recomendado: 3-5)
   - Use filtros para encontrar tarefas com labels específicas

## Testes

### Testes de Segurança

**`tests/security/labels-rls.test.ts`**
- Valida políticas RLS
- Previne acesso não autorizado
- Testa SQL injection e XSS

**`tests/security/labels-validation.test.ts`**
- Valida input de nome e cor
- Testa sanitização de dados
- Valida formato de UUID

### Executar Testes

```bash
npm run test
```

## Troubleshooting

### Labels não aparecem
- Verifique se o board_id está correto
- Confirme que o usuário tem permissão de leitura
- Verifique o console para erros

### Não consigo criar labels
- Verifique se o usuário é colaborador ou master
- Confirme que o nome não está vazio
- Verifique se a cor está no formato correto

### Performance lenta
- Verifique se os índices foram criados
- Limite o número de labels por board
- Use paginação para boards grandes

## Roadmap

Funcionalidades futuras:
- [ ] Editar labels existentes
- [ ] Excluir labels
- [ ] Filtrar tarefas por label
- [ ] Agrupar tarefas por label
- [ ] Estatísticas de uso de labels
- [ ] Importar/exportar labels
- [ ] Templates de labels por tipo de board
