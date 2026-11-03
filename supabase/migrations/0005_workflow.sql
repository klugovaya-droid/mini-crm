-- Status workflow and append-only history.
--
-- Status changes are possible only through transition_task(). The function
-- checks the actor and the transition matrix, then writes a history row in the
-- same transaction.

create or replace function public.transition_task(
  p_task_id uuid,
  p_to_status public.task_status,
  p_comment text default null
)
returns public.tasks
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_role public.app_role;
  v_task public.tasks;
  v_from public.task_status;
  v_comment text := nullif(btrim(coalesce(p_comment, '')), '');
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'MC001';
  end if;

  v_role := public.current_user_role();
  if v_role is null then
    raise exception 'PROFILE_NOT_FOUND' using errcode = 'MC002';
  end if;

  select * into v_task
  from public.tasks
  where id = p_task_id
  for update;

  if not found or v_task.deleted_at is not null then
    raise exception 'TASK_NOT_FOUND' using errcode = 'MC003';
  end if;

  if not public.project_is_active(v_task.project_id) then
    raise exception 'PROJECT_ARCHIVED' using errcode = 'MC004';
  end if;

  v_from := v_task.status;

  if v_role = 'worker' then
    if v_task.assignee_id <> v_uid then
      raise exception 'TASK_NOT_ASSIGNED_TO_YOU' using errcode = 'MC005';
    end if;

    if not (
      (v_from = 'new' and p_to_status = 'in_progress')
      or (v_from = 'in_progress' and p_to_status = 'on_review')
      or (v_from = 'rework' and p_to_status = 'in_progress')
    ) then
      raise exception 'INVALID_TRANSITION' using errcode = 'MC006';
    end if;
  elsif v_role = 'manager' then
    if not (
      v_from = 'on_review'
      and p_to_status in ('accepted', 'rework')
    ) then
      raise exception 'INVALID_TRANSITION' using errcode = 'MC006';
    end if;
  else
    raise exception 'FORBIDDEN' using errcode = 'MC007';
  end if;

  if p_to_status = 'rework' and v_comment is null then
    raise exception 'COMMENT_REQUIRED' using errcode = 'MC008';
  end if;

  perform set_config('app.task_transition', 'on', true);

  update public.tasks
  set status = p_to_status,
      updated_at = now()
  where id = p_task_id
  returning * into v_task;

  perform set_config('app.task_transition', 'off', true);

  insert into public.task_status_history (task_id, changed_by, from_status, to_status, comment)
  values (p_task_id, v_uid, v_from, p_to_status, v_comment);

  return v_task;
end;
$$;

revoke execute on function public.transition_task(uuid, public.task_status, text)
  from public, anon;
grant execute on function public.transition_task(uuid, public.task_status, text)
  to authenticated;

create or replace function public.log_task_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.task_status_history (task_id, changed_by, from_status, to_status)
  values (new.id, coalesce(auth.uid(), new.author_id), null, new.status);

  return new;
end;
$$;

create trigger tasks_log_created
after insert on public.tasks
for each row execute function public.log_task_created();

revoke execute on function public.log_task_created() from public, anon, authenticated;

create or replace function public.prevent_history_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'HISTORY_IMMUTABLE' using errcode = 'MC009';
end;
$$;

create trigger task_status_history_immutable
before update or delete on public.task_status_history
for each row execute function public.prevent_history_mutation();

revoke execute on function public.prevent_history_mutation() from public, anon, authenticated;

create policy history_select on public.task_status_history
for select to authenticated
using (
  public.is_manager()
  or exists (
    select 1
    from public.tasks t
    where t.id = task_status_history.task_id
      and t.assignee_id = auth.uid()
      and t.deleted_at is null
      and public.project_is_active(t.project_id)
  )
);

revoke all on public.task_status_history from anon, authenticated;
grant select on public.task_status_history to authenticated;

revoke insert, update, delete, truncate on public.task_status_history from service_role;
