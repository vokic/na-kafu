-- na kafu? — database schema (MVP). Run this in Supabase → SQL Editor.
-- All access goes through our server (service role); RLS denies everyone else.

create extension if not exists pgcrypto;

create table if not exists invites (
  id                uuid primary key default gen_random_uuid(),
  invite_token      text unique not null,           -- short public token (e.g. "kafu-mila")
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
                      check (theme in ('light','dark','pink','peach','holo','aurora','indigo')),
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
--
-- MIGRATION (run on a live DB created before the 'aurora'/'indigo' themes were added —
-- otherwise inserts with those themes fail the check constraint with a 500):
--   alter table invites drop constraint if exists invites_theme_check;
--   alter table invites add constraint invites_theme_check
--     check (theme in ('light','dark','pink','peach','holo','aurora','indigo'));
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- RATE LIMITING (distributed, fixed window per key). The API calls rate_limit_check()
-- with a JSONB array of {key, limit, window_s} checks in ONE roundtrip; the upsert takes
-- a row lock per key, so concurrent serverless instances count correctly (unlike the old
-- in-memory Map, which reset on every cold start). Stale rows are swept by the retention
-- job. On a live DB: copy this whole block into the SQL Editor and run it once.

create table if not exists rate_limits (
  key          text primary key,
  count        int not null,
  window_start timestamptz not null
);

alter table rate_limits enable row level security;  -- no policies → service role only
grant all privileges on rate_limits to service_role;

create or replace function rate_limit_check(checks jsonb)
returns boolean
language plpgsql
as $$
declare
  c jsonb;
  hit int;
  limited boolean := false;
begin
  for c in select * from jsonb_array_elements(checks) loop
    insert into rate_limits as rl (key, count, window_start)
    values (c->>'key', 1, now())
    on conflict (key) do update set
      count        = case when rl.window_start < now() - make_interval(secs => (c->>'window_s')::int)
                          then 1 else rl.count + 1 end,
      window_start = case when rl.window_start < now() - make_interval(secs => (c->>'window_s')::int)
                          then now() else rl.window_start end
    returning rl.count into hit;
    if hit > (c->>'limit')::int then limited := true; end if;
  end loop;
  return limited;
end $$;

-- Invoker security: even if someone reached the function, RLS (no policies) blocks anon
-- at the table; execute is revoked anyway. Only our server (service role) can call it.
revoke execute on function rate_limit_check(jsonb) from public, anon, authenticated;
grant execute on function rate_limit_check(jsonb) to service_role;
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- RETENTION (privacy: HANDOVER §9 — auto-delete PII after the link's life). Invites carry
-- an `expires_at` (24h); a daily job removes expired rows. responses/events cascade via FK.
-- Storage photos are deleted by the app's retention path; this clears the DB side.
-- Requires pg_cron (Supabase: enable the extension, then run once):
--   create extension if not exists pg_cron;
--   select cron.schedule('purge-expired-invites', '0 4 * * *', $$
--     delete from invites where expires_at < now() - interval '7 days';
--   $$);
-- (7-day grace keeps a short audit window past expiry; tighten/loosen as needed.)
-- ---------------------------------------------------------------------------
