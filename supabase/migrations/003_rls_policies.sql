-- Supportable RLS Foundation
-- Initial security policies for authenticated participants


-- ============================================================
-- Enable RLS
-- ============================================================

alter table participants enable row level security;
alter table roles enable row level security;
alter table participant_roles enable row level security;
alter table intents enable row level security;
alter table solutions enable row level security;
alter table relationships enable row level security;
alter table evidence enable row level security;
alter table sessions enable row level security;


-- ============================================================
-- Participants
-- ============================================================

create policy "Users can view their own participant record"
on participants
for select
using (
    id = auth.uid()
);


create policy "Users can update their own participant record"
on participants
for update
using (
    id = auth.uid()
);


-- ============================================================
-- Roles
-- ============================================================

create policy "Authenticated users can view roles"
on roles
for select
to authenticated
using (true);


-- ============================================================
-- Participant Roles
-- ============================================================

create policy "Users can view their own roles"
on participant_roles
for select
using (
    participant_id = auth.uid()
);


-- ============================================================
-- Intents
-- ============================================================

create policy "Users can create intents"
on intents
for insert
to authenticated
with check (
    created_by = auth.uid()
);


create policy "Users can view their own intents"
on intents
for select
using (
    created_by = auth.uid()
);


create policy "Users can update their own intents"
on intents
for update
using (
    created_by = auth.uid()
);


-- ============================================================
-- Solutions
-- ============================================================

create policy "Users can create solutions"
on solutions
for insert
to authenticated
with check (
    created_by = auth.uid()
);


create policy "Users can view their own solutions"
on solutions
for select
using (
    created_by = auth.uid()
);


create policy "Users can update their own solutions"
on solutions
for update
using (
    created_by = auth.uid()
);


-- ============================================================
-- Evidence
-- ============================================================

create policy "Users can create evidence"
on evidence
for insert
to authenticated
with check (
    participant_id = auth.uid()
);


create policy "Users can view their own evidence"
on evidence
for select
using (
    participant_id = auth.uid()
);


-- ============================================================
-- Sessions
-- ============================================================

create policy "Users can view sessions they created"
on sessions
for select
using (
    intent_id in (
        select id
        from intents
        where created_by = auth.uid()
    )
);


-- ============================================================
-- Relationships
-- ============================================================

create policy "Users can create relationships"
on relationships
for insert
to authenticated
with check (
    created_by = auth.uid()
);


create policy "Users can view relationships they created"
on relationships
for select
using (
    created_by = auth.uid()
);
