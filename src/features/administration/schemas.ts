import { z } from 'zod'

export const createOrganizationSchema = z.object({
  name: z.string().min(2, 'Enter the firm name'),
  slug: z
    .string()
    .min(2, 'Enter a slug')
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and hyphens only'),
  legalName: z.string().optional(),
})
export type CreateOrganizationValues = z.infer<typeof createOrganizationSchema>

export const inviteUserSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  roleId: z.string().min(1, 'Choose a role'),
  message: z.string().max(500).optional(),
})
export type InviteUserValues = z.infer<typeof inviteUserSchema>

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 48)
}
