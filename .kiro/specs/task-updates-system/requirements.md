# Sistema de Atualizações de Tarefas (Monday.com Style)

## Visão Geral
Implementar um sistema completo de atualizações/comentários para tarefas, inspirado no Monday.com, com suporte a:
- Menções (@mention) de usuários
- Anexos de arquivos e áudios
- Gravação de áudio diretamente na interface
- Notificações por email
- Notificações internas no sistema
- Respostas em thread
- Curtidas (likes)
- Visualização de quem viu a atualização

## Objetivos

### 1. Coluna "Última Atualização" (LastUpdatedCell)
- Mostrar preview da última atualização
- Ao clicar, abrir modal/painel com todas as atualizações
- Indicador visual de atualizações não lidas

### 2. Modal/Painel de Atualizações
- Tabs: "Atualizações" | "Arquivos" | "Atividades"
- Campo de texto rico para criar nova atualização
- Suporte a @menções com autocomplete
- Botões para anexar arquivo, gravar áudio
- Lista de atualizações em ordem cronológica reversa

### 3. Card de Atualização
- Avatar e nome do autor
- Timestamp relativo (ex: "Agora mesmo", "2h atrás")
- Conteúdo com @menções destacadas
- Anexos (arquivos, imagens, áudios) com preview
- Botões: Curtir | Responder
- Contador de curtidas e respostas
- Lista de respostas (thread)

### 4. Sistema de Menções
- Autocomplete ao digitar @
- Buscar apenas membros do board
- Destacar menções no texto renderizado
- Criar notificação para cada pessoa mencionada

### 5. Sistema de Anexos
- Upload de arquivos (imagens, PDFs, docs, etc)
- Gravação de áudio via navegador (MediaRecorder API)
- Preview de imagens inline
- Player de áudio inline
- Download de arquivos

### 6. Sistema de Notificações
- **Email**: Enviar email quando usuário é mencionado
- **Interna**: Criar notificação na tabela `notifications`
- Badge de contador no header
- Painel de notificações com link direto para a atualização

### 7. Respostas (Threads)
- Responder uma atualização específica
- Mesmo suporte de menções e anexos
- Aninhamento visual (indentação)
- Contador de respostas

### 8. Curtidas
- Botão de curtir/descurtir
- Contador de curtidas
- Lista de quem curtiu (tooltip ou modal)

## Requisitos Técnicos

### Banco de Dados

#### Tabela: `task_updates` (substituir `task_comments`)
```sql
- id (uuid, PK)
- task_id (uuid, FK -> tasks)
- author_id (uuid, FK -> profiles)
- content (text) -- texto com @menções
- parent_id (uuid, FK -> task_updates, nullable) -- para respostas
- created_at (timestamptz)
- updated_at (timestamptz)
- edited_at (timestamptz, nullable)
```

#### Tabela: `task_update_attachments`
```sql
- id (uuid, PK)
- update_id (uuid, FK -> task_updates)
- file_name (text)
- file_path (text) -- caminho no Supabase Storage
- mime_type (text)
- size_bytes (bigint)
- attachment_type (enum: 'file', 'audio', 'image')
- uploaded_by (uuid, FK -> profiles)
- created_at (timestamptz)
```

#### Tabela: `task_update_mentions`
```sql
- id (uuid, PK)
- update_id (uuid, FK -> task_updates)
- mentioned_user_id (uuid, FK -> profiles)
- created_at (timestamptz)
```

#### Tabela: `task_update_likes`
```sql
- update_id (uuid, FK -> task_updates)
- user_id (uuid, FK -> profiles)
- created_at (timestamptz)
- PRIMARY KEY (update_id, user_id)
```

#### Tabela: `task_update_reads`
```sql
- update_id (uuid, FK -> task_updates)
- user_id (uuid, FK -> profiles)
- read_at (timestamptz)
- PRIMARY KEY (update_id, user_id)
```

### Segurança (RLS)

Todas as tabelas devem ter RLS habilitado:
- Usuários podem ver atualizações de tarefas que têm acesso (via board_members)
- Apenas autor pode editar/deletar sua própria atualização
- Apenas membros do board podem criar atualizações
- SERVICE_ROLE_KEY para operações de notificação

### API Endpoints

#### `POST /api/tasks/[taskId]/updates`
- Criar nova atualização
- Processar @menções
- Criar notificações
- Enviar emails

#### `GET /api/tasks/[taskId]/updates`
- Listar todas as atualizações da tarefa
- Incluir: autor, anexos, curtidas, respostas
- Paginação

