import * as React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Trash2 } from 'lucide-react'
import { useAuth } from '@/features/auth/context/auth-provider'
import { useMatterNotes, useAddNote, useDeleteNote } from '@/features/matters/hooks/use-matter-notes'
import { Card } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/textarea'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { initialsOf } from '@/shared/lib/format'
import { toast } from '@/shared/components/ui/sonner'

export function NotesPanel({ matterId }: { matterId: string }) {
  const { activeOrgId, profile } = useAuth()
  const { data, isLoading } = useMatterNotes(matterId)
  const add = useAddNote(activeOrgId, matterId, profile?.id ?? null)
  const del = useDeleteNote(matterId)
  const [body, setBody] = React.useState('')

  const submit = async () => {
    if (!body.trim()) return
    try {
      await add.mutateAsync(body.trim())
      setBody('')
    } catch (err) {
      toast.error('Could not add note', { description: err instanceof Error ? err.message : undefined })
    }
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-3 p-4">
        <Textarea
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a note about this matter…"
        />
        <div className="flex justify-end">
          <Button onClick={submit} loading={add.isPending} disabled={!body.trim()}>
            Add note
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : data && data.length > 0 ? (
        <div className="space-y-3">
          {data.map((note) => (
            <Card key={note.id} className="p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/12 text-xs font-semibold text-primary">
                  {initialsOf(note.author?.full_name, 'U')}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{note.author?.full_name ?? 'Someone'}</p>
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                      </span>
                      <button
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => del.mutate(note.id)}
                        aria-label="Delete note"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{note.body}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-muted-foreground">No notes yet.</p>
      )}
    </div>
  )
}
