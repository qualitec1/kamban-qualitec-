-- =============================================
-- ADD NOTES FIELD TO TASKS
-- =============================================
-- Adiciona campo 'notes' para nota resumida exibida no board
-- Diferente de 'description' que é a descrição completa no modal

alter table public.tasks
add column notes text;

-- Adicionar constraint de tamanho máximo (200 caracteres)
alter table public.tasks
add constraint tasks_notes_length_check check (char_length(notes) <= 200);

-- Comentário explicativo
comment on column public.tasks.notes is 'Nota resumida exibida diretamente no board (máx 200 caracteres)';
comment on column public.tasks.description is 'Descrição completa da tarefa exibida no modal';