#### `POST /api/tasks/updates/[updateId]/reply`
- Responder uma atualização

#### `POST /api/tasks/updates/[updateId]/like`
- Curtir/descurtir

#### `POST /api/tasks/updates/[updateId]/attachments`
- Upload de arquivo/áudio

#### `POST /api/tasks/updates/[updateId]/mark-read`
- Marcar como lida

### Frontend

#### Componentes
- `LastUpdatedCell.vue` - célula na tabela do board
- `TaskUpdatesModal.vue` - modal principal
- `TaskUpdateCard.vue` - card de uma atualização
- `TaskUpdateComposer.vue` - campo para criar atualização
- `TaskUpdateMentionInput.vue` - input com autocomplete de @menções
- `TaskUpdateAttachments.vue` - lista de anexos
- `AudioRecorder.vue` - gravador de áudio
- `AudioPlayer.vue` - player de áudio

#### Composables
- `useTaskUpdates.ts` - CRUD de atualizações
- `useTaskUpdateMentions.ts` - lógica de @menções
- `useTaskUpdateAttachments.ts` - upload e gerenciamento de anexos
- `useAudioRecorder.ts` - gravação de áudio
- `useTaskUpdateNotifications.ts` - notificações

### Supabase Storage

Criar bucket: `task-update-attachments`
- Políticas de acesso: apenas membros do board
- Organização: `{board_id}/{task_id}/{update_id}/{filename}`

## Fluxo de Uso

### Criar Atualização com Menção
1. Usuário digita no campo de atualização
2. Ao digitar @, abre autocomplete com membros do board
3. Seleciona usuário, insere menção no texto
4. Adiciona anexos (opcional)
5. Clica em "Enviar"
6. Backend:
   - Salva atualização
   - Extrai @menções do texto
   - Cria registros em `task_update_mentions`
   - Cria notificações internas
   - Envia emails para mencionados
7. Frontend atualiza lista de atualizações

### Responder Atualização
1. Usuário clica em "Responder" em uma atualização
2. Abre campo de resposta abaixo da atualização
3. Mesmo fluxo de criação, mas com `parent_id` preenchido

### Curtir Atualização
1. Usuário clica no botão de curtir
2. Backend cria/deleta registro em `task_update_likes`
3. Frontend atualiza contador

### Notificação por Email
Template de email deve incluir:
- Nome do autor da atualização
- Conteúdo da atualização (com @menção destacada)
- Link direto para a tarefa
- Botão "Ver Atualização"

## Inspiração Visual (Monday.com)

- Cards de atualização com bordas arredondadas
- Avatar circular à esquerda
- Timestamp em cinza claro
- @Menções em azul/roxo
- Anexos com ícones e preview
- Botões de ação discretos (aparecem no hover)
- Thread de respostas com indentação e linha vertical

## Prioridades

### Fase 1 (MVP)
- [ ] Migração do banco (criar tabelas)
- [ ] RLS policies
- [ ] API endpoints básicos (criar, listar)
- [ ] Componente LastUpdatedCell
- [ ] Modal de atualizações
- [ ] Campo de texto simples (sem menções ainda)
- [ ] Lista de atualizações

### Fase 2
- [ ] Sistema de @menções
- [ ] Notificações internas
- [ ] Notificações por email

### Fase 3
- [ ] Upload de arquivos
- [ ] Gravação de áudio
- [ ] Player de áudio

### Fase 4
- [ ] Respostas (threads)
- [ ] Curtidas
- [ ] Marcar como lida

## Considerações de Segurança

1. **Validação de Permissões**
   - Verificar se usuário tem acesso ao board antes de criar atualização
   - Verificar se usuário mencionado é membro do board
   - Usar SERVICE_ROLE_KEY apenas em operações server-side

2. **Sanitização de Conteúdo**
   - Sanitizar HTML/XSS no conteúdo das atualizações
   - Validar tipos de arquivo permitidos
   - Limitar tamanho de arquivos (ex: 10MB)

3. **Rate Limiting**
   - Limitar número de atualizações por minuto
   - Limitar número de menções por atualização (ex: máx 10)

4. **Storage**
   - Políticas RLS no bucket
   - Validar extensões de arquivo
   - Scan de vírus (se possível)

## Métricas de Sucesso

- Tempo médio para criar uma atualização < 5s
- Taxa de entrega de emails > 95%
- Notificações internas em tempo real (< 1s)
- Upload de arquivos < 10s para arquivos de 5MB
- Gravação de áudio funcional em Chrome, Firefox, Safari
