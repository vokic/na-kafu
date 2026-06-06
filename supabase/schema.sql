-- na kafu? — database schema (MVP). Run this in Supabase → SQL Editor.
-- All access goes through our server (service role); RLS denies everyone else.

create extension if not exists pgcrypto;

create table if not exists invites (
  id                uuid primary key default gen_random_uuid(),
  invite_token      text unique not null,           -- short public token (e.g. "kqmxzp")
  manage_token      text unique not null,           -- long private token (sender's status link)
  mode              text not null check (mode in ('direct','friend')),
  sender_email      text not null,
  sender_signature  text not null,                  -- "Marko @marko" (hidden in friend mode pre-reveal)
  sender_about      text,
  sender_photo_url  text,
  recipient_name    text not null,
  message           text not null,
  places            text[] not null,
  theme             text not null default 'light'
                      check (theme in ('light','dark','pink','peach','holo','aurora')),
  status            text not null default 'pending'
                      check (status in ('pending','opened','accepted','declined','cancelled')),
  user_id           uuid,                            -- null in MVP (Phase 2 accounts)
  created_at        timestamptz default now(),
  expires_at        timestamptz not null default (now() + interval '24 hours'),  -- link valid 24h
  opened_at         timestamptz,
  responded_at      timestamptz,
  revealed_at       timestamptz
);

create table if not exists responses (
  id            uuid primary key default gen_random_uuid(),
  invite_id     uuid not null references invites(id) on delete cascade,
  decision      text not null check (decision in ('accepted','declined')),
  place         text,
  contact_type  text,                                -- Instagram | Telefon | Email | Snapchat
  contact_value text,
  reply_note    text,
  reason        text,                                -- required when declined
  reason_note   text,
  created_at    timestamptz default now()
);

-- one response per invite
create unique index if not exists responses_one_per_invite on responses(invite_id);

create table if not exists events (
  id         bigint generated always as identity primary key,
  invite_id  uuid not null references invites(id) on delete cascade,
  type       text not null,                          -- created|link_opened|revealed|accepted|declined|email_sent|...
  meta       jsonb,
  created_at timestamptz default now()
);

create table if not exists feedback (
  id         uuid primary key default gen_random_uuid(),
  value      text check (value in ('up','down')),
  comment    text,
  context    text,                                   -- 'recipient' | 'sender'
  created_at timestamptz default now()
);

create index if not exists invites_invite_token_idx on invites(invite_token);
create index if not exists invites_manage_token_idx on invites(manage_token);
create index if not exists responses_invite_id_idx on responses(invite_id);
create index if not exists events_invite_id_idx on events(invite_id);

-- Lock down: deny anon/auth; only the service-role key (our API routes) bypasses RLS.
alter table invites   enable row level security;
alter table responses enable row level security;
alter table events    enable row level security;
alter table feedback  enable row level security;

-- Grant table access to service_role ONLY (our server). Needed because "Automatically
-- expose new tables" is OFF, so no grants are applied automatically. anon/authenticated
-- get nothing → only our backend (service-role key) can touch the data. RLS stays on.
grant usage on schema public to service_role;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;

-- ---------------------------------------------------------------------------
-- MIGRATION (run on an existing live DB to allow sender-cancelled invites):
--   alter table invites drop constraint if exists invites_status_check;
--   alter table invites add constraint invites_status_check
--     check (status in ('pending','opened','accepted','declined','cancelled'));
-- ---------------------------------------------------------------------------
