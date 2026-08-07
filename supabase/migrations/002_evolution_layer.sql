-- Supportable Evolution Layer
-- Adds lifecycle management, branching, review, and evidence evolution concepts


-- ============================================================
-- Lifecycle support
-- ============================================================

alter table participants
add column if not exists status text default 'active',
add column if not exists archived_at timestamptz,
add column if not exists archived_by uuid references participants(id),
add column if not exists archive_reason text;


alter table roles
add column if not exists status text default 'active',
add column if not exists archived_at timestamptz,
add column if not exists archived_by uuid references participants(id),
add column if not exists archive_reason text;


alter table intents
add column if not exists status text default 'open',
add column if not exists archived_at timestamptz,
add column if not exists archived_by uuid references participants(id),
add column if not exists archive_reason text;


alter table solutions
add column if not exists status text default 'active',
add column if not exists archived_at timestamptz,
add column if not exists archived_by uuid references participants(id),
add column if not exists archive_reason text;


-- ============================================================
-- Workspaces
-- ============================================================

create table if not exists workspaces (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    description text,
    created_by uuid references participants(id),
    status text default 'active',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);


-- ============================================================
-- Branches
-- ============================================================

create table if not exists branches (
    id uuid primary key default uuid_generate_v4(),
    workspace_id uuid references workspaces(id),
    name text not null,
    description text,
    created_by uuid references participants(id),
    branch_type text default 'development',
    created_at timestamptz default now()
);


-- ============================================================
-- Change Sets
-- ============================================================

create table if not exists change_sets (
    id uuid primary key default uuid_generate_v4(),
    branch_id uuid references branches(id),
    created_by uuid references participants(id),
    title text not null,
    description text,
    status text default 'proposed',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);


-- ============================================================
-- Review Requests
-- ============================================================

create table if not exists review_requests (
    id uuid primary key default uuid_generate_v4(),
    change_set_id uuid references change_sets(id),
    requested_by uuid references participants(id),
    status text default 'open',
    created_at timestamptz default now(),
    completed_at timestamptz
);


-- ============================================================
-- Reviews
-- ============================================================

create table if not exists reviews (
    id uuid primary key default uuid_generate_v4(),
    review_request_id uuid references review_requests(id),
    reviewer_id uuid references participants(id),
    decision text,
    comments text,
    created_at timestamptz default now()
);


-- ============================================================
-- Merges
-- ============================================================

create table if not exists merges (
    id uuid primary key default uuid_generate_v4(),
    change_set_id uuid references change_sets(id),
    merged_by uuid references participants(id),
    merge_status text default 'completed',
    created_at timestamptz default now()
);


-- ============================================================
-- Evidence evolution improvements
-- ============================================================

alter table evidence
add column if not exists evidence_type text,
add column if not exists verification_status text default 'unverified',
add column if not exists verified_by uuid references participants(id);


-- ============================================================
-- Relationship evolution
-- ============================================================

alter table relationships
add column if not exists status text default 'active',
add column if not exists created_by uuid references participants(id),
add column if not exists supersedes_relationship_id uuid references relationships(id);


-- ============================================================
-- Initial lifecycle documentation
-- ============================================================

comment on table change_sets is
'Proposed changes to Supportable knowledge, solutions, or relationships.';

comment on table reviews is
'Evidence-based evaluation of proposed changes.';

comment on table merges is
'Accepted evolution from proposed state into active knowledge.';
