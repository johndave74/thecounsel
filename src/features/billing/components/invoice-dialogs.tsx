import * as React from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { Printer, Loader2 } from 'lucide-react'
import { useAuth } from '@/features/auth/context/auth-provider'
import { useClients } from '@/features/clients/hooks/use-clients'
import { useMatters } from '@/features/matters/hooks/use-matters'
import { useGenerateInvoice, useInvoice, useSetInvoiceStatus, useAddPayment } from '@/features/billing/hooks/use-billing'
import { INVOICE_STATUS_META } from '@/features/billing/types'
import { printInvoice } from '@/features/billing/lib/print-invoice'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Badge } from '@/shared/components/ui/badge'
import { Separator } from '@/shared/components/ui/separator'
import { Skeleton } from '@/shared/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { formatNaira } from '@/shared/lib/format'
import { toast } from '@/shared/components/ui/sonner'

const NONE = '__none__'

export function GenerateInvoiceDialog({
  open,
  onOpenChange,
  onGenerated,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onGenerated: (invoiceId: string) => void
}) {
  const { activeOrgId } = useAuth()
  const { data: clients } = useClients(activeOrgId, {})
  const { data: matters } = useMatters(activeOrgId, {})
  const gen = useGenerateInvoice(activeOrgId)

  const [clientId, setClientId] = React.useState('')
  const [matterId, setMatterId] = React.useState('')
  const [dueDate, setDueDate] = React.useState('')
  const [taxRate, setTaxRate] = React.useState('0')

  React.useEffect(() => {
    if (open) { setClientId(''); setMatterId(''); setDueDate(''); setTaxRate('0') }
  }, [open])

  const submit = async () => {
    if (!clientId) {
      toast.error('Choose a client')
      return
    }
    try {
      const id = await gen.mutateAsync({ clientId, matterId: matterId === NONE ? '' : matterId, dueDate, taxRate: Number(taxRate) || 0 })
      toast.success('Invoice generated from unbilled work')
      onOpenChange(false)
      onGenerated(id)
    } catch (err) {
      toast.error('Could not generate invoice', { description: err instanceof Error ? err.message : undefined })
    }
  }

  const clientMatters = matters?.filter((m) => !clientId || m.client?.id === clientId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate invoice</DialogTitle>
          <DialogDescription>Pulls all unbilled billable time and expenses into a draft invoice.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Client</Label>
            <Select value={clientId || NONE} onValueChange={(v) => setClientId(v === NONE ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Choose a client" /></SelectTrigger>
              <SelectContent>
                {clients?.map((c) => <SelectItem key={c.id} value={c.id}>{c.display_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Matter (optional — otherwise all of the client's matters)</Label>
            <Select value={matterId || NONE} onValueChange={setMatterId}>
              <SelectTrigger><SelectValue placeholder="All matters" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>All matters</SelectItem>
                {clientMatters?.map((m) => <SelectItem key={m.id} value={m.id}>{m.matter_number} — {m.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Due date</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Tax rate (%)</Label><Input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} loading={gen.isPending}>Generate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function InvoiceDetailDialog({
  invoiceId,
  open,
  onOpenChange,
}: {
  invoiceId: string | null
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const { activeOrgId, activeMembership, profile } = useAuth()
  const { data: inv, isLoading } = useInvoice(invoiceId ?? undefined)
  const setStatus = useSetInvoiceStatus(activeOrgId)
  const addPayment = useAddPayment(activeOrgId, profile?.id ?? null)

  const [payAmount, setPayAmount] = React.useState('')
  const [payMethod, setPayMethod] = React.useState('')
  const balance = inv ? Number(inv.total) - Number(inv.amount_paid) : 0

  const recordPayment = async () => {
    if (!invoiceId || !Number(payAmount)) {
      toast.error('Enter a payment amount')
      return
    }
    try {
      await addPayment.mutateAsync({
        invoiceId,
        values: { amount: Number(payAmount), method: payMethod, reference: '', paidAt: new Date().toISOString().slice(0, 10) },
      })
      setPayAmount(''); setPayMethod('')
      toast.success('Payment recorded')
    } catch (err) {
      toast.error('Could not record payment', { description: err instanceof Error ? err.message : undefined })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        {isLoading || !inv ? (
          <div className="space-y-3"><Skeleton className="h-8 w-40" /><Skeleton className="h-40 w-full" /></div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {inv.invoice_number}
                <Badge variant={INVOICE_STATUS_META[inv.status].variant}>{INVOICE_STATUS_META[inv.status].label}</Badge>
              </DialogTitle>
              <DialogDescription>
                {inv.client?.display_name}
                {inv.matter && <> · <Link to={`/matters/${inv.matter.id}`} className="text-primary hover:underline">{inv.matter.matter_number}</Link></>}
                {' · '}Issued {format(new Date(inv.issue_date), 'PP')}
                {inv.due_date && <> · Due {format(new Date(inv.due_date), 'PP')}</>}
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                    <th className="p-2.5 text-left">Description</th>
                    <th className="p-2.5 text-right">Qty</th>
                    <th className="p-2.5 text-right">Rate</th>
                    <th className="p-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {inv.items.length > 0 ? inv.items.map((i) => (
                    <tr key={i.id} className="border-b border-border/60 last:border-0">
                      <td className="p-2.5">{i.description}</td>
                      <td className="p-2.5 text-right text-muted-foreground">{Number(i.quantity)}{i.unit ? ` ${i.unit}` : ''}</td>
                      <td className="p-2.5 text-right text-muted-foreground">{formatNaira(Number(i.rate))}</td>
                      <td className="p-2.5 text-right font-medium">{formatNaira(Number(i.amount))}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No line items</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="ml-auto w-64 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatNaira(Number(inv.subtotal))}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{formatNaira(Number(inv.tax))}</span></div>
              <div className="flex justify-between border-t border-border pt-1 font-semibold"><span>Total</span><span>{formatNaira(Number(inv.total))}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span>{formatNaira(Number(inv.amount_paid))}</span></div>
              <div className="flex justify-between font-medium"><span>Balance</span><span>{formatNaira(balance)}</span></div>
            </div>

            {inv.payments.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Payments</p>
                {inv.payments.map((p) => (
                  <div key={p.id} className="flex justify-between border-b border-border/50 py-1 text-sm last:border-0">
                    <span className="text-muted-foreground">{format(new Date(p.paid_at), 'PP')}{p.method ? ` · ${p.method}` : ''}</span>
                    <span className="font-medium">{formatNaira(Number(p.amount))}</span>
                  </div>
                ))}
              </div>
            )}

            {inv.status !== 'paid' && inv.status !== 'void' && (
              <>
                <Separator />
                <div className="flex flex-wrap items-end gap-2">
                  <div className="space-y-1"><Label className="text-xs">Payment (₦)</Label><Input className="h-9 w-32" type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder={String(balance)} /></div>
                  <div className="space-y-1"><Label className="text-xs">Method</Label>
                    <Select value={payMethod || NONE} onValueChange={(v) => setPayMethod(v === NONE ? '' : v)}>
                      <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Method" /></SelectTrigger>
                      <SelectContent>
                        {['Bank transfer', 'Card', 'Cash', 'Cheque'].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={recordPayment} loading={addPayment.isPending}>Record payment</Button>
                </div>
              </>
            )}

            <DialogFooter className="sm:justify-between">
              <div className="flex gap-2">
                {inv.status === 'draft' && (
                  <Button variant="outline" onClick={() => setStatus.mutate({ id: inv.id, status: 'sent' })}>Mark sent</Button>
                )}
                {inv.status !== 'void' && inv.status !== 'paid' && (
                  <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setStatus.mutate({ id: inv.id, status: 'void' })}>Void</Button>
                )}
              </div>
              <Button onClick={() => printInvoice(inv, activeMembership?.organization.name ?? 'Your firm')}>
                {addPayment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />} Download PDF
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
