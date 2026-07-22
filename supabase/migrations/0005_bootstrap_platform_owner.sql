-- ============================================================================
-- Migration 0005 — Bootstrap & self-registration
--
-- * The FIRST user to register becomes the Platform Owner automatically. This
--   removes any need for seed data or manual SQL: sign up with your email and
--   you own the platform. Every subsequent signup is an ordinary user with no
--   access until they accept an invitation to an organization.
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_first_user boolean;
begin
  -- If no platform admin exists yet, the very first account bootstraps ownership.
  select not exists (select 1 from public.profiles where is_platform_admin) into v_is_first_user;

  insert into public.profiles (id, email, full_name, avatar_url, is_platform_admin)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url',
    v_is_first_user
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
