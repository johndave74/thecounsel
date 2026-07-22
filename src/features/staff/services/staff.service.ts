import { supabase } from '@/shared/lib/supabase'
import type { StaffProfile } from '@/shared/types/database.types'
import type { StaffProfileFormValues } from '@/features/staff/schemas'

function splitList(value?: string): string[] {
  return (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export const staffService = {
  async listProfiles(organizationId: string): Promise<StaffProfile[]> {
    const { data, error } = await supabase.from('staff_profiles').select('*').eq('organization_id', organizationId)
    if (error) throw error
    return data ?? []
  },

  async upsertProfile(organizationId: string, userId: string, values: StaffProfileFormValues): Promise<void> {
    const { error } = await supabase.from('staff_profiles').upsert(
      {
        organization_id: organizationId,
        user_id: userId,
        bar_number: values.barNumber?.trim() || null,
        year_admitted: values.yearAdmitted ? Number(values.yearAdmitted) : null,
        qualifications: splitList(values.qualifications),
        specializations: splitList(values.specializations),
        hourly_rate: values.hourlyRate ? Number(values.hourlyRate) : null,
        bio: values.bio?.trim() || null,
        availability: values.availability,
        phone: values.phone?.trim() || null,
      },
      { onConflict: 'organization_id,user_id' },
    )
    if (error) throw error
    await supabase.rpc('log_audit', {
      p_org: organizationId,
      p_action: 'staff.updated',
      p_entity_type: 'staff_profile',
      p_entity_id: userId,
      p_summary: 'Updated a staff profile',
    })
  },

  async uploadAvatar(userId: string, file: File): Promise<string> {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const path = `${userId}/${crypto.randomUUID()}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' })
    if (upErr) throw upErr
    const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path)
    const url = pub.publicUrl
    const { error } = await supabase.rpc('set_avatar', { p_user: userId, p_url: url })
    if (error) throw error
    return url
  },
}
