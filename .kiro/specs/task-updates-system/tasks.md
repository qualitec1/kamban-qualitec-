# Tarefas - Sistema de Atualizações

## Fase 1: Fundação (MVP)

### 1.1 Database Schema
- [x] Criar migration para renomear `task_comments` → `task_updates`
- [x] Adicionar coluna `parent_id` em `task_updates` (para respostas)
- [x] Criar tabela `task_update_attachments`
- [x] Criar tabela `task_update_mentions`
- [x] Criar tabela `task_update_likes`
- [x] Criar tabela `task_update_reads`
- [x] Criar índices para performance
- [x] Aplicar migration

### 1.2 RLS Policies
- [x] Habilitar RLS em todas as novas tabelas
- [x] Policy: usuários podem ver atualizações de tarefas que têm acesso
- [x] Policy: apenas autor pode editar/deletar sua atualização
- [x] Policy: apenas membros do board podem criar atualizações
- [x] Policy: qualquer membro pode curtir
- [x] Policy: qualquer membro pode marcar como lida
- [ ] Testar policies com diferentes roles

### 1.3 Supabase Storage
- [ ] Criar bucket `task-update-attachments`
- [ ] Configurar políticas de acesso (apenas membros do board)
- [ ] Configurar limite de tamanho (10MB)
- [ ] Configurar tipos de arquivo permitidos

### 1.4 API Endpoints - Básico
- [ ] `POST /api/tasks/[id]/updates` - criar atualização
  - [ ] Validar permissões (membro do board)
  - [ ] Validar conteúdo (não vazio, max length)
  - [ ] Salvar no banco
  - [ ] Retornar atualização com autor
- [ ] `GET /api/tasks/[id]/updates` - listar atualizações
  - [ ] Validar permissões
  - [ ] Incluir autor (join com profiles)
  - [ ] Incluir contadores (likes, replies)
  - [ ] Paginação (20 por página)
  - [ ] Ordenar por created_at DESC

### 1.5 Composable - useTaskUpdates
- [x] Criar `app/composables/useTaskUpdates.ts`
- [x] Função `fetchUpdates(taskId)` - listar
- [x] Função `createUpdate(taskId, content)` - criar
- [x] Função `deleteUpdate(updateId)` - deletar
- [x] Estado reativo para lista de atualizações
- [x] Loading states
- [x] Error handling

### 1.6 Componente - LastUpdatedCell
- [ ] Criar `app/components/LastUpdatedCell.vue`
- [ ] Mostrar timestamp da última atualização
- [ ] Mostrar preview do conteúdo (truncado)
- [ ] Badge de contador de atualizações não lidas
- [ ] Ao clicar, abrir modal de atualizações
- [ ] Loading state
- [ ] Empty state ("Sem atualizações")

### 1.7 Componente - TaskUpdatesModal
- [x] Criar `app/components/TaskUpdatesModal.vue`
- [x] Modal fullscreen em mobile, sidebar em desktop
- [x] Header com título e botão fechar
- [x] Tabs: Atualizações | Arquivos | Atividades
- [x] Slot para composer (criar atualização)
- [x] Slot para lista de atualizações
- [x] Scroll infinito para paginação

### 1.8 Componente - TaskUpdateCard
- [x] Criar `app/components/TaskUpdateCard.vue`
- [x] Avatar do autor (circular, 40px)
- [x] Nome do autor e timestamp relativo
- [x] Conteúdo da atualização (texto simples por enquanto)
- [x] Botões de ação: Curtir | Responder (disabled por enquanto)
- [x] Contador de curtidas e respostas
- [x] Menu de opções (editar, deletar) - apenas para autor

### 1.9 Componente - TaskUpdateComposer
- [x] Criar `app/components/TaskUpdateComposer.vue`
- [x] Textarea expansível
- [x] Placeholder: "Escreva uma atualização..."
- [x] Botão "Enviar" (disabled se vazio)
- [x] Loading state ao enviar
- [x] Limpar campo após enviar
- [x] Foco automático ao abrir modal

