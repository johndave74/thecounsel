import { z } from 'zod'

export const staffProfileSchema = z.object({
  barNumber: z.string().optional(),
  yearAdmitted: z.string().optional(),
  qualifications: z.string().optional(),
  specializations: z.string().optional(),
  hourlyRate: z.string().optional(),
  bio: z.string().optional(),
  availability: z.enum(['available', 'busy', 'on_leave']),
  phone: z.string().optional(),
})

export type StaffProfileFormValues = z.infer<typeof staffProfileSchema>
