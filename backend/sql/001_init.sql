create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  username text unique not null,
  password_hash text,
  google_id text unique,
  onboarded boolean not null default false,
  credits integer not null default 2000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orgs (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  owner_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now()
);

do $$ begin
  create type org_role as enum('admin','member');
exception when duplicate_object then null; end $$;

create table if not exists user_org_roles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  org_id uuid not null references orgs(id) on delete cascade,
  role org_role not null,
  unique(user_id, org_id)
);

create table if not exists chat_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null default 'New Chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists chat_messages (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references chat_sessions(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  prompt_tokens int default 0,
  completion_tokens int default 0,
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  seen boolean not null default false
);

create table if not exists credits_ledger (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  delta int not null,
  reason text,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_sessions_user on chat_sessions(user_id);
create index if not exists idx_messages_session on chat_messages(session_id);