### 1.10 Integração
- [ ] Integrar LastUpdatedCell no TaskRow
- [ ] Integrar TaskUpdatesModal no LastUpdatedCell
- [ ] Integrar TaskUpdateComposer no TaskUpdatesModal
- [ ] Integrar TaskUpdateCard no TaskUpdatesModal
- [ ] Testar fluxo completo: criar → visualizar → deletar

---

## Fase 2: Menções e Notificações

### 2.1 Sistema de Menções - Backend
- [ ] Criar função `extractMentions(content)` em `server/utils/mentions.ts`
- [ ] Validar que usuários mencionados são membros do board
- [ ] Salvar menções em `task_update_mentions`
- [ ] Integrar no endpoint de criar atualização

### 2.2 Sistema de Menções - Frontend
- [ ] Criar `app/components/MentionInput.vue`
- [ ] Detectar @ no texto
- [ ] Buscar membros do board (filtrar por nome/email)
- [ ] Mostrar dropdown de autocomplete
- [ ] Inserir menção no formato `@[uuid:nome]`
- [ ] Navegação por teclado (↑↓ Enter Esc)
- [ ] Destacar menções no texto (cor azul/roxo)

### 2.3 Renderização de Menções
- [ ] Criar função `renderMentions(content)` em `app/utils/mentions.ts`
- [ ] Substituir `@[uuid:nome]` por `<span class="mention">@nome</span>`
- [ ] Aplicar estilos de menção (cor, background, hover)
- [ ] Tooltip com informações do usuário ao hover

### 2.4 Notificações Internas
- [ ] Criar função `createNotification()` em `server/utils/notifications.ts`
- [ ] Ao criar atualização com menção, criar notificação para cada mencionado
- [ ] Tipo: `task_update_mention`
- [ ] Título: "Você foi mencionado em [Nome da Tarefa]"
- [ ] Body: Preview da atualização
- [ ] Link: `/boards/[boardId]?task=[taskId]&update=[updateId]`

### 2.5 Notificações por Email
- [ ] Criar template `server/templates/task-update-mention-email.html`
- [ ] Design inspirado no Monday.com
- [ ] Incluir: nome do autor, conteúdo, link para tarefa
- [ ] Criar função `sendMentionEmail()` em `server/utils/email.ts`
- [ ] Integrar no endpoint de criar atualização
- [ ] Enviar email para cada mencionado (async)
- [ ] Logging de emails enviados

### 2.6 Badge de Notificações
- [ ] Atualizar `AppHeader.vue` para mostrar contador de notificações
- [ ] Badge vermelho com número
- [ ] Atualizar em tempo real (polling ou realtime)
- [ ] Ao clicar, abrir painel de notificações

### 2.7 Painel de Notificações
- [ ] Criar `app/components/NotificationsPanel.vue`
- [ ] Listar notificações não lidas
- [ ] Marcar como lida ao clicar
- [ ] Link direto para a atualização
- [ ] Agrupar por tipo
- [ ] Botão "Marcar todas como lidas"

---

## Fase 3: Anexos e Áudio

### 3.1 Upload de Arquivos - Backend
- [ ] Criar endpoint `POST /api/updates/[id]/attachments`
- [ ] Validar permissões (autor da atualização ou membro do board)
- [ ] Validar tipo de arquivo (whitelist)
- [ ] Validar tamanho (max 10MB)
- [ ] Upload para Supabase Storage
- [ ] Salvar metadata em `task_update_attachments`
- [ ] Retornar attachment com download_url

### 3.2 Upload de Arquivos - Frontend
- [x] Criar `app/composables/useTaskUpdateAttachments.ts`
- [x] Função `uploadFile(updateId, file)`
- [x] Progress bar durante upload
- [x] Validação client-side (tipo, tamanho)
- [x] Error handling

### 3.3 Componente - AttachmentUploader
- [x] Integrado no `TaskUpdateComposer.vue`
- [x] Botão "Anexar arquivo" com ícone 📎
- [x] Input file oculto
- [ ] Drag & drop zone
- [x] Preview de arquivos selecionados
- [x] Botão remover antes de enviar
- [x] Lista de arquivos anexados após enviar

