create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.capabilities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.role_capabilities (
  role_id uuid not null references public.roles(id) on delete cascade,
  capability_id uuid not null references public.capabilities(id) on delete cascade,
  primary key (role_id, capability_id)
);

create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'new' check (status in ('new','open','assigned','in_progress','waiting','resolved','closed')),
  request_type text not null default 'support' check (request_type in ('support','bug','feature','question','other')),
  application_id uuid not null references public.applications(id),
  requester_id uuid not null references public.participants(id),
  assigned_participant_id uuid references public.participants(id),
  bounty_amount numeric(12,2) not null default 0 check (bounty_amount >= 0),
  bounty_currency text not null default 'USD',
  recording_url text,
  recording_visibility text not null default 'private' check (recording_visibility in ('private','public')),
  originating_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_requests_application_idx on public.support_requests(application_id);
create index if not exists support_requests_requester_idx on public.support_requests(requester_id);
create index if not exists support_requests_assigned_idx on public.support_requests(assigned_participant_id);
create index if not exists support_requests_status_idx on public.support_requests(status);
create index if not exists support_requests_type_idx on public.support_requests(request_type);
create index if not exists support_requests_created_idx on public.support_requests(created_at desc);

alter table public.applications enable row level security;
alter table public.capabilities enable row level security;
alter table public.role_capabilities enable row level security;
alter table public.support_requests enable row level security;

create policy "authenticated can read applications" on public.applications for select to authenticated using (true);
create policy "authenticated can read capabilities" on public.capabilities for select to authenticated using (true);
create policy "authenticated can read role capabilities" on public.role_capabilities for select to authenticated using (true);
create policy "authenticated can read support requests" on public.support_requests for select to authenticated using (true);
create policy "authenticated can create own support requests" on public.support_requests for insert to authenticated
with check (exists (
  select 1 from public.participant_accounts pa
  where pa.participant_id = requester_id and pa.auth_user_id = (select auth.uid())
));

create or replace function public.set_support_request_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists support_requests_set_updated_at on public.support_requests;
create trigger support_requests_set_updated_at
before update on public.support_requests
for each row execute function public.set_support_request_updated_at();
