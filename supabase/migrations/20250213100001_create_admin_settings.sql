-- Admin settings (notifications toggle, default from)
create table if not exists public.admin_settings (
  key text primary key,
  value jsonb not null default 'null',
  updated_at timestamptz not null default now()
);

alter table public.admin_settings enable row level security;
create policy "Allow all for admin_settings" on public.admin_settings for all using (true) with check (true);

insert into public.admin_settings (key, value) values
  ('notifications_enabled', 'true'),
  ('default_from', 'null')
on conflict (key) do nothing;

comment on table public.admin_settings is 'Admin panel settings: notifications_enabled, default_from';
