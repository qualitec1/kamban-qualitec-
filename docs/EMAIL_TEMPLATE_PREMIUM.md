# Template Premium de Email - Task Assignment

## Resumo das Alterações

Implementado novo template de email premium e moderno para notificações de atribuição de tarefa, baseado nas imagens de referência fornecidas.

## Arquivos Alterados

### 1. `server/utils/emailTemplates.ts` (NOVO)
- Arquivo criado com função `generateTaskAssignmentEmail()`
- Template HTML completo usando tabelas (compatível com clientes de email)
- Estrutura modular e reutilizável

### 2. `server/api/emails/task-assigned.post.ts` (MODIFICADO)
- Adicionada função `formatFileSize()` para formatar tamanho de arquivos
- Substituída geração inline do HTML por chamada ao template
- Lógica de envio mantida intacta (sem alterações)

## Características do Novo Template

### Estrutura Visual

1. **Header Limpo**
   - Ícone de checklist em roxo (#5B47FB)
   - Título "Task Assignment"
   - Fundo cinza claro (#F9FAFB)

2. **Título e Saudação**
   - Título grande "Nova Tarefa Atribuída"
   - Saudação personalizada com nome do usuário

3. **Card Principal**
   - Fundo branco com borda sutil
   - Título da tarefa em destaque
   - Badge de prioridade no canto superior direito (pill style)
   - Badge de status logo abaixo do título

4. **Nota da Tarefa**
   - Fundo amarelo claro (#FFFBEB)
   - Borda esquerda laranja (#F59E0B)
   - Ícone de nota

5. **Grid de Informações**
   - Layout em 2 colunas
   - Labels em uppercase cinza
   - Valores em destaque
   - Campos: Início, Vencimento, Orçamento, Grupo

6. **Seção de Subtarefas**
   - Header com ícone e título "Subtarefas"
   - Percentual de progresso à direita
   - Barra de progresso visual (roxo #5B47FB)
   - Lista de subtarefas em cards
   - Subtarefa concluída: check verde, texto riscado, fundo verde claro
   - Subtarefa pendente: círculo vazio, texto normal, fundo branco

7. **Seção de Anexos**
   - Header com ícone e título "Anexos"
   - Cards de arquivo com:
     - Ícone de documento em fundo roxo claro
     - Nome do arquivo
     - Tamanho e categoria

8. **Botão CTA**
   - Fundo roxo (#5B47FB)
   - Texto "Ver Tarefa Completa"
   - Ícone de seta à direita
   - Sombra suave
   - Centralizado

9. **Rodapé**
   - Links: View in Browser, Unsubscribe, Privacy Policy
   - Copyright discreto
   - Fundo cinza claro

### Compatibilidade Técnica

- **HTML com tabelas**: Estrutura baseada em `<table>` para máxima compatibilidade
- **CSS inline**: Todos os estilos inline para evitar problemas com clientes de email
- **SVG inline**: Ícones embutidos como SVG para melhor qualidade
- **Responsivo**: Largura máxima de 600px, adaptável a mobile
- **Fallback MSO**: Comentários condicionais para Outlook
- **Sem dependências externas**: Não usa imagens ou fontes externas

### Cores Principais

- **Roxo primário**: #5B47FB (botões, ícones, destaques)
- **Roxo claro**: #EEF2FF (fundos de ícones)
- **Verde sucesso**: #10B981 (subtarefas concluídas)
- **Verde claro**: #F0FDF4 (fundo subtarefas concluídas)
- **Amarelo nota**: #FFFBEB (fundo de notas)
- **Laranja nota**: #F59E0B (borda de notas)
- **Cinza texto**: #374151, #6B7280, #9CA3AF
- **Cinza fundo**: #F9FAFB, #F3F4F6

## Dados Suportados pelo Template

O template aceita um objeto com os seguintes campos:

```typescript
interface TaskEmailData {
  assigneeName: string              // Nome do destinatário
  taskTitle: string                 // Título da tarefa
  taskDescription?: string          // Descrição (opcional)
  taskNotes?: string                // Nota (opcional)
  boardName: string                 // Nome do board
  groupName?: string                // Nome do grupo (opcional)
  groupColor?: string               // Cor do grupo (opcional)
  statusName?: string               // Nome do status (opcional)
  statusColor?: string              // Cor do status (opcional)
  priorityName?: string             // Nome da prioridade (opcional)
  priorityColor?: string            // Cor da prioridade (opcional)
  startDate?: string                // Data de início formatada (opcional)
  dueDate?: string                  // Data de vencimento formatada (opcional)
  budget?: string                   // Orçamento formatado (opcional)
  subtasks?: Array<{                // Lista de subtarefas (opcional)
    title: string
    isDone: boolean
    statusName?: string
    statusColor?: string
  }>
  attachments?: Array<{             // Lista de anexos (opcional)
    fileName: string
    fileSize?: string
    category?: string
  }>
  taskUrl: string                   // URL para abrir a tarefa
  assignedBy?: string               // Nome de quem atribuiu (opcional)
  createdAt?: string                // Data de criação formatada (opcional)
  settingsUrl: string               // URL das configurações
}
```

## Confirmação: Lógica de Envio Não Alterada

✅ **A lógica de envio de email permanece 100% intacta:**

- Verificação de preferências de email
- Rate limiting (limites por hora e por dia)
- Busca de dados da tarefa no Supabase
- Validação de destinatário
- Configuração do transporter Nodemailer
- Envio do email
- Registro em `email_sent_log`
- Tratamento de erros
- Logs detalhados

**Única mudança**: A geração do HTML foi movida para uma função separada (`generateTaskAssignmentEmail`) para melhor organização e reutilização.

## Como Testar

1. Adicione um responsável a uma tarefa
2. O email será enviado com o novo template premium
3. Verifique:
   - Layout limpo e moderno
   - Todas as informações da tarefa visíveis
   - Subtarefas com barra de progresso
   - Anexos com ícones
   - Botão CTA funcionando
   - Responsividade em mobile

## Benefícios do Novo Template

1. **Visual Premium**: Design moderno e profissional
2. **Melhor Organização**: Informações estruturadas e fáceis de ler
3. **Compatibilidade**: Funciona em todos os clientes de email
4. **Responsivo**: Adapta-se a diferentes tamanhos de tela
5. **Reutilizável**: Função separada pode ser usada em outros emails
6. **Manutenível**: Código organizado e documentado
7. **Acessível**: Bom contraste e hierarquia visual

## Próximos Passos (Opcional)

- Adicionar suporte a dark mode
- Criar variantes para outros tipos de notificação
- Adicionar testes automatizados do template
- Criar preview do email no painel admin
