-- ============================================================================
-- Migration 0017 — Support Mode (audited firm access) + organization logos.
-- ============================================================================

create table public.support_sessions (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  admin_id        uuid references public.profiles(id) on delete set null,
  reason          text,
  started_at      timestamptz not null default now(),
  expires_at      timestamptz not null,
  ended_at        timestamptz,
  created_at      timestamptz not null default now()
);
create index idx_support_sessions_org on public.support_sessions (organization_id, started_at desc);

alter table public.support_sessions enable row level security;

-- Platform staff and the firm's own admins can see support history (transparency).
create policy "support_sessions_select" on public.support_sessions
  for select using (public.is_platform_admin() or public.is_org_admin(organization_id));

-- Start a 30-minute support session (platform staff only). Audit-logged.
create or replace function public.start_support_session(p_org uuid, p_reason text)
returns public.support_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.support_sessions;
begin
  if not public.is_platform_admin() then
    raise exception 'Only platform staff can start a support session' using errcode = '42501';
  end if;
  insert into public.support_sessions (organization_id, admin_id, reason, expires_at)
  values (p_org, auth.uid(), p_reason, now() + interval '30 minutes')
  returning * into s;
  perform public.log_audit(p_org, 'support.session_started', 'support_session', s.id,
    'Support session started', jsonb_build_object('reason', p_reason));
  return s;
end;
$$;

create or replace function public.end_support_session(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  org uuid;
begin
  if not public.is_platform_admin() then
    raise exception 'Only platform staff can end a support session' using errcode = '42501';
  end if;
  update public.support_sessions set ended_at = now() where id = p_id and ended_at is null
    returning organization_id into org;
  if org is not null then
    perform public.log_audit(org, 'support.session_ended', 'support_session', p_id, 'Support session ended');
  end if;
end;
$$;

grant execute on function public.start_support_session(uuid, text) to authenticated;
grant execute on function public.end_support_session(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- Organization logos (public bucket; firm admins manage their own).
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('org-logos', 'org-logos', true)
on conflict (id) do nothing;

create policy "org_logos_select" on storage.objects
  for select using (bucket_id = 'org-logos');
create policy "org_logos_insert" on storage.objects
  for insert with check (bucket_id = 'org-logos' and public.is_org_admin(((storage.foldername(name))[1])::uuid));
create policy "org_logos_update" on storage.objects
  for update using (bucket_id = 'org-logos' and public.is_org_admin(((storage.foldername(name))[1])::uuid));
create policy "org_logos_delete" on storage.objects
  for delete using (bucket_id = 'org-logos' and public.is_org_admin(((storage.foldername(name))[1])::uuid));
