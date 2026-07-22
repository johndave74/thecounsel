import { supabase } from '@/shared/lib/supabase'
import type { DocumentRow } from '@/shared/types/database.types'

const BUCKET = 'documents'

function sanitize(name: string): string {
  return name.replace(/[^\w.\-]+/g, '_').slice(-120)
}

export const documentsService = {
  async listByMatter(matterId: string): Promise<DocumentRow[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('matter_id', matterId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  async upload(params: {
    organizationId: string
    matterId: string
    file: File
    uploadedBy: string | null
    category?: string
  }): Promise<DocumentRow> {
    const { organizationId, matterId, file, uploadedBy, category } = params
    const path = `${organizationId}/${matterId}/${crypto.randomUUID()}-${sanitize(file.name)}`

    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })
    if (upErr) throw upErr

    const { data, error } = await supabase
      .from('documents')
      .insert({
        organization_id: organizationId,
        matter_id: matterId,
        name: file.name,
        storage_path: path,
        mime_type: file.type || null,
        size_bytes: file.size,
        category: category ?? null,
        uploaded_by: uploadedBy,
      })
      .select('*')
      .single()
    if (error) {
      // Roll back the uploaded object if the row insert fails.
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
    return data
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