### 3.4 Componente - AttachmentList
- [x] Criar `app/components/TaskUpdateAttachmentsList.vue`
- [x] Listar anexos de uma atualização
- [x] Ícone baseado no tipo de arquivo
- [x] Nome do arquivo e tamanho
- [x] Preview inline para imagens
- [x] Botão de download
- [x] Player inline para áudios

### 3.5 Gravação de Áudio - Composable
- [x] Criar `app/composables/useAudioRecorder.ts`
- [x] Função `startRecording()` - solicitar permissão de microfone
- [x] Função `stopRecording()` - parar e retornar Blob
- [x] Função `pauseRecording()` / `resumeRecording()`
- [x] Estado reativo: isRecording, isPaused, duration
- [x] Usar MediaRecorder API
- [x] Converter para formato compatível (webm/mp3)

### 3.6 Componente - AudioRecorder
- [x] Integrado no `TaskUpdateComposer.vue`
- [x] Botão "Gravar áudio" com ícone 🎤
- [x] Solicitar permissão de microfone
- [x] Mostrar waveform durante gravação (opcional)
- [x] Timer de duração
- [x] Botões: Pausar | Parar | Cancelar
- [x] Preview do áudio gravado antes de enviar
- [x] Botão "Enviar áudio"

### 3.7 Componente - AudioPlayer
- [ ] Criar `app/components/AudioPlayer.vue`
- [ ] Player HTML5 customizado
- [ ] Botão play/pause
- [ ] Barra de progresso
- [ ] Timestamp (current / total)
- [ ] Controle de volume
- [ ] Botão de download
- [ ] Waveform visual (opcional)

### 3.8 Integração de Anexos
- [x] Integrar AttachmentUploader no TaskUpdateComposer
- [x] Integrar AttachmentList no TaskUpdateCard
- [x] Integrar AudioRecorder no TaskUpdateComposer
- [x] Integrar AudioPlayer no AttachmentList
- [ ] Testar upload de imagem → preview
- [ ] Testar upload de PDF → download
- [ ] Testar gravação de áudio → reprodução

---

## Fase 4: Respostas e Curtidas

### 4.1 Respostas (Threads) - Backend
- [ ] Atualizar endpoint `POST /api/tasks/[id]/updates` para aceitar `parent_id`
- [ ] Criar endpoint `GET /api/updates/[id]/replies` - listar respostas
- [ ] Incluir contador de respostas na query principal
- [ ] Validar que parent_id existe e pertence à mesma tarefa

### 4.2 Respostas (Threads) - Frontend
- [ ] Atualizar TaskUpdateCard para mostrar botão "Responder"
- [ ] Ao clicar, expandir campo de resposta abaixo
- [ ] Reutilizar TaskUpdateComposer com prop `parentId`
- [ ] Mostrar lista de respostas aninhadas
- [ ] Indentação visual (40px) e linha vertical
- [ ] Contador "Ver X respostas" (colapsável)
- [ ] Lazy loading de respostas

### 4.3 Curtidas - Backend
- [ ] Criar endpoint `POST /api/updates/[id]/like` - curtir/descurtir
- [ ] Toggle: se já curtiu, remove; se não, adiciona
- [ ] Retornar novo estado (is_liked, like_count)
- [ ] Validar permissões (membro do board)

### 4.4 Curtidas - Frontend
- [ ] Criar `app/composables/useTaskUpdateLikes.ts`
- [ ] Função `toggleLike(updateId)`
- [ ] Optimistic update (atualizar UI antes da resposta)
- [ ] Rollback em caso de erro
- [ ] Atualizar TaskUpdateCard com botão de curtir
- [ ] Ícone: 👍 (outline se não curtiu, filled se curtiu)
- [ ] Contador de curtidas
- [ ] Tooltip com lista de quem curtiu

