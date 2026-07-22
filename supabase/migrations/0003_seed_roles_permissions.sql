-- ============================================================================
-- Migration 0003 — Reference data: permission catalog, system roles,
-- and default role -> permission grants.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Permission catalog
-- ----------------------------------------------------------------------------
insert into public.permissions (key, resource, action, description) values
  ('dashboard.view',      'dashboard',      'view',   'View the executive dashboard'),
  ('organization.view',   'organization',   'view',   'View organization profile'),
  ('organization.manage', 'organization',   'manage', 'Edit organization profile & settings'),
  ('offices.view',        'offices',        'view',   'View office locations'),
  ('offices.manage',      'offices',        'manage', 'Create/edit office locations'),
  ('practice_areas.view', 'practice_areas', 'view',   'View practice areas'),
  ('practice_areas.manage','practice_areas','manage', 'Create/edit practice areas'),
  ('departments.view',    'departments',    'view',   'View departments'),
  ('departments.manage',  'departments',    'manage', 'Create/edit departments'),
  ('roles.view',          'roles',          'view',   'View roles & permissions'),
  ('roles.manage',        'roles',          'manage', 'Create/edit roles & permissions'),
  ('members.view',        'members',        'view',   'View organization users'),
  ('members.manage',      'members',        'manage', 'Invite, edit & deactivate users'),
  ('audit.read',          'audit',          'read',   'Read the audit log'),
  ('settings.manage',     'settings',       'manage', 'Manage system settings'),
  ('staff.view',          'staff',          'view',   'View lawyers & staff profiles'),
  ('staff.manage',        'staff',          'manage', 'Manage staff profiles & performance'),
  ('clients.view',        'clients',        'view',   'View clients'),
  ('clients.create',      'clients',        'create', 'Create clients'),
  ('clients.update',      'clients',        'update', 'Edit clients'),
  ('clients.delete',      'clients',        'delete', 'Delete clients'),
  ('matters.view',        'matters',        'view',   'View matters'),
  ('matters.create',      'matters',        'create', 'Open new matters'),
  ('matters.update',      'matters',        'update', 'Edit matters'),
  ('matters.delete',      'matters',        'delete', 'Close/delete matters'),
  ('matters.assign',      'matters',        'assign', 'Assign lawyers to matters'),
  ('documents.view',      'documents',      'view',   'View documents'),
  ('documents.upload',    'documents',      'upload', 'Upload documents'),
  ('documents.update',    'documents',      'update', 'Rename/move/tag documents'),
  ('documents.delete',    'documents',      'delete', 'Delete documents'),
  ('documents.manage',    'documents',      'manage', 'Manage folders & permissions'),
  ('hearings.view',       'hearings',       'view',   'View hearings'),
  ('hearings.create',     'hearings',       'create', 'Schedule hearings'),
  ('hearings.update',     'hearings',       'update', 'Edit hearings & outcomes'),
  ('hearings.delete',     'hearings',       'delete', 'Delete hearings'),
  ('calendar.view',       'calendar',       'view',   'View the calendar'),
  ('tasks.view',          'tasks',          'view',   'View tasks'),
  ('tasks.create',        'tasks',          'create', 'Create tasks'),
  ('tasks.update',        'tasks',          'update', 'Edit/complete tasks'),
  ('tasks.delete',        'tasks',          'delete', 'Delete tasks'),
  ('tasks.assign',        'tasks',          'assign', 'Assign tasks to others'),
  ('billing.view',        'billing',        'view',   'View billing & revenue'),
  ('invoices.manage',     'invoices',       'manage', 'Create & send invoices'),
  ('payments.manage',     'payments',       'manage', 'Record payments'),
  ('expenses.manage',     'expenses',       'manage', 'Manage expenses'),
  ('trust.manage',        'trust',          'manage', 'Manage trust accounts'),
  ('reports.view',        'reports',        'view',   'View reports'),
  ('reports.financial',   'reports',        'financial','View financial reports'),
  ('notifications.view',  'notifications',  'view',   'View notifications')
on conflict (key) do nothing;

-- ----------------------------------------------------------------------------
-- System roles (organization_id = null, is_system = true). Lower rank = senior.
-- ----------------------------------------------------------------------------
insert into public.roles (key, name, description, rank, is_system, organization_id) values
  ('platform_owner',   'Platform Owner',        'Owner of the CloudTech platform', 0,  true, null),
  ('platform_admin',   'Platform Administrator','Platform operations & tenant management', 5, true, null),
  ('managing_partner', 'Managing Partner',      'Runs the firm; full access', 10, true, null),
  ('partner',          'Partner',               'Senior equity partner', 20, true, null),
  ('senior_associate', 'Senior Associate',      'Experienced fee earner', 30, true, null),
  ('associate',        'Associate',             'Fee earner', 40, true, null),
  ('junior_associate', 'Junior Associate',      'Trainee fee earner', 50, true, null),
  ('paralegal',        'Paralegal',             'Legal support professional', 60, true, null),
  ('finance',          'Finance',               'Billing & accounts', 65, true, null),
  ('hr',               'HR',                    'People operations', 66, true, null),
  ('secretary',        'Secretary',             'Legal secretary', 70, true, null),
  ('receptionist',     'Receptionist',          'Front desk', 80, true, null)
on conflict (key) do nothing;

-- ----------------------------------------------------------------------------
-- Default grants
-- ----------------------------------------------------------------------------

-- Platform + firm leadership: every permission.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('platform_owner', 'platform_admin', 'managing_partner', 'partner')
on conflict do nothing;

-- Fee earners (senior/associate/junior).
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key in (
  'dashboard.view','notifications.view','calendar.view',
  'staff.view','reports.view','billing.view',
  'clients.view','clients.create','clients.update',
  'matters.view','matters.create','matters.update','matters.assign',
  'documents.view','documents.upload','documents.update',
  'hearings.view','hearings.create','hearings.update',
  'tasks.view','tasks.create','tasks.update','tasks.assign'
)
where r.key in ('senior_associate','associate','junior_associate')
on conflict do nothing;

-- Paralegal.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key in (
  'dashboard.view','notifications.view','calendar.view','staff.view',
  'clients.view','matters.view','matters.update',
  'documents.view','documents.upload','documents.update',
  'hearings.view','hearings.create','hearings.update',
  'tasks.view','tasks.create','tasks.update'
)
where r.key = 'paralegal'
on conflict do nothing;

-- Finance.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key in (
  'dashboard.view','notifications.view','clients.view','matters.view',
  'billing.view','invoices.manage','payments.manage','expenses.manage','trust.manage',
  'reports.view','reports.financial'
)
where r.key = 'finance'
on conflict do nothing;

-- HR.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key in (
  'dashboard.view','notifications.view','members.view','staff.view','staff.manage',
  'departments.view','reports.view'
)
where r.key = 'hr'
on conflict do nothing;

-- Secretary & Receptionist (front-office).
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key in (
  'dashboard.view','notifications.view','calendar.view',
  'clients.view','matters.view','documents.view',
  'hearings.view','tasks.view','tasks.create','tasks.update'
)
where r.key in ('secretary','receptionist')
on conflict do nothing;
