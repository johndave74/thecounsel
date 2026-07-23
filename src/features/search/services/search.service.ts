import { supabase } from '@/shared/lib/supabase'

export interface SearchResults {
  matters: { id: string; title: string; matter_number: string | null }[]
  clients: { id: string; display_name: string; type: string }[]
  documents: { id: string; name: string; matter_id: string | null }[]
  tasks: { id: string; title: string; matter_id: string | null; status: string }[]
}

const EMPTY: SearchResults = { matters: [], clients: [], documents: [], tasks: [] }

/** Lightweight cross-entity search. All queries are RLS-scoped to the org. */
export const searchService = {
  async global(organizationId: string, query: string): Promise<SearchResults> {
    const q = query.trim()
    if (q.length < 2) return EMPTY
    const like = `%${q}%`

    const [matters, clients, documents, tasks] = await Promise.all([
      supabase
        .from('matters')
        .select('id, title, matter_number')
        .eq('organization_id', organizationId)
        .or(`title.ilike.${like},matter_number.ilike.${like}`)
        .limit(6),
      supabase
        .from('clients')
        .select('id, display_name, type')
        .eq('organization_id', organizationId)
        .or(`display_name.ilike.${like},email.ilike.${like},company_name.ilike.${like}`)
        .limit(6),
      supabase
        .from('documents')
        .select('id, name, matter_id')
        .eq('organization_id', organizationId)
        .ilike('name', like)
        .limit(6),
      supabase
        .from('tasks')
        .select('id, title, matter_id, status')
        .eq('organization_id', organizationId)
        .ilike('title', like)
        .limit(6),
    ])

    return {
      matters: matters.data ?? [],
      clients: clients.data ?? [],
      documents: documents.data ?? [],
      tasks: tasks.data ?? [],
    }
  },
}
