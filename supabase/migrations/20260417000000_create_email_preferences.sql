-- Tabela de preferências de email por usuário
create table public.email_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  
  -- Notificações de tarefas
  task_assigned_enabled boolean not null default true,
  task_updated_enabled boolean not null default true,
  task_due_soon_enabled boolean not null default true,
  task_completed_enabled boolean not null default false,
  
  -- Frequência de resumos (digest)
  digest_enabled boolean not null default false,
  digest_frequency text not null default 'daily' check (digest_frequency in ('daily', 'weekly', 'never')),
  digest_time time not null default '09:00:00', -- Hora do dia para enviar (formato 24h)
  digest_day_of_week int check (digest_day_of_week between 0 and 6), -- 0=domingo, 6=sábado (para weekly)
  
  -- Limite de emails
  max_emails_per_day int not null default 50,
  max_emails_per_hour int not null default 10,
  
  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.email_preferences enable row level security;

-- Políticas RLS
create policy "Users can view own email preferences"
  on public.email_preferences for select
  using (auth.uid() = user_id);

create policy "Users can update own email preferences"
  on public.email_preferences for update
  using (auth.uid() = user_id);

create policy "Users can insert own email preferences"
  on public.email_preferences for insert
  with check (auth.uid() = user_id);

-- Trigger para atualizar updated_at
create trigger email_preferences_updated_at
  before update on public.email_preferences
  for each row
  execute function set_updated_at();

-- Tabela para rastrear emails enviados (rate limiting)
create table public.email_sent_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  email_type text not null,
  task_id uuid references public.tasks(id) on delete set null,
  sent_at timestamptz not null default now(),
  
  -- Índices para queries rápidas
  created_at timestamptz not null default now()
);

create index email_sent_log_user_id_sent_at_idx on public.email_sent_log(user_id, sent_at desc);
create index email_sent_log_task_id_idx on public.email_sent_log(task_id);

alter table public.email_sent_log enable row level security;

-- Apenas admins podem ver logs
create policy "Only masters can view email logs"
  on public.email_sent_log for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role_global = 'master'
    )
  );

-- Função para criar preferências padrão ao criar usuário
create or replace function create_default_email_preferences()
returns trigger as $$
begin
  insert into public.email_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger para criar preferências ao criar perfil
create trigger create_email_preferences_on_profile_create
  after insert on public.profiles
  for each row
  execute function create_default_email_preferences();

-- Criar preferências para usuários existentes
insert into public.email_preferences (user_id)
select id from public.profiles
on conflict (user_id) do nothing;
