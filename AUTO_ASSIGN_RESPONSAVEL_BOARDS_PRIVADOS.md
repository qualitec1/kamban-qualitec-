# Auto-Atribuição de Responsável em Boards Privados

## Funcionalidade

Quando uma tarefa é criada em um **board privado**, o criador da tarefa é automaticamente adicionado como responsável, sem necessidade de atribuição manual.

## Diferença entre Boards

### Boards Privados
- **Identificação**: `workspace_id IS NULL`
- **Comportamento**: Criador é automaticamente adicionado como responsável
- **Uso**: Boards pessoais do usuário

### Boards de Organização
- **Identificação**: `workspace_id IS NOT NULL`
- **Comportamento**: Responsáveis devem ser adicionados manualmente
- **Uso**: Boards compartilhados em workspaces/organizações

## Implementação Técnica

### Trigger no Banco de Dados

```sql
CREATE OR REPLACE FUNCTION auto_assign_creator_to_private_board_tasks()
RETURNS TRIGGER AS $$
DECLARE
  v_workspace_id uuid;
BEGIN
  -- Buscar o workspace_id do board
  SELECT workspace_id INTO v_workspace_id
  FROM boards
  WHERE id = NEW.board_id;
  
  -- Se o board é privado (workspace_id IS NULL), adicionar o criador como responsável
  IF v_workspace_id IS NULL THEN
    INSERT INTO task_assignees (task_id, user_id, assigned_by, assigned_at)
    VALUES (NEW.id, NEW.created_by, NEW.created_by, NOW())
    ON CONFLICT (task_id, user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Quando é Executado

O trigger é executado **AFTER INSERT** na tabela `tasks`, ou seja:
- Após a tarefa ser criada
- Antes de retornar o resultado para o frontend
- Automaticamente, sem necessidade de código adicional no frontend

## Vantagens

1. **Automático**: Não requer mudanças no código do frontend
2. **Consistente**: Funciona em qualquer lugar onde tarefas são criadas
3. **Seguro**: Usa `ON CONFLICT DO NOTHING` para evitar duplicatas
4. **Transparente**: Usuário vê imediatamente que é o responsável

## Testando

### Criar Tarefa em Board Privado
1. Acesse um board privado (sem workspace)
2. Crie uma nova tarefa
3. Verifique que você aparece automaticamente como responsável

### Criar Tarefa em Board de Organização
1. Acesse um board de organização (com workspace)
2. Crie uma nova tarefa
3. Verifique que NÃO há responsável automático
4. Adicione responsáveis manualmente

## Migration

Arquivo: `supabase/migrations/[timestamp]_auto_assign_creator_to_private_board_tasks.sql`

## Observações

- O trigger usa `SECURITY DEFINER` para garantir que tem permissão de inserir em `task_assignees`
- `ON CONFLICT DO NOTHING` evita erros se o usuário já for responsável
- A verificação é feita no banco de dados, garantindo consistência
