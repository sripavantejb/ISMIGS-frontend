-- Extended sector options: label, enabled, cc, bcc
alter table public.sector_recipients
  add column if not exists label text,
  add column if not exists enabled boolean not null default true,
  add column if not exists cc text[] not null default '{}',
  add column if not exists bcc text[] not null default '{}';
