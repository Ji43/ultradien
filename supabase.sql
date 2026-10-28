-- Ultradien : table de synchronisation. À coller dans Supabase > SQL Editor, puis « Run ».
create table if not exists public.ultradien_docs (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  body jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);
alter table public.ultradien_docs enable row level security;
drop policy if exists "lecture perso" on public.ultradien_docs;
drop policy if exists "ajout perso" on public.ultradien_docs;
drop policy if exists "modif perso" on public.ultradien_docs;
drop policy if exists "suppression perso" on public.ultradien_docs;
create policy "lecture perso" on public.ultradien_docs for select to authenticated using (auth.uid() = user_id);
create policy "ajout perso" on public.ultradien_docs for insert to authenticated with check (auth.uid() = user_id);
create policy "modif perso" on public.ultradien_docs for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "suppression perso" on public.ultradien_docs for delete to authenticated using (auth.uid() = user_id);
grant select, insert, update, delete on public.ultradien_docs to authenticated;