### 4.5 Marcar como Lida
- [ ] Criar endpoint `POST /api/updates/[id]/mark-read`
- [ ] Salvar em `task_update_reads`
- [ ] Atualizar contador de não lidas no LastUpdatedCell
- [ ] Marcar automaticamente ao visualizar (IntersectionObserver)

### 4.6 Tab "Arquivos"
- [ ] Criar `app/components/TaskUpdatesFilesTab.vue`
- [ ] Listar todos os anexos da tarefa (de todas as atualizações)
- [ ] Agrupar por tipo (Imagens | Documentos | Áudios)
- [ ] Grid de thumbnails para imagens
- [ ] Lista com ícones para outros arquivos
- [ ] Filtros por tipo
- [ ] Busca por nome de arquivo

### 4.7 Tab "Atividades"
- [ ] Criar `app/components/TaskUpdatesActivityTab.vue`
- [ ] Listar atividades da tarefa (activity_logs)
- [ ] Formato: "João alterou o status para Concluído"
- [ ] Ícones por tipo de ação
- [ ] Timeline visual
- [ ] Filtros por tipo de atividade

---

## Fase 5: Polimento e Otimizações

### 5.1 Performance
- [ ] Implementar paginação infinita (scroll)
- [ ] Cache de membros do board
- [ ] Debounce no autocomplete de menções (300ms)
- [ ] Lazy loading de imagens
- [ ] Compressão de imagens antes do upload
- [ ] Otimizar queries (índices, joins)

### 5.2 UX Enhancements
- [ ] Animações de entrada/saída de atualizações
- [ ] Skeleton loading states
- [ ] Toast notifications para ações (curtir, responder)
- [ ] Confirmação antes de deletar
- [ ] Edição de atualização (com indicador "editado")
- [ ] Copiar link da atualização
- [ ] Fixar atualização importante no topo

### 5.3 Acessibilidade
- [ ] Adicionar aria-labels em todos os botões
- [ ] Suporte a navegação por teclado
- [ ] Anúncios com aria-live para novas atualizações
- [ ] Contraste adequado (WCAG AA)
- [ ] Focus visible em todos os elementos interativos
- [ ] Alt text para imagens anexadas

### 5.4 Mobile Responsiveness
- [ ] Modal fullscreen em mobile
- [ ] Botões com tamanho mínimo de 44px
- [ ] Swipe para fechar modal
- [ ] Teclado virtual não sobrepõe composer
- [ ] Touch-friendly (sem hover states)

### 5.5 Testes
- [ ] Testes unitários para utils (extractMentions, renderMentions)
- [ ] Testes de integração para endpoints
- [ ] Testes E2E para fluxos principais
- [ ] Testes de performance (load testing)
- [ ] Testes de acessibilidade (axe-core)

### 5.6 Documentação
- [ ] Documentar API endpoints (OpenAPI/Swagger)
- [ ] Documentar componentes (Storybook)
- [ ] Guia de uso para desenvolvedores
- [ ] Guia de uso para usuários finais
- [ ] Changelog

---

## Checklist de Segurança

- [ ] Todas as tabelas têm RLS habilitado
- [ ] Validação de permissões em todos os endpoints
- [ ] Sanitização de conteúdo (XSS)
- [ ] Validação de tipos de arquivo (whitelist)
- [ ] Limite de tamanho de arquivo (10MB)
- [ ] Rate limiting (10 atualizações/min)
- [ ] Validação de menções (apenas membros do board)
- [ ] Políticas de Storage (apenas membros do board)
- [ ] Logs de auditoria para ações sensíveis
- [ ] Testes de segurança (SQL injection, XSS, CSRF)

---

## Métricas de Sucesso

- [ ] Tempo médio para criar atualização < 5s
- [ ] Taxa de entrega de emails > 95%
- [ ] Notificações internas em < 1s
- [ ] Upload de 5MB em < 10s
- [ ] Gravação de áudio funcional em Chrome, Firefox, Safari
- [ ] 0 erros críticos em produção
- [ ] Feedback positivo dos usuários (NPS > 8)
