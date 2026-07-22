-- ============================================================================
-- Migration 0015 — Staff avatars + member management helpers.
-- ============================================================================

-- Can the current user manage the target user? (has staff.manage in an org the
-- target belongs to). Used to authorise setting another member's avatar.
create or replace function public.can_manage_member(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
    where m.user_id = target
      and public.has_permission(m.organization_id, 'staff.manage')
  );
$$;

grant execute on function public.can_manage_member(uuid) to authenticated;

-- Set a profile avatar. Allowed for yourself, a staff-manager of the target, or
-- a platform admin. profiles RLS only lets a user update their own row, so this
-- SECURITY DEFINER function is how managers set a colleague's photo.
create or replace function public.set_avatar(p_user uuid, p_url text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user <> auth.uid() and not public.can_manage_member(p_user) and not public.is_platform_admin() then
    raise exception 'Not allowed to update this profile' using errcode = '42501';
  end if;
  update public.profiles set avatar_url = p_url where id = p_user;
end;
$$;

grant execute on function public.set_avatar(uuid, text) to authenticated;

-- ----------------------------------------------------------------------------
-- Avatars storage bucket (public read; scoped writes). Path: <user_id>/<file>.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_select" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars_insert" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.can_manage_member(((storage.foldername(name))[1])::uuid)
    )
  );

create policy "avatars_update" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.can_manage_member(((storage.foldername(name))[1])::uuid)
    )
  );

create policy "avatars_delete" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.can_manage_member(((storage.foldername(name))[1])::uuid)
    )
  );
