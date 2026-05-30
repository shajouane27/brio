-- ════════════════════════════════════════════════════════════════════════════
-- Brio – Schema v2  (run after schema v1)
-- ════════════════════════════════════════════════════════════════════════════

-- ── Contrôles corrigés ──────────────────────────────────────────────────────
create table if not exists public.controles (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references auth.users on delete cascade not null,
  matiere       text not null default 'Autre',
  duree         text,
  notation      text,
  note_obtenue  text,      -- raw label: "14/20", "B+", "72/100"
  note_sur_20   float,     -- normalized to /20 for charts
  note_max      float,
  contenu_controle text,   -- the generated exam text
  correction    jsonb,     -- full CorrectionResult JSON
  created_at    timestamptz default timezone('utc', now()) not null
);

alter table public.controles enable row level security;

-- Drop before re-create to avoid conflicts on re-run
drop policy if exists "Users see own controles"            on public.controles;
drop policy if exists "Users insert own controles"         on public.controles;
drop policy if exists "Parents read linked children controles" on public.controles;

-- Élève sees own rows; parent sees their children's rows
create policy "controles_select"
  on public.controles for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.parent_child_links
      where parent_id = auth.uid() and child_id = user_id
    )
  );

create policy "controles_insert"
  on public.controles for insert
  with check (auth.uid() = user_id);

-- ── Parent–Enfant liens ──────────────────────────────────────────────────────
create table if not exists public.parent_child_links (
  id         uuid default gen_random_uuid() primary key,
  parent_id  uuid references auth.users on delete cascade not null,
  child_id   uuid references auth.users on delete cascade not null,
  created_at timestamptz default timezone('utc', now()) not null,
  unique (parent_id, child_id)
);

alter table public.parent_child_links enable row level security;

drop policy if exists "Parents see own links"   on public.parent_child_links;
drop policy if exists "Parents insert own links" on public.parent_child_links;

create policy "pclinks_select"
  on public.parent_child_links for select using (auth.uid() = parent_id);

create policy "pclinks_insert"
  on public.parent_child_links for insert with check (auth.uid() = parent_id);

-- ── Profiles – replace v1 SELECT policy with parent-aware version ────────────
-- v1 created: "Users can view own profile"  (select where uid = id)
-- We replace it with one that also lets parents see their children's profiles.
drop policy if exists "Users can view own profile"             on public.profiles;
drop policy if exists "Parents read linked children profiles"  on public.profiles;

create policy "profiles_select"
  on public.profiles for select
  using (
    auth.uid() = id
    or exists (
      select 1 from public.parent_child_links
      where parent_id = auth.uid() and child_id = id
    )
  );

-- ── Codes de liaison temporaires (TTL 1h) ───────────────────────────────────
create table if not exists public.link_codes (
  code       char(6) primary key,
  user_id    uuid references auth.users on delete cascade not null,
  created_at timestamptz default timezone('utc', now()) not null,
  expires_at timestamptz default (timezone('utc', now()) + interval '1 hour') not null
);

alter table public.link_codes enable row level security;

drop policy if exists "Users manage own codes" on public.link_codes;

create policy "link_codes_all"
  on public.link_codes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
