-- Sector recipients: store email addresses per sector for notifications
create table if not exists public.sector_recipients (
  sector_key text primary key,
  display_name text not null default '',
  emails text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- RLS: allow read/write for authenticated and anon (admin will be protected by app-level password or later by auth)
alter table public.sector_recipients enable row level security;

create policy "Allow read for all"
  on public.sector_recipients for select
  using (true);

create policy "Allow insert for all"
  on public.sector_recipients for insert
  with check (true);

create policy "Allow update for all"
  on public.sector_recipients for update
  using (true);

create policy "Allow delete for all"
  on public.sector_recipients for delete
  using (true);

comment on table public.sector_recipients is 'Email recipients per sector (custom, energy, wpi, iip, gva) for predictions and data notices';
