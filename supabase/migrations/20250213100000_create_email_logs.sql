-- Email send history for admin logs
create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  sector_key text not null,
  recipient text not null,
  subject text not null default '',
  sent_at timestamptz not null default now(),
  success boolean not null default true,
  error_message text
);

create index if not exists idx_email_logs_sent_at on public.email_logs (sent_at desc);
create index if not exists idx_email_logs_sector_key on public.email_logs (sector_key);

alter table public.email_logs enable row level security;
create policy "Allow all for email_logs" on public.email_logs for all using (true) with check (true);

comment on table public.email_logs is 'Log of emails sent per sector for admin audit';
