-- ============================================================================
-- Migration 0018 — Platform Users (CloudTech staff roles) + Platform Settings.
-- ============================================================================

alter table public.profiles add column platform_role text;

-- Grant/adjust/revoke platform access (platform staff only).
create or replace function public.set_platform_access(p_user uuid, p_role text, p_is_admin boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Only platform staff can manage platform access' using errcode = '42501';
  end if;
  if p_user = auth.uid() and not p_is_admin then
    raise exception 'You cannot revoke your own platform access';
  end if;
  update public.profiles
    set is_platform_admin = p_is_admin,
        platform_role = case when p_is_admin then p_role else null end
    where id = p_user;
end;
$$;

grant execute on function public.set_platform_access(uuid, text, boolean) to authenticated;

-- ----------------------------------------------------------------------------
-- Platform settings — a single global-config row.
-- ----------------------------------------------------------------------------
create table public.platform_settings (
  id                 boolean primary key default true,
  product_name       text not null default 'CloudTech Legal Suite',
  support_email      text,
  primary_color      text not null default '#B38A3E',
  allow_org_creation boolean not null default true,
  default_trial_days integer not null default 14,
  maintenance_mode   boolean not null default false,
  maintenance_message text,
  global_notice      text,
  feature_flags      jsonb not null default '{}'::jsonb,
  smtp               jsonb not null default '{}'::jsonb,
  updated_at         timestamptz not null default now(),
  constraint platform_settings_singleton check (id)
);

insert into public.platform_settings (id) values (true) on conflict do nothing;

create trigger trg_platform_settings_updated_at
  before update on public.platform_settings
  for each row execute function public.set_updated_at();

alter table public.platform_settings enable row level security;

-- Any authenticated user may read (branding, maintenance banner); platform writes.
create policy "platform_settings_select" on public.platform_settings
  for select using (auth.role() = 'authenticated');
create policy "platform_settings_write" on public.platform_settings
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());
