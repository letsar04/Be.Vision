create extension if not exists pgcrypto;

create table if not exists public.data_sources (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade,
 name text not null, kind text not null default 'open_data' check (kind in ('open_data','osm','manual','api')),
 base_url text, active boolean not null default true, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table if not exists public.datasets (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade,
 source_id uuid references public.data_sources(id) on delete set null, name text not null, slug text not null,
 description text, source_url text, format text not null default 'json', schema jsonb not null default '{}'::jsonb,
 row_count integer not null default 0, last_imported_at timestamptz, created_at timestamptz not null default now(),
 unique (tenant_id, slug)
);
create table if not exists public.dataset_rows (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade,
 dataset_id uuid not null references public.datasets(id) on delete cascade, row_number integer not null,
 data jsonb not null, geometry jsonb, created_at timestamptz not null default now(),
 unique (dataset_id,row_number)
);
create table if not exists public.data_queries (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade,
 question text not null, query_type text not null default 'exploration', result jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create index if not exists data_sources_tenant_idx on public.data_sources(tenant_id);
create index if not exists datasets_tenant_idx on public.datasets(tenant_id);
create index if not exists dataset_rows_dataset_idx on public.dataset_rows(dataset_id);
create index if not exists dataset_rows_data_gin_idx on public.dataset_rows using gin(data);
create index if not exists data_queries_tenant_idx on public.data_queries(tenant_id);
alter table public.data_sources enable row level security;
alter table public.datasets enable row level security;
alter table public.dataset_rows enable row level security;
alter table public.data_queries enable row level security;
drop policy if exists "data_sources_member" on public.data_sources;
create policy "data_sources_member" on public.data_sources for all to authenticated using (exists(select 1 from public.tenant_members tm where tm.tenant_id=data_sources.tenant_id and tm.user_id=(select auth.uid()))) with check (exists(select 1 from public.tenant_members tm where tm.tenant_id=data_sources.tenant_id and tm.user_id=(select auth.uid())));
drop policy if exists "datasets_member" on public.datasets;
create policy "datasets_member" on public.datasets for all to authenticated using (exists(select 1 from public.tenant_members tm where tm.tenant_id=datasets.tenant_id and tm.user_id=(select auth.uid()))) with check (exists(select 1 from public.tenant_members tm where tm.tenant_id=datasets.tenant_id and tm.user_id=(select auth.uid())));
drop policy if exists "dataset_rows_member" on public.dataset_rows;
create policy "dataset_rows_member" on public.dataset_rows for all to authenticated using (exists(select 1 from public.tenant_members tm where tm.tenant_id=dataset_rows.tenant_id and tm.user_id=(select auth.uid()))) with check (exists(select 1 from public.tenant_members tm where tm.tenant_id=dataset_rows.tenant_id and tm.user_id=(select auth.uid())));
drop policy if exists "data_queries_member" on public.data_queries;
create policy "data_queries_member" on public.data_queries for all to authenticated using (exists(select 1 from public.tenant_members tm where tm.tenant_id=data_queries.tenant_id and tm.user_id=(select auth.uid()))) with check (exists(select 1 from public.tenant_members tm where tm.tenant_id=data_queries.tenant_id and tm.user_id=(select auth.uid())));
