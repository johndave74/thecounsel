-- ============================================================================
-- Migration 0016 — Billing: time entries, expenses, invoices, payments.
-- ============================================================================

create type public.invoice_status as enum ('draft', 'sent', 'paid', 'void');

-- Time entries (billable hours) --------------------------------------------
create table public.time_entries (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  matter_id       uuid references public.matters(id) on delete set null,
  user_id         uuid references public.profiles(id) on delete set null,
  work_date       date not null default current_date,
  minutes         integer not null check (minutes > 0),
  rate            numeric(12,2) not null default 0,
  description     text not null,
  billable        boolean not null default true,
  invoiced        boolean not null default false,
  invoice_id      uuid,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_time_entries_org on public.time_entries (organization_id);
create index idx_time_entries_matter on public.time_entries (matter_id);
create index idx_time_entries_unbilled on public.time_entries (organization_id, invoiced) where billable and not invoiced;
create trigger trg_time_entries_updated_at before update on public.time_entries
  for each row execute function public.set_updated_at();

-- Expenses ------------------------------------------------------------------
create table public.expenses (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  matter_id       uuid references public.matters(id) on delete set null,
  user_id         uuid references public.profiles(id) on delete set null,
  expense_date    date not null default current_date,
  amount          numeric(12,2) not null check (amount >= 0),
  description     text not null,
  category        text,
  billable        boolean not null default true,
  invoiced        boolean not null default false,
  invoice_id      uuid,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_expenses_org on public.expenses (organization_id);
create index idx_expenses_matter on public.expenses (matter_id);
create trigger trg_expenses_updated_at before update on public.expenses
  for each row execute function public.set_updated_at();

-- Invoices ------------------------------------------------------------------
create table public.invoice_counters (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  year int not null,
  seq int not null default 0,
  primary key (organization_id, year)
);

create table public.invoices (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  invoice_number  text,
  client_id       uuid references public.clients(id) on delete set null,
  matter_id       uuid references public.matters(id) on delete set null,
  status          public.invoice_status not null default 'draft',
  issue_date      date not null default current_date,
  due_date        date,
  subtotal        numeric(12,2) not null default 0,
  tax             numeric(12,2) not null default 0,
  total           numeric(12,2) not null default 0,
  amount_paid     numeric(12,2) not null default 0,
  notes           text,
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organization_id, invoice_number)
);
create index idx_invoices_org on public.invoices (organization_id);
create index idx_invoices_client on public.invoices (client_id);
create trigger trg_invoices_updated_at before update on public.invoices
  for each row execute function public.set_updated_at();

create table public.invoice_items (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  invoice_id      uuid not null references public.invoices(id) on delete cascade,
  kind            text not null default 'manual', -- time | expense | manual
  description     text not null,
  quantity        numeric(12,2) not null default 1,
  unit            text,
  rate            numeric(12,2) not null default 0,
  amount          numeric(12,2) not null default 0,
  created_at      timestamptz not null default now()
);
create index idx_invoice_items_invoice on public.invoice_items (invoice_id);

create table public.payments (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  invoice_id      uuid not null references public.invoices(id) on delete cascade,
  amount          numeric(12,2) not null check (amount > 0),
  method          text,
  reference       text,
  paid_at         date not null default current_date,
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index idx_payments_invoice on public.payments (invoice_id);

-- Invoice numbering ---------------------------------------------------------
create or replace function public.assign_invoice_number()
returns trigger language plpgsql security definer set search_path = public as $$
declare y int := extract(year from now())::int; n int;
begin
  if new.invoice_number is not null and new.invoice_number <> '' then return new; end if;
  insert into public.invoice_counters (organization_id, year, seq)
    values (new.organization_id, y, 1)
    on conflict (organization_id, year) do update set seq = public.invoice_counters.seq + 1
    returning seq into n;
  new.invoice_number := 'INV-' || y || '-' || lpad(n::text, 4, '0');
  return new;
end $$;
create trigger trg_invoices_number before insert on public.invoices
  for each row execute function public.assign_invoice_number();

-- Keep invoice.amount_paid + status in sync with payments -------------------
create or replace function public.recalc_invoice_payment()
returns trigger language plpgsql security definer set search_path = public as $$
declare inv uuid := coalesce(new.invoice_id, old.invoice_id); paid numeric; tot numeric; st public.invoice_status;
begin
  select coalesce(sum(amount),0) into paid from public.payments where invoice_id = inv;
  select total, status into tot, st from public.invoices where id = inv;
  update public.invoices
    set amount_paid = paid,
        status = case
          when st = 'void' then 'void'
          when tot > 0 and paid >= tot then 'paid'
          when st = 'paid' and paid < tot then 'sent'
          else st end
    where id = inv;
  return null;
end $$;
create trigger trg_recalc_invoice_payment
  after insert or delete on public.payments
  for each row execute function public.recalc_invoice_payment();

-- Timeline entry when an invoice is raised on a matter ----------------------
create or replace function public.track_invoice_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.matter_id is not null then
    insert into public.matter_events (organization_id, matter_id, actor_id, kind, summary)
    values (new.organization_id, new.matter_id, coalesce(new.created_by, auth.uid()), 'invoice_created',
            'Invoice raised');
  end if;
  return new;
end $$;
create trigger trg_track_invoice_created after insert on public.invoices
  for each row execute function public.track_invoice_created();

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table public.time_entries enable row level security;
alter table public.expenses enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;

create policy "time_entries_select" on public.time_entries
  for select using (public.has_permission(organization_id, 'billing.view') or user_id = auth.uid());
create policy "time_entries_write" on public.time_entries
  for all using (public.has_permission(organization_id, 'billing.view') or user_id = auth.uid())
  with check (public.has_permission(organization_id, 'billing.view') or user_id = auth.uid());

create policy "expenses_select" on public.expenses
  for select using (public.has_permission(organization_id, 'billing.view') or user_id = auth.uid());
create policy "expenses_write" on public.expenses
  for all using (public.has_permission(organization_id, 'expenses.manage') or user_id = auth.uid())
  with check (public.has_permission(organization_id, 'expenses.manage') or user_id = auth.uid());

create policy "invoices_select" on public.invoices
  for select using (public.has_permission(organization_id, 'billing.view'));
create policy "invoices_write" on public.invoices
  for all using (public.has_permission(organization_id, 'invoices.manage'))
  with check (public.has_permission(organization_id, 'invoices.manage'));

create policy "invoice_items_select" on public.invoice_items
  for select using (public.has_permission(organization_id, 'billing.view'));
create policy "invoice_items_write" on public.invoice_items
  for all using (public.has_permission(organization_id, 'invoices.manage'))
  with check (public.has_permission(organization_id, 'invoices.manage'));

create policy "payments_select" on public.payments
  for select using (public.has_permission(organization_id, 'billing.view'));
create policy "payments_write" on public.payments
  for all using (public.has_permission(organization_id, 'payments.manage'))
  with check (public.has_permission(organization_id, 'payments.manage'));

-- ----------------------------------------------------------------------------
-- Generate an invoice from unbilled billable work.
-- ----------------------------------------------------------------------------
create or replace function public.generate_invoice(
  p_org uuid,
  p_client uuid,
  p_matter uuid default null,
  p_due_date date default null,
  p_tax_rate numeric default 0
)
returns public.invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.invoices;
  sub numeric := 0;
  tax_amt numeric := 0;
begin
  if not public.has_permission(p_org, 'invoices.manage') then
    raise exception 'Not allowed to create invoices' using errcode = '42501';
  end if;

  insert into public.invoices (organization_id, client_id, matter_id, status, due_date, created_by)
  values (p_org, p_client, p_matter, 'draft', p_due_date, auth.uid())
  returning * into inv;

  -- Time entries -> items
  insert into public.invoice_items (organization_id, invoice_id, kind, description, quantity, unit, rate, amount)
  select t.organization_id, inv.id, 'time',
         coalesce(t.description, 'Legal services'),
         round(t.minutes / 60.0, 2), 'hrs', t.rate,
         round(t.minutes / 60.0 * t.rate, 2)
  from public.time_entries t
  where t.organization_id = p_org and t.billable and not t.invoiced
    and (p_matter is not null and t.matter_id = p_matter
         or p_matter is null and t.matter_id in (select id from public.matters where client_id = p_client));

  update public.time_entries t set invoiced = true, invoice_id = inv.id
  where t.organization_id = p_org and t.billable and not t.invoiced
    and (p_matter is not null and t.matter_id = p_matter
         or p_matter is null and t.matter_id in (select id from public.matters where client_id = p_client));

  -- Expenses -> items
  insert into public.invoice_items (organization_id, invoice_id, kind, description, quantity, unit, rate, amount)
  select e.organization_id, inv.id, 'expense', coalesce(e.description, 'Expense'), 1, null, e.amount, e.amount
  from public.expenses e
  where e.organization_id = p_org and e.billable and not e.invoiced
    and (p_matter is not null and e.matter_id = p_matter
         or p_matter is null and e.matter_id in (select id from public.matters where client_id = p_client));

  update public.expenses e set invoiced = true, invoice_id = inv.id
  where e.organization_id = p_org and e.billable and not e.invoiced
    and (p_matter is not null and e.matter_id = p_matter
         or p_matter is null and e.matter_id in (select id from public.matters where client_id = p_client));

  select coalesce(sum(amount), 0) into sub from public.invoice_items where invoice_id = inv.id;
  tax_amt := round(sub * coalesce(p_tax_rate, 0) / 100.0, 2);

  update public.invoices set subtotal = sub, tax = tax_amt, total = sub + tax_amt where id = inv.id
  returning * into inv;

  perform public.log_audit(p_org, 'invoice.created', 'invoice', inv.id, 'Generated ' || inv.invoice_number);
  return inv;
end;
$$;

grant execute on function public.generate_invoice(uuid, uuid, uuid, date, numeric) to authenticated;
