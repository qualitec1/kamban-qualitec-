# Atualização de Status e Prioridade - Monday.com Style

## 🎯 Resumo das Mudanças

Implementação completa de funcionalidades de gerenciamento de Status e Prioridade inspiradas no Monday.com:

### ✨ Novas Funcionalidades

1. **Ícones Específicos**
   - Status: Checkmark (Feito), Clock (Em andamento), Pause (Parado), Circle (Não iniciado)
   - Prioridade: Warning (Crítica), Arrow Up (Alta), Minus (Média), Arrow Down (Baixa)
   - Ícones aparecem no botão e no gerenciador

2. **Drag-and-Drop para Reordenar**
   - Reordene status/prioridades no gerenciador
   - Clique e arraste para mover
   - Feedback visual durante o arrasto

3. **Edição de Status/Prioridades**
   - Clique no ícone de 3 pontos para editar
   - Altere nome e cor
   - Salve com Enter ou Cancelar com Esc

4. **Criação de Novas Opções**
   - Campo "Adicionar etiq..." para criar rapidamente
   - Ou clique em "Nova etiqueta"
   - Escolha cor da paleta

5. **Botão "Editar etiquetas"**
   - Acesse o gerenciador de status/prioridades
   - Gerencie todas as opções do board
   - Reordene, edite ou crie novas opções

## 📝 Arquivos Modificados

### `app/components/StatusCell.vue`
- Adicionado drag-and-drop para reordenação
- Ícones específicos para cada status
- Melhor estrutura do gerenciador

### `app/components/PriorityCell.vue`
- Adicionado drag-and-drop para reordenação
- Ícones específicos para cada prioridade
- Melhor estrutura do gerenciador

### `app/utils/statusIcons.ts` (novo)
- Mapeamento de ícones para status e prioridades
- Funções para obter ícone baseado no nome
- SVGs dos ícones

## 🎨 Ícones Implementados

### Status
- **Feito/Concluído**: ✓ (Checkmark)
- **Em andamento**: ⏱ (Clock)
- **Parado/Bloqueado**: ⏸ (Pause)
- **Não iniciado/A fazer**: ○ (Circle)

### Prioridade
- **Crítica**: ⚠ (Warning)
- **Alta**: ↑ (Arrow Up)
- **Média**: − (Minus)
- **Baixa**: ↓ (Arrow Down)

## 🚀 Como Usar

### Editar Status/Prioridades
1. Clique no botão de Status ou Prioridade
2. Clique em "Editar etiquetas" no footer
3. Reordene, edite ou crie novas opções
4. Clique em "Aplicar"

### Reordenar
1. No gerenciador, clique e arraste uma opção
2. Solte sobre outra para reordenar

### Editar Nome/Cor
1. Clique no ícone de 3 pontos
2. Altere o nome e/ou cor
3. Pressione Enter para salvar

### Criar Nova Opção
1. Digite no campo "Adicionar etiq..."
2. Pressione Enter
3. Ou clique em "Nova etiqueta"

## 📊 Compatibilidade

- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Mobile (iOS Safari, Chrome Mobile)
- ✅ Drag-and-drop em desktop
- ✅ Touch-friendly em mobile

## 🐛 Testes Recomendados

1. Criar, editar e deletar status/prioridades
2. Reordenar com drag-and-drop
3. Verificar se ícones aparecem corretamente
4. Testar em mobile
5. Verificar se mudanças refletem em todas as tarefas

## 📚 Documentação

Veja `GUIA_ETIQUETAS.md` para documentação completa sobre etiquetas.
