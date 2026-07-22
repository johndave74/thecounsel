import * as React from 'react'
import { useUpdateOrganization } from '@/features/platform/hooks/use-platform'
import type { OrgRow } from '@/features/platform/types'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { toast } from '@/shared/components/ui/sonner'

export function EditOrganizationDialog({
  org,
  open,
  onOpenChange,
}: {
  org: OrgRow | null
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const update = useUpdateOrganization()
  const [form, setForm] = React.useState({
    name: '',
    legal_name: '',
    industry: '',
    website: '',
    phone: '',
    billing_email: '',
  })

  React.useEffect(() => {
    if (org && open) {
      setForm({
        name: org.name ?? '',
        legal_name: org.legal_name ?? '',
        industry: org.industry ?? '',
        website: org.website ?? '',
        phone: org.phone ?? '',
        billing_email: org.billing_email ?? '',
      })
    }
  }, [org, open])

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!org) return
    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }
    try {
      await update.mutateAsync({
        id: org.id,
        patch: {
          name: form.name.trim(),
          legal_name: form.legal_name || null,
          industry: form.industry || null,
          website: form.website || null,
          phone: form.phone || null,
          billing_email: form.billing_email || null,
        },
      })
      toast.success('Organization updated')
      onOpenChange(false)
    } catch (err) {
      toast.error('Could not update', { description: err instanceof Error ? err.message : undefined })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {org?.name}</DialogTitle>
          <DialogDescription>Update the firm's profile. The slug cannot be changed.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Firm name</Label>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Legal name</Label>
              <Input value={form.legal_name} onChange={(e) => set('legal_name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Industry</Label>
              <Input value={form.industry} onChange={(e) => set('industry', e.target.value)} placeholder="Corporate Law" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Website</Label>
              <Input value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Billing email</Label>
            <Input type="email" value={form.billing_email} onChange={(e) => set('billing_email', e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} loading={update.isPending}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
