// ============================================================================
// Edge Function: admin-create-user
// Creates a Supabase auth account on behalf of an admin and seats it in an
// organization. This is the ONLY way accounts are created (public signup is
// disabled): Platform Admins create organization admins; organization admins
// create their firm's users.
//
// Deploy:  supabase functions deploy admin-create-user
// (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.)
// ============================================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface Payload {
  email: string
  password: string
  fullName: string
  organizationId: string
  roleKey: string
  title?: string
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const ANON = Deno.env.get('SUPABASE_ANON_KEY')!

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Missing authorization' }, 401)

  let body: Payload
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const { email, password, fullName, organizationId, roleKey, title } = body
  if (!email || !password || !fullName || !organizationId || !roleKey) {
    return json({ error: 'email, password, fullName, organizationId and roleKey are required' }, 400)
  }
  if (password.length < 10) return json({ error: 'Password must be at least 10 characters' }, 400)

  // Caller-scoped client — identifies the requester and evaluates RLS helpers.
  const caller = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: userData, error: userErr } = await caller.auth.getUser()
  if (userErr || !userData.user) return json({ error: 'Not authenticated' }, 401)

  // Authorization: platform admin OR admin of the target organization.
  const [{ data: isPlatformAdmin }, { data: isOrgAdmin }] = await Promise.all([
    caller.rpc('is_platform_admin'),
    caller.rpc('is_org_admin', { org: organizationId }),
  ])
  if (!isPlatformAdmin && !isOrgAdmin) {
    return json({ error: 'You are not allowed to create users in this organization' }, 403)
  }

  // Service-role client — privileged operations.
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Resolve the role id from its key (system roles).
  const { data: role, error: roleErr } = await admin
    .from('roles')
    .select('id, key, rank')
    .eq('key', roleKey)
    .maybeSingle()
  if (roleErr || !role) return json({ error: `Unknown role: ${roleKey}` }, 400)

  // Create (or fetch existing) auth user.
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  let userId = created?.user?.id
  if (createErr || !userId) {
    // If the user already exists, look them up so we can still seat them.
    const { data: list } = await admin.auth.admin.listUsers()
    const existing = list?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (!existing) return json({ error: createErr?.message ?? 'Could not create user' }, 400)
    userId = existing.id
  }

  // Seat the user in the organization.
  const isOwnerRole = role.key === 'managing_partner'
  const { error: memErr } = await admin.from('memberships').upsert(
    {
      organization_id: organizationId,
      user_id: userId,
      role_id: role.id,
      status: 'active',
      is_owner: isOwnerRole,
      title: title ?? null,
      joined_at: new Date().toISOString(),
    },
    { onConflict: 'organization_id,user_id' },
  )
  if (memErr) return json({ error: memErr.message }, 400)

  await admin.from('profiles').update({ full_name: fullName }).eq('id', userId)
  await admin.rpc('log_audit', {
    p_org: organizationId,
    p_action: 'user.created',
    p_entity_type: 'membership',
    p_summary: `Created ${email} as ${role.key}`,
  })

  return json({ userId, email }, 201)
})
