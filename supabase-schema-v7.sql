-- ════════════════════════════════════════════════════════════════════════════
-- Brio – Schema v7 : historique des questions déjà posées par cours
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.questions_posees (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users on delete cascade not null,
  cours_id   uuid references public.cours on delete cascade not null,
  type       text,                 -- 'exercices' | 'controle'
  question   text not null,
  created_at timestamptz default timezone('utc', now()) not null
);

alter table public.questions_posees enable row level security;

drop policy if exists "qp_select" on public.questions_posees;
drop policy if exists "qp_insert" on public.questions_posees;

create policy "qp_select"
  on public.questions_posees for select using (auth.uid() = user_id);
create policy "qp_insert"
  on public.questions_posees for insert with check (auth.uid() = user_id);

create index if not exists qp_cours_idx
  on public.questions_posees (cours_id, created_at desc);
