import { supabase } from '@/shared/lib/supabase'
import type { TaskStatus } from '@/shared/types/database.types'
import type { TaskFormValues } from '@/features/tasks/schemas'
import type { TaskRow } from '@/features/tasks/types'

const SELECT =
  '*, matter:matters(id, title, matter_number), assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url)'

export interface TaskFilters {
  search?: string
  status?: TaskStatus | 'all'
  assigneeId?: string | 'all' | 'me'
  matterId?: string | 'all'
}

function toRow(values: TaskFormValues) {
  return {
    title: values.title.trim(),
    description: values.description?.trim() || null,
    status: values.status,
    priority: values.priority,
    assignee_id: values.assigneeId || null,
    matter_id: values.matterId || null,
    due_date: values.dueDate || null,
    completed_at: values.status === 'done' ? new Date().toISOString() : null,
  }
}

export const tasksService = {
  async list(organizationId: string, filters: TaskFilters, currentUserId: string | null): Promise<TaskRow[]> {
    let q = supabase
      .from('tasks')
      .select(SELECT)
      .eq('organization_id', organizationId)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
    if (filters.status && filters.status !== 'all') q = q.eq('status', filters.status)
    if (filters.matterId && filters.matterId !== 'all') q = q.eq('matter_id', filters.matterId)
    if (filters.assigneeId === 'me' && currentUserId) q = q.eq('assignee_id', currentUserId)
    else if (filters.assigneeId && filters.assigneeId !== 'all' && filters.assigneeId !== 'me')
      q = q.eq('assignee_id', filters.assigneeId)
    if (filters.search?.trim()) q = q.ilike('title', `%${filters.search.trim()}%`)
    const { data, error } = await q
    if (error) throw error
    return (data ?? []) as unknown as TaskRow[]
  },

  async create(organizationId: string, values: TaskFormValues, createdBy: string | null): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .insert({ organization_id: organizationId, created_by: createdBy, ...toRow(values) })
    if (error) throw error
  },

  async update(id: string, values: TaskFormValues): Promise<void> {
    const { error } = await supabase.from('tasks').update(toRow(values)).eq('id', id)
    if (error) throw error
  },

  async setStatus(id: string, status: TaskStatus): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .update({ status, completed_at: status === 'done' ? new Date().toISOString() : null })
      .eq('id', id)
    if (error) throw error
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) throw error
  },
}
