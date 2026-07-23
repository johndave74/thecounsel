import type { InvoiceDetail } from '@/features/billing/types'
import { formatNaira } from '@/shared/lib/format'

function esc(s: string | null | undefined): string {
  return (s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string)
}

/** Open a print-ready invoice in a new window and trigger the browser's Save-as-PDF. */
export function printInvoice(inv: InvoiceDetail, orgName: string): void {
  const rows = inv.items
    .map(
      (i) => `<tr>
        <td>${esc(i.description)}</td>
        <td class="r">${Number(i.quantity)}${i.unit ? ' ' + esc(i.unit) : ''}</td>
        <td class="r">${formatNaira(Number(i.rate))}</td>
        <td class="r">${formatNaira(Number(i.amount))}</td>
      </tr>`,
    )
    .join('')

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(inv.invoice_number ?? 'Invoice')}</title>
  <style>
    *{box-sizing:border-box} body{font-family:Inter,Arial,sans-serif;color:#1c1917;margin:40px;font-size:13px}
    h1{font-family:'Playfair Display',Georgia,serif;font-size:28px;margin:0}
    .brand{color:#B38A3E;font-weight:600}
    .head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px}
    .muted{color:#78716c} table{width:100%;border-collapse:collapse;margin-top:24px}
    th,td{padding:10px 8px;border-bottom:1px solid #e7e5e4;text-align:left} th{font-size:11px;text-transform:uppercase;color:#78716c}
    .r{text-align:right} .totals{margin-top:16px;margin-left:auto;width:280px}
    .totals div{display:flex;justify-content:space-between;padding:6px 8px}
    .totals .grand{border-top:2px solid #1c1917;font-weight:700;font-size:15px}
    .badge{display:inline-block;padding:3px 10px;border-radius:999px;background:#f5f5f4;font-size:11px;text-transform:uppercase}
  </style></head><body>
    <div class="head">
      <div><div class="brand">${esc(orgName)}</div><div class="muted">Powered by The Counsel</div></div>
      <div style="text-align:right"><h1>Invoice</h1><div class="muted">${esc(inv.invoice_number ?? '')}</div>
        <div class="badge">${esc(inv.status)}</div></div>
    </div>
    <div class="head">
      <div><div class="muted">Billed to</div><strong>${esc(inv.client?.display_name ?? '—')}</strong></div>
      <div style="text-align:right">
        <div><span class="muted">Issued</span> ${esc(inv.issue_date)}</div>
        ${inv.due_date ? `<div><span class="muted">Due</span> ${esc(inv.due_date)}</div>` : ''}
      </div>
    </div>
    <table><thead><tr><th>Description</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amount</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="4" class="muted">No line items</td></tr>'}</tbody></table>
    <div class="totals">
      <div><span class="muted">Subtotal</span><span>${formatNaira(Number(inv.subtotal))}</span></div>
      <div><span class="muted">Tax</span><span>${formatNaira(Number(inv.tax))}</span></div>
      <div class="grand"><span>Total</span><span>${formatNaira(Number(inv.total))}</span></div>
      <div><span class="muted">Paid</span><span>${formatNaira(Number(inv.amount_paid))}</span></div>
      <div><span class="muted">Balance</span><span>${formatNaira(Number(inv.total) - Number(inv.amount_paid))}</span></div>
    </div>
    ${inv.notes ? `<p class="muted" style="margin-top:24px">${esc(inv.notes)}</p>` : ''}
    <script>window.onload=function(){window.print()}</script>
  </body></html>`

  const w = window.open('', '_blank', 'width=800,height=900')
  if (!w) return
  w.document.write(html)
  w.document.close()
}
