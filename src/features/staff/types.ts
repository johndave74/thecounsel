import type { BadgeProps } from '@/shared/components/ui/badge'
import type { MemberWithRelations } from '@/features/administration/types'
import type { StaffProfile } from '@/shared/types/database.types'

export interface StaffMember {
  member: MemberWithRelations
  profile: StaffProfile | null
  activeMatters: number
}

export const AVAILABILITY_META: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
  available: { label: 'Available', variant: 'success' },
  busy: { label: 'Busy', variant: 'warning' },
  on_leave: { label: 'On leave', variant: 'muted' },
}
export const AVAILABILITY_OPTIONS = ['available', 'busy', 'on_leave'] as const
