import { z } from 'zod'

const trimmed = (max) => z.string().trim().min(1).max(max)
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected date as YYYY-MM-DD')
const time = z.string().regex(/^\d{2}:\d{2}$/, 'Expected time as HH:MM')

export const ROLES = ['Admin', 'Lawyer', 'Staff']
export const CASE_STATUSES = ['Open', 'Pending', 'In Court', 'Closed', 'Won', 'Lost']
export const PRIORITIES = ['Low', 'Medium', 'High']
export const HEARING_TYPES = ['court', 'hearing', 'deadline', 'meeting']
export const HEARING_STATUSES = ['Confirmed', 'Tentative', 'Due']

// ── Auth ─────────────────────────────────────────────────────────────────
// Public self-registration: callers may NOT grant themselves an elevated role.
// Only Lawyer/Staff are selectable here; Admins are created via POST /api/users.
export const registerSchema = z.object({
  name: trimmed(120),
  email: z.string().trim().toLowerCase().email().max(160),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
  role: z.enum(['Lawyer', 'Staff']).optional().default('Lawyer'),
  title: trimmed(120).optional(),
  specialty: trimmed(120).optional(),
  phone: z.string().trim().max(40).optional(),
})

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
})

export const refreshSchema = z.object({ refreshToken: z.string().min(1) })

export const forgotSchema = z.object({ email: z.string().trim().toLowerCase().email() })

export const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(200),
})

export const updateMeSchema = z.object({
  name: trimmed(120).optional(),
  title: trimmed(120).optional(),
  specialty: trimmed(120).optional(),
  phone: z.string().trim().max(40).optional(),
}).refine((o) => Object.keys(o).length > 0, { message: 'No fields to update' })

// ── Users / staff ──────────────────────────────────────────────────────
// Admin-only user creation may assign ANY role (including Admin).
export const createUserSchema = registerSchema.extend({
  role: z.enum(ROLES).optional().default('Lawyer'),
  barNo: z.string().trim().max(40).optional(),
})

export const updateUserSchema = z.object({
  name: trimmed(120).optional(),
  role: z.enum(ROLES).optional(),
  title: trimmed(120).optional(),
  specialty: trimmed(120).optional(),
  phone: z.string().trim().max(40).optional(),
  barNo: z.string().trim().max(40).optional(),
  winRate: z.number().int().min(0).max(100).nullable().optional(),
  isActive: z.boolean().optional(),
}).refine((o) => Object.keys(o).length > 0, { message: 'No fields to update' })

// ── Clients ──────────────────────────────────────────────────────────────
export const createClientSchema = z.object({
  name: trimmed(160),
  type: z.enum(['Individual', 'Corporate']).default('Individual'),
  company: z.string().trim().max(160).nullable().optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  phone: z.string().trim().max(40).optional(),
  address: z.string().trim().max(200).optional(),
})
export const updateClientSchema = createClientSchema.partial()
  .refine((o) => Object.keys(o).length > 0, { message: 'No fields to update' })

// ── Cases ──────────────────────────────────────────────────────────────
export const createCaseSchema = z.object({
  title: trimmed(200),
  clientId: trimmed(60),
  lawyerIds: z.array(z.string().min(1)).max(20).optional().default([]),
  status: z.enum(CASE_STATUSES).optional().default('Open'),
  practice: trimmed(80).optional(),
  priority: z.enum(PRIORITIES).optional().default('Medium'),
  court: z.string().trim().max(160).optional(),
  judge: z.string().trim().max(120).optional(),
  value: z.string().trim().max(40).optional(),
  nextHearing: isoDate.nullable().optional(),
  desc: z.string().trim().max(4000).optional(),
})
export const updateCaseSchema = z.object({
  title: trimmed(200).optional(),
  clientId: trimmed(60).optional(),
  status: z.enum(CASE_STATUSES).optional(),
  practice: trimmed(80).optional(),
  priority: z.enum(PRIORITIES).optional(),
  court: z.string().trim().max(160).optional(),
  judge: z.string().trim().max(120).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  value: z.string().trim().max(40).optional(),
  nextHearing: isoDate.nullable().optional(),
  desc: z.string().trim().max(4000).optional(),
}).refine((o) => Object.keys(o).length > 0, { message: 'No fields to update' })

export const assignLawyerSchema = z.object({ lawyerId: trimmed(60) })

// ── Hearings ──────────────────────────────────────────────────────────────
export const createHearingSchema = z.object({
  caseId: trimmed(60),
  title: trimmed(200),
  date: isoDate,
  time: time.optional(),
  court: z.string().trim().max(160).optional(),
  judge: z.string().trim().max(120).optional(),
  type: z.enum(HEARING_TYPES).optional(),
  status: z.enum(HEARING_STATUSES).optional(),
})
export const updateHearingSchema = z.object({
  title: trimmed(200).optional(),
  date: isoDate.optional(),
  time: time.optional(),
  court: z.string().trim().max(160).optional(),
  judge: z.string().trim().max(120).optional(),
  type: z.enum(HEARING_TYPES).optional(),
  status: z.enum(HEARING_STATUSES).optional(),
}).refine((o) => Object.keys(o).length > 0, { message: 'No fields to update' })

// ── Tasks ──────────────────────────────────────────────────────────────
export const createTaskSchema = z.object({
  title: trimmed(200),
  caseId: z.string().trim().max(60).nullable().optional(),
  assigneeId: z.string().trim().max(60).nullable().optional(),
  due: isoDate.nullable().optional(),
  priority: z.enum(PRIORITIES).optional().default('Medium'),
})
export const updateTaskSchema = z.object({
  title: trimmed(200).optional(),
  caseId: z.string().trim().max(60).nullable().optional(),
  assigneeId: z.string().trim().max(60).nullable().optional(),
  due: isoDate.nullable().optional(),
  priority: z.enum(PRIORITIES).optional(),
  done: z.boolean().optional(),
}).refine((o) => Object.keys(o).length > 0, { message: 'No fields to update' })

// ── Documents ──────────────────────────────────────────────────────────
export const createDocumentMetaSchema = z.object({
  caseId: trimmed(60),
  category: z.string().trim().max(80).optional(),
})

// ── Notes ──────────────────────────────────────────────────────────────
export const createNoteSchema = z.object({ text: trimmed(4000) })
