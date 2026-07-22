import * as React from 'react'
import { Download, ExternalLink, FileText, Loader2 } from 'lucide-react'
import { documentsService } from '@/features/matters/services/documents.service'
import type { DocumentRow } from '@/shared/types/database.types'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { formatStorage } from '@/shared/lib/format'

function ext(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? ''
}
const OFFICE = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']

export function DocumentViewer({
  doc,
  open,
  onOpenChange,
}: {
  doc: DocumentRow | null
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const [url, setUrl] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let active = true
    if (open && doc) {
      setLoading(true)
      setError(null)
      setUrl(null)
      documentsService
        .signedUrl(doc.storage_path, 3600)
        .then((u) => active && setUrl(u))
        .catch((e) => active && setError(e instanceof Error ? e.message : 'Could not load file'))
        .finally(() => active && setLoading(false))
    }
    return () => {
      active = false
    }
  }, [open, doc])

  const e = doc ? ext(doc.name) : ''
  const isPdf = e === 'pdf' || doc?.mime_type === 'application/pdf'
  const isImage = doc?.mime_type?.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(e)
  const isOffice = OFFICE.includes(e)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[95vw] max-w-5xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-4 pr-6">
            <span className="flex min-w-0 items-center gap-2">
              <FileText className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">{doc?.name}</span>
              {doc?.size_bytes != null && (
                <span className="shrink-0 text-xs font-normal text-muted-foreground">{formatStorage(doc.size_bytes)}</span>
              )}
            </span>
            {url && (
              <span className="flex shrink-0 gap-2">
                <Button asChild variant="outline" size="sm">
                  <a href={url} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" /> Open
                  </a>
                </Button>
                <Button asChild size="sm">
                  <a href={url} download={doc?.name}>
                    <Download className="h-4 w-4" /> Download
                  </a>
                </Button>
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="h-[75vh] w-full overflow-hidden rounded-lg border border-border bg-muted/40">
          {loading ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-destructive">{error}</div>
          ) : url && isPdf ? (
            <iframe title={doc?.name} src={url} className="h-full w-full" />
          ) : url && isImage ? (
            <div className="flex h-full items-center justify-center overflow-auto p-4">
              <img src={url} alt={doc?.name} className="max-h-full max-w-full object-contain" />
            </div>
          ) : url && isOffice ? (
            <iframe
              title={doc?.name}
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
              className="h-full w-full"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <FileText className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Preview isn't available for this file type.</p>
              {url && (
                <Button asChild>
                  <a href={url} download={doc?.name}>
                    <Download className="h-4 w-4" /> Download to view
                  </a>
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
