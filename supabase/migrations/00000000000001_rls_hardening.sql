-- RLS hardening — versionner et rejouer apres chaque changement Dashboard.
-- Auth: Supabase (email/Google/OTP) + Clerk Apple (clerk_user_id). RLS = authenticated.
-- Supabase user.id = profiles.id ; Apple = profiles.clerk_user_id via JWT template `supabase`.

alter table profiles enable row level security;
alter table events enable row level security;
alter table venues enable row level security;
alter table tickets enable row level security;
alter table transactions enable row level security;

-- profiles: lecture publique minimale, ecritures restreintes au owner
drop policy if exists "profiles_select_authenticated_or_public" on profiles;
create policy "profiles_select_authenticated_or_public" on profiles
  for select using (true);

drop policy if exists "profiles_insert_own" on profiles;
create policy "profiles_insert_own" on profiles
  for insert with check (
    auth.uid() = id
    or (auth.jwt()->>'sub') = clerk_user_id
  );

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles
  for update using (
    auth.uid() = id
    or (auth.jwt()->>'sub') = clerk_user_id
  ) with check (
    auth.uid() = id
    or (auth.jwt()->>'sub') = clerk_user_id
  );

-- is_seller / role ne doivent JAMAIS etre modifiables par le client
-- -> creer trigger ou forcer via Edge Function service_role
-- Exemple trigger (a adapter):
-- create or replace function deny_privilege_escalation() returns trigger as $$
-- begin if new.is_seller is distinct from old.is_seller or new.role is distinct from old.role then
--   raise exception 'privilege escalation denied'; end if; return new; end; $$ language plpgsql;

-- events/venues: published = public select, sinon owner uniquement
-- tickets: owner = buyer_id = auth.uid() ou clerk_user_id via profiles
-- storage.objects (avatars): a configurer via bucket policies (public read, insert owner only, 5Mo, mime jpeg/png/webp)
