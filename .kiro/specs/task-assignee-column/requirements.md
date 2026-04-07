# Documento de Requisitos

## Introdução

Esta feature implementa a **Coluna Responsável (Assignee Column)** na linha de tarefa do board.
O objetivo é exibir, de forma padronizada e visual, os responsáveis atribuídos a cada tarefa diretamente na linha do board, utilizando avatares dos perfis já existentes na tabela `profiles` e os vínculos já persistidos em `task_assignees`.

O componente de linha de tarefa (`TaskRow`) será criado nesta fase e servirá de base para as demais colunas do board.

---

## Glossário

- **TaskRow**: Componente Vue que representa uma linha de tarefa no board (a ser criado nesta fase).
- **AssigneeCell**: Componente Vue responsável por renderizar a coluna de responsável dentro do `TaskRow`.
- **AvatarStack**: Componente Vue que exibe uma pilha de avatares sobrepostos quando há múltiplos responsáveis.
- **Avatar**: Representação visual de um usuário — imagem de perfil ou iniciais como fallback.
- **Responsável (Assignee)**: Usuário vinculado a uma tarefa via tabela `task_assignees`.
- **Perfil (Profile)**: Registro na tabela `profiles` contendo `avatar_url`, `full_name` e `email`.
- **Estado vazio**: Condição em que uma tarefa não possui nenhum responsável atribuído.
- **useTaskAssignees**: Composable responsável por buscar e expor os responsáveis de uma tarefa.

---

## Requisitos

### Requisito 1 — Exibição de responsáveis na linha de tarefa

**User Story:** Como membro do board, quero ver os responsáveis de cada tarefa diretamente na linha do board, para que eu possa identificar rapidamente quem está trabalhando em quê.

#### Critérios de Aceite

1. WHEN uma tarefa possui um ou mais responsáveis atribuídos, THE AssigneeCell SHALL exibir os avatares dos responsáveis na coluna Responsável da linha de tarefa.
2. WHEN uma tarefa não possui nenhum responsável atribuído, THE AssigneeCell SHALL exibir um indicador visual de estado vazio (ícone de usuário neutro ou placeholder).
3. WHEN o avatar_url de um responsável está disponível, THE Avatar SHALL renderizar a imagem do perfil do usuário.
4. WHEN o avatar_url de um responsável é nulo ou inválido, THE Avatar SHALL renderizar as iniciais do full_name do usuário como fallback.
5. WHEN o full_name de um responsável é nulo, THE Avatar SHALL renderizar as iniciais derivadas do email do usuário como fallback.

---

### Requisito 2 — Exibição de múltiplos responsáveis (AvatarStack)

**User Story:** Como membro do board, quero ver todos os responsáveis de uma tarefa de forma compacta, para que a linha de tarefa não fique sobrecarregada visualmente.

#### Critérios de Aceite

1. WHEN uma tarefa possui entre 1 e 3 responsáveis, THE AvatarStack SHALL exibir todos os avatares sobrepostos em linha.
2. WHEN uma tarefa possui mais de 3 responsáveis, THE AvatarStack SHALL exibir os 3 primeiros avatares e um contador indicando o número de responsáveis adicionais (ex: "+2").
3. WHEN o usuário passa o cursor sobre o AvatarStack, THE AvatarStack SHALL exibir um tooltip com os nomes completos de todos os responsáveis.
4. THE AvatarStack SHALL renderizar os avatares com sobreposição (overlap) padronizada de acordo com os design tokens do projeto.

---

### Requisito 3 — Busca de dados de responsáveis

**User Story:** Como desenvolvedor, quero um composable dedicado para buscar os responsáveis de uma tarefa, para que a lógica de dados fique separada da camada de UI.

#### Critérios de Aceite

1. THE useTaskAssignees SHALL aceitar um `task_id` como parâmetro e retornar a lista de perfis dos responsáveis associados.
2. WHEN o `task_id` fornecido é válido, THE useTaskAssignees SHALL buscar os registros de `task_assignees` com join em `profiles` para obter `avatar_url`, `full_name` e `email`.
3. WHEN a busca retorna dados, THE useTaskAssignees SHALL expor um array reativo de responsáveis tipado com os campos `id`, `full_name`, `email` e `avatar_url`.
4. WHEN ocorre um erro na busca, THE useTaskAssignees SHALL expor o erro via propriedade reativa `error` e não lançar exceção não tratada.
5. THE useTaskAssignees SHALL expor uma propriedade reativa `loading` que indica se a busca está em andamento.

---

### Requisito 4 — Componente TaskRow (linha de tarefa)

**User Story:** Como desenvolvedor, quero um componente de linha de tarefa padronizado, para que as colunas do board sejam renderizadas de forma consistente e extensível.

#### Critérios de Aceite

1. THE TaskRow SHALL aceitar uma prop `task` tipada com base nos tipos existentes em `shared/types/database.ts`.
2. THE TaskRow SHALL renderizar a coluna Responsável utilizando o componente AssigneeCell.
3. WHEN o componente TaskRow é renderizado, THE TaskRow SHALL exibir o título da tarefa e a coluna de responsável na mesma linha.
4. THE TaskRow SHALL ser compatível com a estrutura de grupos (`task_groups`) já existente no board.

---

### Requisito 5 — Acessibilidade e padrões visuais

**User Story:** Como usuário do board, quero que os avatares sejam acessíveis e visualmente consistentes com o design system do projeto, para que a experiência seja coerente com o restante da aplicação.

#### Critérios de Aceite

1. THE Avatar SHALL incluir o atributo `alt` com o nome do responsável quando renderizar uma imagem.
2. THE Avatar SHALL incluir o atributo `title` com o nome completo do responsável para acessibilidade via hover.
3. THE AssigneeCell SHALL utilizar as classes de design tokens definidas em `tailwind.config.ts` e `tokens.css` para tamanhos, cores e espaçamentos.
4. WHEN o estado vazio é exibido, THE AssigneeCell SHALL utilizar cor e ícone neutros, sem transmitir urgência ou erro.
