-- Scope Check Foundation schema + RLS
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_name text not null,
  freelancer_name text not null,
  scope text not null,
  budget numeric not null,
  status text not null default 'active' check (status in ('active','paused','completed')),
  escrow_status text not null default 'pending',
  scope_change_count int not null default 0,
  health_score int not null default 100,
  created_at timestamptz default now(),
  paused_at timestamptz,
  pause_reason text,
  resumed_at timestamptz
);

create table milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  amount numeric not null default 0,
  payment_locked boolean not null default false,
  payment_released boolean not null default false,
  created_at timestamptz default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  sender text not null check (sender in ('client','freelancer')),
  body text not null,
  created_at timestamptz default now()
);

create table analyses (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references messages(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  is_scope_check boolean not null,
  is_passive_aggressive boolean not null,
  confidence int not null,
  matched_patterns jsonb not null default '[]',
  estimated_additional_hours numeric not null default 0,
  flags jsonb not null default '[]',
  recommended_action text not null,
  engine text not null default 'rules',
  created_at timestamptz default now()
);

create table renegotiations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  additional_work text not null,
  original_budget numeric not null,
  new_quote numeric not null,
  additional_cost numeric not null,
  status text not null default 'pending' check (status in ('pending','approved')),
  created_at timestamptz default now(),
  approved_at timestamptz
);

create table alerts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  severity text not null,
  title text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz default now(),
  read_at timestamptz
);

create index on projects(user_id);
create index on milestones(user_id);
create index on messages(user_id);
create index on analyses(user_id);
create index on renegotiations(user_id);
create index on alerts(user_id);

alter table profiles enable row level security;
alter table projects enable row level security;
alter table milestones enable row level security;
alter table messages enable row level security;
alter table analyses enable row level security;
alter table renegotiations enable row level security;
alter table alerts enable row level security;

create policy "own profile" on profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "own projects" on projects for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own milestones" on milestones for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own messages" on messages for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own analyses" on analyses for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own renegotiations" on renegotiations for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own alerts" on alerts for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create function public.handle_new_user() returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email) on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();
