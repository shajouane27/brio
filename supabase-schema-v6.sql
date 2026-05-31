-- ════════════════════════════════════════════════════════════════════════════
-- Brio – Schema v6 : questions flash quotidiennes + streak
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.flash_cards (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references auth.users on delete cascade not null,
  cours_id        uuid references public.cours on delete cascade,
  type            text not null default 'qcm',     -- 'qcm' | 'vraifaux'
  question        text not null,
  options         jsonb not null default '[]',     -- ex: ["Vrai","Faux"] ou 4 choix
  reponse         text not null,                   -- la bonne réponse (= une des options)
  derniere_vue    timestamptz,
  niveau_maitrise int  not null default 0,
  created_at      timestamptz default timezone('utc', now()) not null
);

alter table public.flash_cards enable row level security;

drop policy if exists "flash_select" on public.flash_cards;
drop policy if exists "flash_insert" on public.flash_cards;
drop policy if exists "flash_update" on public.flash_cards;

create policy "flash_select"
  on public.flash_cards for select using (auth.uid() = user_id);
create policy "flash_insert"
  on public.flash_cards for insert with check (auth.uid() = user_id);
create policy "flash_update"
  on public.flash_cards for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists flash_user_vue_idx
  on public.flash_cards (user_id, derniere_vue);

-- Streak quotidien (jours consécutifs) stocké sur le profil
alter table public.profiles add column if not exists flash_streak   int default 0;
alter table public.profiles add column if not exists flash_last_day date;
