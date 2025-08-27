-- Auto insert user profile and trial subscription after sign up

-- Function to handle new auth.users insert
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- create profile in public.users
  insert into public.users (id, email, name, council, registration_number, specialty, phone, state, status, is_admin, created_at, updated_at)
  values (new.id,
          new.email,
          coalesce(new.raw_user_meta_data->>'name', new.email),
          new.raw_user_meta_data->>'council',
          new.raw_user_meta_data->>'registration_number',
          new.raw_user_meta_data->>'specialty',
          new.raw_user_meta_data->>'phone',
          new.raw_user_meta_data->>'state',
          'active',
          false,
          now(),
          now());

  -- start trial subscription
  insert into public.subscriptions(user_id, plan, status, trial_ends_at, created_at, updated_at)
  values (new.id,
          'trial',
          'active',
          now() + interval '30 days',
          now(),
          now());
  return new;
end;
$$;

-- Trigger on auth.users
create or replace trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- RLS policies for public.users
alter table public.users enable row level security;

drop policy if exists "Users can view own profile" on public.users;
create policy "Users can view own profile" on public.users
for select using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.users;
create policy "Users can insert own profile" on public.users
for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile" on public.users
for update using (auth.uid() = id);

drop policy if exists "Admins manage all users" on public.users;
create policy "Admins manage all users" on public.users
for all using (exists (
  select 1 from public.users as u
  where u.id = auth.uid() and u.is_admin = true
));

-- RLS policies for public.subscriptions
alter table public.subscriptions enable row level security;

drop policy if exists "Users view own subscription" on public.subscriptions;
create policy "Users view own subscription" on public.subscriptions
for select using (auth.uid() = user_id);

drop policy if exists "Users insert own subscription" on public.subscriptions;
create policy "Users insert own subscription" on public.subscriptions
for insert with check (auth.uid() = user_id);

drop policy if exists "Users update own subscription" on public.subscriptions;
create policy "Users update own subscription" on public.subscriptions
for update using (auth.uid() = user_id);

drop policy if exists "Admins manage subscriptions" on public.subscriptions;
create policy "Admins manage subscriptions" on public.subscriptions
for all using (exists (
  select 1 from public.users as u
  where u.id = auth.uid() and u.is_admin = true
));
