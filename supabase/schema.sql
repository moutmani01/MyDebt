-- Run once in Supabase SQL Editor. Auth users are managed by Supabase itself.
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null check (char_length(trim(name)) > 0),
  type text not null check (type in ('person','company')) default 'person',
  phone text, email text, notes text,
  created_at timestamptz not null default now()
);
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  type text not null check (type in ('debit','credit')),
  amount numeric(12,2) not null check (amount > 0),
  date date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);
create index contacts_user_name_idx on public.contacts(user_id, name);
create index transactions_user_contact_date_idx on public.transactions(user_id, contact_id, date desc);
alter table public.contacts enable row level security;
alter table public.transactions enable row level security;
create policy "Users manage their contacts" on public.contacts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their transactions" on public.transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
