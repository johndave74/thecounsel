import * as React from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { useAuth } from '@/features/auth/context/auth-provider'
import { usePermissions } from '@/features/auth/hooks/use-permissions'
import { useUpdateOrganization, useUploadOrganizationLogo } from '@/features/administration/hooks/use-administration'
import { Card } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { initialsOf } from '@/shared/lib/format'
import { toast } from '@/shared/components/ui/sonner'

export function OrganizationSettings() {
  const { activeMembership, activeOrgId, refresh } = useAuth()
  const { has } = usePermissions()
  const org = activeMembership?.organization
  const update = useUpdateOrganization(activeOrgId)
  const uploadLogo = useUploadOrganizationLogo(activeOrgId)
  const fileRef = React.useRef<HTMLInputElement>(null)
  const canManage = has('organization.manage')

  const [form, setForm] = React.useState({
    name: '', legal_name: '', industry: '', website: '', phone: '', billing_email: '', timezone: '',
  })
  const [logo, setLogo] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (org) {
      setForm({
        name: org.name ?? '', legal_name: org.legal_name ?? '', industry: org.industry ?? '',
        website: org.website ?? '', phone: org.phone ?? '', billing_email: org.billing_email ?? '',
        timezone: org.timezone ?? '',
      })
      setLogo(org.logo_url ?? null)
    }
  }, [org])

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.name.trim()) { toast.error('Firm name is required'); return }
    try {
      await update.mutateAsync({
        name: form.name.trim(),
        legal_name: form.legal_name || null,
        industry: form.industry || null,
        website: form.website || null,
        phone: form.phone || null,
        billing_email: form.billing_email || null,
        timezone: form.timezone || undefined,
      })
      await refresh()
      toast.success('Firm profile saved')
    } catch (err) {
      toast.error('Could not save', { description: err instanceof Error ? err.message : undefined })
    }
  }

  const onLogo = async (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Choose an image'); return }
    try {
      const url = await uploadLogo.mutateAsync(file)
      setLogo(url)
      await refresh()
      toast.success('Logo updated')
    } catch (err) {
      toast.error('Could not upload logo', { description: err instanceof Error ? err.message : undefined })
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-4 border-b border-border pb-6">
        <div className="relative">
          <Avatar className="h-16 w-16 rounded-xl">
            {logo && <AvatarImage src={logo} alt="" className="rounded-xl" />}
            <AvatarFallback className="rounded-xl">{initialsOf(form.name, 'OR')}</AvatarFallback>
          </Avatar>
          {canManage && (
            <>
              <button type="button" onClick={() => fileRef.current?.click()} className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground hover:opacity-90" aria-label="Change logo">
                {uploadLogo.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { onLogo(e.target.files?.[0]); e.target.value = '' }} />
            </>
          )}
        </div>
        <div>
          <p className="font-display text-lg font-semibold">{form.name || 'Your firm'}</p>
          <p className="text-sm text-muted-foreground">/{org?.slug}</p>
        </div>
      </div>

      <fieldset disabled={!canManage} className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Firm name</Label><Input value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Legal name</Label><Input value={form.legal_name} onChange={(e) => set('legal_name', e.target.value)} /></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Industry</Label><Input value={form.industry} onChange={(e) => set('industry', e.target.value)} placeholder="Corporate Law" /></div>
          <div className="space-y-1.5"><Label>Timezone</Label><Input value={form.timezone} onChange={(e) => set('timezone', e.target.value)} placeholder="Africa/Lagos" /></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Website</Label><Input value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://" /></div>
          <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
        </div>
        <div className="space-y-1.5"><Label>Billing email</Label><Input type="email" value={form.billing_email} onChange={(e) => set('billing_email', e.target.value)} /></div>
      </fieldset>

      {canManage && (
        <div className="mt-6 flex justify-end">
          <Button onClick={save} loading={update.isPending}>Save changes</Button>
        </div>
      )}
    </Card>
  )
}
