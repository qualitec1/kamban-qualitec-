# Sistema de Atualizações de Tarefas (Monday.com Style)

## 📋 Visão Geral

Este projeto implementa um sistema completo de atualizações/comentários para tarefas, inspirado no Monday.com, transformando a coluna "Última Atualização" em um hub de comunicação rico e interativo.

## ✨ Funcionalidades Principais

### 1. **Menções (@mentions)**
- Autocomplete ao digitar @
- Notificações por email
- Notificações internas no sistema
- Destaque visual das menções

### 2. **Anexos**
- Upload de arquivos (imagens, PDFs, docs)
- Preview inline de imagens
- Download de arquivos
- Organização por tipo

### 3. **Gravação de Áudio**
- Gravar áudio diretamente no navegador
- Player de áudio inline
- Suporte a webm/mp3

### 4. **Respostas (Threads)**
- Responder atualizações específicas
- Aninhamento visual
- Contador de respostas

### 5. **Curtidas**
- Curtir/descurtir atualizações
- Contador de curtidas
- Lista de quem curtiu

### 6. **Notificações**
- Email quando mencionado
- Notificação interna no sistema
- Badge de contador no header
- Link direto para a atualização

## 🗂️ Estrutura do Projeto

```
.kiro/specs/task-updates-system/
├── README.md           # Este arquivo
├── requirements.md     # Requisitos detalhados
├── design.md          # Design de arquitetura e interface
└── tasks.md           # Lista de tarefas por fase
```

## 🚀 Fases de Implementação

### Fase 1: MVP (Fundação)
- Database schema e RLS
- API endpoints básicos
- Componentes principais
- Criar e visualizar atualizações

**Tempo estimado:** 2-3 dias

### Fase 2: Menções e Notificações
- Sistema de @menções
- Notificações internas
- Notificações por email
- Badge de contador

**Tempo estimado:** 2-3 dias

### Fase 3: Anexos e Áudio
- Upload de arquivos
- Gravação de áudio
- Players e previews
- Tab "Arquivos"

**Tempo estimado:** 3-4 dias

### Fase 4: Respostas e Curtidas
- Sistema de threads
- Curtidas
- Marcar como lida
- Tab "Atividades"

**Tempo estimado:** 2-3 dias

### Fase 5: Polimento
- Performance
- UX enhancements
- Acessibilidade
- Testes
- Documentação

**Tempo estimado:** 2-3 dias

**Total estimado:** 11-16 dias

## 🛠️ Stack Tecnológico

- **Frontend:** Vue 3 + Nuxt 4 + TypeScript
- **Backend:** Nuxt Server API
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage
- **Email:** Skymail SMTP
- **Audio:** MediaRecorder API

## 📊 Estrutura de Dados

### Tabelas Principais

1. **task_updates** - Atualizações/comentários
2. **task_update_attachments** - Anexos (arquivos, áudios)
3. **task_update_mentions** - Menções de usuários
4. **task_update_likes** - Curtidas
5. **task_update_reads** - Controle de leitura

### Storage

- **Bucket:** `task-update-attachments`
- **Organização:** `{board_id}/{task_id}/{update_id}/{filename}`
- **Limite:** 10MB por arquivo

## 🔒 Segurança

- ✅ RLS habilitado em todas as tabelas
- ✅ Validação de permissões em todos os endpoints
- ✅ Sanitização de conteúdo (XSS)
- ✅ Whitelist de tipos de arquivo
- ✅ Rate limiting (10 atualizações/min)
- ✅ Validação de menções (apenas membros do board)

## 📱 Responsividade

- **Mobile:** Modal fullscreen, botões touch-friendly
- **Tablet:** Sidebar lateral
- **Desktop:** Sidebar lateral com mais espaço

## ♿ Acessibilidade

- Navegação por teclado
- Aria-labels em todos os botões
- Contraste WCAG AA
- Anúncios com aria-live
- Alt text para imagens

## 📈 Métricas de Sucesso

- ⏱️ Tempo para criar atualização < 5s
- 📧 Taxa de entrega de emails > 95%
- 🔔 Notificações internas em < 1s
- 📤 Upload de 5MB em < 10s
- 🎤 Gravação de áudio funcional em todos os browsers
- 🐛 0 erros críticos em produção

## 🎨 Design

Inspirado no Monday.com:
- Cards com bordas arredondadas
- Avatar circular à esquerda
- Timestamp em cinza claro
- @Menções em azul/roxo
- Anexos com ícones e preview
- Botões discretos (aparecem no hover)
- Thread com indentação e linha vertical

## 📝 Próximos Passos

1. Revisar e aprovar a especificação
2. Iniciar Fase 1 (MVP)
3. Testar cada fase antes de avançar
4. Coletar feedback dos usuários
5. Iterar e melhorar

## 📚 Documentação

- [Requirements](./requirements.md) - Requisitos detalhados
- [Design](./design.md) - Arquitetura e interface
- [Tasks](./tasks.md) - Lista de tarefas

## 🤝 Contribuindo

Antes de implementar qualquer funcionalidade:
1. Ler o `project_guide` no steering
2. Seguir as regras de segurança (nunca confiar no frontend)
3. Validar permissões em todos os endpoints
4. Testar com diferentes roles (master, collaborator, guest)
5. Garantir compatibilidade mobile

## ⚠️ Avisos Importantes

- **Regra 24:** Nunca remover funcionalidades existentes sem autorização
- **Segurança:** Sempre usar SERVICE_ROLE_KEY para operações server-side
- **Performance:** Implementar paginação e lazy loading
- **Mobile-first:** Desenvolver para mobile primeiro
- **Acessibilidade:** Garantir WCAG AA compliance

---

**Status:** 📝 Especificação completa - Aguardando aprovação para iniciar implementação

**Última atualização:** 13/04/2026
