-- Loan estimator config: per-acre limit and bank rates (KCC/agri). Frontend reads via anon key.
create table if not exists public.loan_estimator_config (
  id text primary key default 'default',
  per_acre_limit_lakhs numeric not null default 1.6,
  banks_and_rates jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

alter table public.loan_estimator_config enable row level security;
create policy "Allow anon read only" on public.loan_estimator_config
  for select to anon using (true);

comment on table public.loan_estimator_config is 'KCC/agri loan estimator: per-acre limit and bank rates. Read-only for frontend.';

insert into public.loan_estimator_config (id, per_acre_limit_lakhs, banks_and_rates) values (
  'default',
  1.6,
  '[
    {"bank": "SBI", "scheme": "KCC (crop loan)", "ratePct": 7, "processingFee": "Nil", "applicationLink": "https://www.onlinesbi.sbi/sbicollect/icollecthome.htm", "notes": "With interest subvention"},
    {"bank": "SBI", "scheme": "KCC (beyond subvention)", "ratePct": 9.5, "processingFee": "—", "applicationLink": "https://www.onlinesbi.sbi/sbicollect/icollecthome.htm"},
    {"bank": "HDFC Bank", "scheme": "Kisan Credit Card", "ratePct": 8.5, "processingFee": "0.5%", "applicationLink": "https://www.hdfcbank.com/personal/borrow/personal-loan/agriculture-loan"},
    {"bank": "ICICI Bank", "scheme": "KCC / Agri term", "ratePct": 9, "processingFee": "—", "applicationLink": "https://www.icicibank.com/agriculture"},
    {"bank": "Bank of Baroda", "scheme": "KCC", "ratePct": 7, "processingFee": "Nil", "applicationLink": "https://www.bankofbaroda.in/agriculture-banking.htm"},
    {"bank": "PNB", "scheme": "KCC", "ratePct": 7, "processingFee": "Nil", "applicationLink": "https://www.pnbbank.in/agriculture.html"},
    {"bank": "Canara Bank", "scheme": "KCC", "ratePct": 7, "processingFee": "—", "applicationLink": "https://canarabank.com/agriculture"},
    {"bank": "Union Bank", "scheme": "KCC", "ratePct": 7, "processingFee": "Nil", "applicationLink": "https://www.unionbankofindia.co.in/english/agriculture.aspx"},
    {"bank": "NABARD (via banks)", "scheme": "Refinance-backed crop loans", "ratePct": 7, "processingFee": "—", "applicationLink": "https://www.nabard.org/"},
    {"bank": "Regional Rural Banks", "scheme": "KCC / short-term crop", "ratePct": 7, "processingFee": "—", "applicationLink": "#"}
  ]'::jsonb
) on conflict (id) do nothing;
