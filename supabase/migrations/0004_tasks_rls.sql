-- Tasks: manager owns the lifecycle, worker sees only assigned active tasks.

create or replace function public.validate_task_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_assignee_role public.app_role;
  v_author_role public.app_role;
begin
  if tg_op = 'INSERT' and new.status <> 'new' then
    raise exception 'INVALID_INITIAL_STATUS' using errcode = 'MC010';
  end if;

  if tg_op = 'UPDATE' then
    if new.author_id <> old.author_id or new.created_at <> old.created_at then
      raise exception 'TASK_METADATA_IMMUTABLE' using errcode = 'MC011';
    end if;
    if new.status <> old.status
       and coalesce(current_setting('app.task_transition', true), '') <> 'on' then
      raise exception 'STATUS_CHANGE_FORBIDDEN' using errcode = 'MC012';
    end if;
  end if;

  select role into v_assignee_role
  from public.profiles
  where id = new.assignee_id;

  if v_assignee_role is distinct from 'worker' then
    raise exception 'ASSIGNEE_MUST_BE_WORKER' using errcode = 'MC013';
  end if;

  select role into v_author_role
  from public.profiles
  where id = new.author_id;

  if v_author_role is distinct from 'manager' then
    raise exception 'AUTHOR_MUST_BE_MANAGER' using errcode = 'MC014';
  end if;

  if not public.project_is_active(new.project_id) then
    raise exception 'PROJECT_ARCHIVED' using errcode = 'MC015';
  end if;

  return new;
end;
$$;

create trigger tasks_validate_row
before insert or update on public.tasks
for each row execute function public.validate_task_row();

revoke execute on function public.validate_task_row() from public, anon, authenticated;

create policy tasks_select on public.tasks
for select to authenticated
using (
  public.is_manager()
  or (
    assignee_id = auth.uid()
    and deleted_at is null
    and public.project_is_active(project_id)
  )
);

create policy tasks_insert on public.tasks
for insert to authenticated
with check (
  public.is_manager()
  and author_id = auth.uid()
  and status = 'new'
  and deleted_at is null
);

create policy tasks_update on public.tasks
for update to authenticated
using (public.is_manager() and deleted_at is null)
with check (public.is_manager());

revoke all on public.tasks from anon, authenticated;
grant select on public.tasks to authenticated;
grant insert (project_id, title, description, assignee_id, author_id) on public.tasks to authenticated;
grant update (title, description, project_id, assignee_id, deleted_at) on public.tasks to authenticated;
