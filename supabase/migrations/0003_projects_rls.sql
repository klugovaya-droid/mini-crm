-- Projects are visible to managers and to workers who have an active task there.

create or replace function public.project_is_active(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = p_project_id
      and p.deleted_at is null
  )
$$;

revoke execute on function public.project_is_active(uuid) from public, anon;
grant execute on function public.project_is_active(uuid) to authenticated;

create or replace function public.worker_has_project_task(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tasks t
    where t.project_id = p_project_id
      and t.assignee_id = auth.uid()
      and t.deleted_at is null
  )
$$;

revoke execute on function public.worker_has_project_task(uuid) from public, anon;
grant execute on function public.worker_has_project_task(uuid) to authenticated;

create policy projects_select on public.projects
for select to authenticated
using (
  public.is_manager()
  or (deleted_at is null and public.worker_has_project_task(id))
);

create policy projects_insert on public.projects
for insert to authenticated
with check (
  public.is_manager()
  and created_by = auth.uid()
  and deleted_at is null
);

create policy projects_update on public.projects
for update to authenticated
using (public.is_manager() and deleted_at is null)
with check (public.is_manager());

revoke all on public.projects from anon, authenticated;
grant select on public.projects to authenticated;
grant insert (name, address, created_by) on public.projects to authenticated;
grant update (name, address, deleted_at) on public.projects to authenticated;
