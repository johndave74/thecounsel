import { supabase } from '@/shared/lib/supabase'
import type { DocumentRow, Matter } from '@/shared/types/database.types'

const BUCKET = 'documents'

export const DOCUMENT_CATEGORIES = [
  'Contract',
  'Court Order',
  'Pleading',
  'Evidence',
  'Correspondence',
  'Invoice',
  'Identification',
  'Other',
] as const

export interface DocumentWithMatter extends DocumentRow {
  matter: Pick<Matter, 'id' | 'title' | 'matter_number'> | null
}

export interface DocumentFilters {
  search?: string
  category?: string | 'all'
  matterId?: string | 'all'
}

function sanitize(name: string): string {
  return name.replace(/[^\w.\-]+/g, '_').slice(-120)
}

export const documentsService = {
  async list(organizationId: string, filters: DocumentFilters = {}): Promise<DocumentWithMatter[]> {
    let q = supabase
      .from('documents')
      .select('*, matter:matters(id, title, matter_number)')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
    if (filters.category && filters.category !== 'all') q = q.eq('category', filters.category)
    if (filters.matterId && filters.matterId !== 'all') q = q.eq('matter_id', filters.matterId)
    if (filters.search?.trim()) q = q.ilike('name', `%${filters.search.trim()}%`)
    const { data, error } = await q
    if (error) throw error
    return (data ?? []) as unknown as DocumentWithMatter[]
  },

  async upload(params: {
    organizationId: string
    file: File
    uploadedBy: string | null
    matterId?: string | null
    category?: string | null
  }): Promise<void> {
    const { organizationId, file, uploadedBy, matterId, category } = params
    const folder = matterId || 'general'
    const path = `${organizationId}/${folder}/${crypto.randomUUID()}-${sanitize(file.name)}`

    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })
    if (upErr) throw upErr

    const { data, error } = await supabase
      .from('documents')
      .insert({
        organization_id: organizationId,
        matter_id: matterId || null,
        name: file.name,
        storage_path: path,
        mime_type: file.type || null,
        size_bytes: file.size,
        category: category || null,
        uploaded_by: uploadedBy,
      })
      .select('id')
      .single()
    if (error) {
      await supabase.storage.from(BUCKET).remove([path])
      throw error
    }
    await supabase.rpc('log_audit', {
      p_org: organizationId,
      p_action: 'document.uploaded',
      p_entity_type: 'document',
      p_entity_id: data.id,
      p_summary: `Uploaded ${file.name}`,
    })
  },

  async signedUrl(path: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn)
    if (error) throw error
    return data.signedUrl
  },

  async remove(doc: DocumentRow): Promise<void> {
    await supabase.storage.from(BUCKET).remove([doc.storage_path])
    const { error } = await supabase.from('documents').delete().eq('id', doc.id)
    if (error) throw error
    await supabase.rpc('log_audit', {
      p_org: doc.organization_id,
      p_action: 'document.deleted',
      p_entity_type: 'document',
      p_entity_id: doc.id,
      p_summary: `Deleted ${doc.name}`,
    })
  },
}
