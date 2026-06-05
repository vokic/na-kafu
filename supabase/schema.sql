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
                      check (status in ('pending','opened','accepted','declined')),
  user_id           uuid,                            -- null in MVP (Phase 2 accounts)
  created_at        timestamptz default now(),
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

create index if not exists invites_invite_token_idx on invites(invite_token);
create index if not exists invites_manage_token_idx on invites(manage_token);
create index if not exists responses_invite_id_idx on responses(invite_id);
create index if not exists events_invite_id_idx on events(invite_id);

-- Lock down: deny anon/auth; only the service-role key (our API routes) bypasses RLS.
alter table invites   enable row level security;
alter table responses enable row level security;
alter table events    enable row level security;
