-- Grounded Skills Lab — Row Level Security policies
-- Added 2026-08-18. Mirrors the case-level capability model in
-- src/lib/rbac.ts (see the "Permission model" section of the
-- architecture doc) at the database layer.
--
-- IMPORTANT CONTEXT: the running app connects to Postgres via Drizzle
-- using DATABASE_URL, which authenticates as a privileged role that
-- BYPASSES RLS entirely — all real authorization today happens in
-- TypeScript (requireUser() + lib/rbac.ts). These policies do not
-- change the app's behavior. They exist as defense-in-depth for real
-- client data, and as the foundation for querying Supabase directly
-- from the browser in the future, should that ever happen.
--
-- Apply with: psql "$DATABASE_URL" -f supabase/rls-policies.sql
-- (or paste into the Supabase SQL Editor). Safe to re-run — every
-- statement is written to be idempotent (DROP ... IF EXISTS before
-- each CREATE, OR REPLACE on functions).
--
-- Verify with: npm run rls:verify (scripts/verify-rls.ts) — impersonates
-- several demo accounts via SQL session variables and checks that each
-- one can only see what lib/rbac.ts says they should be able to see.

begin;

-- =========================================================================
-- Helper functions
-- =========================================================================
-- All SECURITY DEFINER with a fixed search_path: policies on one table
-- often need to read other tables (participants, participant_assignments,
-- users) to decide access — if those tables also have RLS enabled (they
-- do), a helper function needs to bypass that or policy evaluation would
-- recurse into itself. SECURITY DEFINER + fixed search_path is the
-- standard, safe pattern for this in Postgres/Supabase.

-- The current request's app-level users.id, resolved from the Supabase
-- Auth user (auth.uid()) via users.auth_user_id. Null if not signed in,
-- or signed in but with no linked app-level profile row.
create or replace function app_user_id()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select id from users where auth_user_id = auth.uid()::text
$$;

create or replace function app_org_id()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select org_id from users where id = app_user_id()
$$;

create or replace function app_role()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role from users where id = app_user_id()
$$;

-- org_admin and a global "practitioner" have org-wide access without a
-- participant_assignments row — see lib/rbac.ts's isFullAccessRole().
create or replace function is_full_access()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(app_role() in ('org_admin', 'practitioner'), false)
$$;

create or replace function is_org_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(app_role() = 'org_admin', false)
$$;

-- Does the current user hold a specific case-level capability
-- (practitioner | implementer | caregiver | learner) on this participant?
-- Mirrors hasCaseCapability() in lib/rbac.ts.
create or replace function has_capability(p_participant_id text, p_capability text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from participant_assignments
    where participant_id = p_participant_id
      and user_id = app_user_id()
      and role_on_case = p_capability
  )
$$;

create or replace function has_any_capability(p_participant_id text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from participant_assignments
    where participant_id = p_participant_id
      and user_id = app_user_id()
  )
$$;

-- General read access to a participant's data — mirrors
-- userCanAccessParticipant() in lib/rbac.ts. Always re-checks the
-- participant's org against the caller's org, even for full-access
-- roles, so a full-access user in one org can never see another org's
-- data even if a capability row were ever misassigned.
create or replace function can_access_participant(p_participant_id text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from participants p
    where p.id = p_participant_id
      and p.org_id = app_org_id()
      and (is_full_access() or has_any_capability(p_participant_id))
  )
$$;

-- Can design/edit programs, targets, prompt hierarchies, confirm mastery,
-- score fidelity for this participant — mirrors canManagePrograms() /
-- canScoreFidelity() / canConfirmMastery() (all identical) in lib/rbac.ts.
create or replace function can_manage_programs(p_participant_id text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from participants p
    where p.id = p_participant_id
      and p.org_id = app_org_id()
      and (is_full_access() or has_capability(p_participant_id, 'practitioner'))
  )
$$;

-- Can run sessions / record trial data for this participant — mirrors
-- canRunSessions() in lib/rbac.ts.
create or replace function can_run_sessions(p_participant_id text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from participants p
    where p.id = p_participant_id
      and p.org_id = app_org_id()
      and (
        is_full_access()
        or has_capability(p_participant_id, 'practitioner')
        or has_capability(p_participant_id, 'implementer')
      )
  )
$$;

-- Resolver functions: several tables reach a participant only through a
-- chain of foreign keys (target -> program -> participant, etc). Keeping
-- these as functions avoids repeating multi-hop subqueries in every policy.

create or replace function participant_id_of_program(p_program_id text)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select participant_id from programs where id = p_program_id
$$;

create or replace function participant_id_of_target(p_target_id text)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select participant_id_of_program(program_id) from targets where id = p_target_id
$$;

create or replace function participant_id_of_fidelity_protocol(p_protocol_id text)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select participant_id_of_program(program_id) from fidelity_protocols where id = p_protocol_id
$$;

create or replace function participant_id_of_maintenance_plan(p_plan_id text)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select participant_id_of_program(program_id) from maintenance_plans where id = p_plan_id
$$;

-- =========================================================================
-- Enable RLS everywhere (idempotent — no-op if already enabled)
-- =========================================================================

alter table organizations enable row level security;
alter table users enable row level security;
alter table participants enable row level security;
alter table participant_assignments enable row level security;
alter table domains enable row level security;
alter table goals enable row level security;
alter table programs enable row level security;
alter table program_steps enable row level security;
alter table targets enable row level security;
alter table prompt_hierarchies enable row level security;
alter table mastery_rules enable row level security;
alter table generalization_dimensions enable row level security;
alter table generalization_probes enable row level security;
alter table maintenance_plans enable row level security;
alter table maintenance_checks enable row level security;
alter table sessions enable row level security;
alter table trial_data enable row level security;
alter table fidelity_protocols enable row level security;
alter table fidelity_items enable row level security;
alter table fidelity_observations enable row level security;
alter table assignments enable row level security;
alter table practice_logs enable row level security;
alter table self_monitoring_entries enable row level security;
alter table contextual_tags enable row level security;
alter table program_changes enable row level security;
alter table templates enable row level security;
alter table ai_drafts enable row level security;
alter table audit_logs enable row level security;

-- authenticated needs base table-level privileges before RLS's row-level
-- filtering has anything to filter; anon gets nothing (every table is
-- effectively private until signed in, matching the app's own gate).
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke all on all tables in schema public from anon;

-- =========================================================================
-- organizations — just the caller's own org row
-- =========================================================================

drop policy if exists organizations_select on organizations;
create policy organizations_select on organizations for select to authenticated
  using (id = app_org_id());

-- No insert/update/delete policy — org creation/management isn't a
-- user-facing feature today; default deny is correct.

-- =========================================================================
-- users — team directory, readable org-wide (many views join to it for
-- names), writable only by org_admin (matches the Invite Someone gate).
-- =========================================================================

drop policy if exists users_select on users;
create policy users_select on users for select to authenticated
  using (org_id = app_org_id());

drop policy if exists users_insert on users;
create policy users_insert on users for insert to authenticated
  with check (org_id = app_org_id() and is_org_admin());

drop policy if exists users_update on users;
create policy users_update on users for update to authenticated
  using (org_id = app_org_id() and is_org_admin())
  with check (org_id = app_org_id() and is_org_admin());

-- No delete policy — the app has no delete-user feature; default deny.

-- =========================================================================
-- participants
-- =========================================================================

drop policy if exists participants_select on participants;
create policy participants_select on participants for select to authenticated
  using (org_id = app_org_id() and (is_full_access() or has_any_capability(id)));

drop policy if exists participants_insert on participants;
create policy participants_insert on participants for insert to authenticated
  with check (org_id = app_org_id() and is_full_access());

drop policy if exists participants_update on participants;
create policy participants_update on participants for update to authenticated
  using (org_id = app_org_id() and can_manage_programs(id))
  with check (org_id = app_org_id() and can_manage_programs(id));

-- =========================================================================
-- participant_assignments — who's on a case. Readable by full access,
-- the assignee themselves, or anyone else already on that case (a shared
-- team roster). Writable by whoever can manage that case's programs.
-- =========================================================================

drop policy if exists participant_assignments_select on participant_assignments;
create policy participant_assignments_select on participant_assignments for select to authenticated
  using (
    is_full_access()
    or user_id = app_user_id()
    or has_any_capability(participant_id)
  );

drop policy if exists participant_assignments_insert on participant_assignments;
create policy participant_assignments_insert on participant_assignments for insert to authenticated
  with check (can_manage_programs(participant_id));

drop policy if exists participant_assignments_update on participant_assignments;
create policy participant_assignments_update on participant_assignments for update to authenticated
  using (can_manage_programs(participant_id))
  with check (can_manage_programs(participant_id));

drop policy if exists participant_assignments_delete on participant_assignments;
create policy participant_assignments_delete on participant_assignments for delete to authenticated
  using (can_manage_programs(participant_id));

-- =========================================================================
-- domains / goals — participant-scoped, managed by canManagePrograms
-- =========================================================================

drop policy if exists domains_select on domains;
create policy domains_select on domains for select to authenticated
  using (can_access_participant(participant_id));

drop policy if exists domains_write on domains;
create policy domains_write on domains for all to authenticated
  using (can_manage_programs(participant_id))
  with check (can_manage_programs(participant_id));

drop policy if exists goals_select on goals;
create policy goals_select on goals for select to authenticated
  using (can_access_participant(participant_id));

drop policy if exists goals_write on goals;
create policy goals_write on goals for all to authenticated
  using (can_manage_programs(participant_id))
  with check (can_manage_programs(participant_id));

-- =========================================================================
-- programs / program_steps / targets — participant-scoped, managed by
-- canManagePrograms
-- =========================================================================

drop policy if exists programs_select on programs;
create policy programs_select on programs for select to authenticated
  using (can_access_participant(participant_id));

drop policy if exists programs_write on programs;
create policy programs_write on programs for all to authenticated
  using (can_manage_programs(participant_id))
  with check (can_manage_programs(participant_id));

drop policy if exists program_steps_select on program_steps;
create policy program_steps_select on program_steps for select to authenticated
  using (can_access_participant(participant_id_of_program(program_id)));

drop policy if exists program_steps_write on program_steps;
create policy program_steps_write on program_steps for all to authenticated
  using (can_manage_programs(participant_id_of_program(program_id)))
  with check (can_manage_programs(participant_id_of_program(program_id)));

drop policy if exists targets_select on targets;
create policy targets_select on targets for select to authenticated
  using (can_access_participant(participant_id_of_program(program_id)));

drop policy if exists targets_write on targets;
create policy targets_write on targets for all to authenticated
  using (can_manage_programs(participant_id_of_program(program_id)))
  with check (can_manage_programs(participant_id_of_program(program_id)));

-- =========================================================================
-- prompt_hierarchies — org-wide template resource, not participant-scoped
-- =========================================================================

drop policy if exists prompt_hierarchies_select on prompt_hierarchies;
create policy prompt_hierarchies_select on prompt_hierarchies for select to authenticated
  using (org_id = app_org_id());

drop policy if exists prompt_hierarchies_write on prompt_hierarchies;
create policy prompt_hierarchies_write on prompt_hierarchies for all to authenticated
  using (org_id = app_org_id() and is_full_access())
  with check (org_id = app_org_id() and is_full_access());

-- =========================================================================
-- mastery_rules — linked via target_id OR program_id (either may be null)
-- =========================================================================

drop policy if exists mastery_rules_select on mastery_rules;
create policy mastery_rules_select on mastery_rules for select to authenticated
  using (
    can_access_participant(
      coalesce(participant_id_of_target(target_id), participant_id_of_program(program_id))
    )
  );

drop policy if exists mastery_rules_write on mastery_rules;
create policy mastery_rules_write on mastery_rules for all to authenticated
  using (
    can_manage_programs(
      coalesce(participant_id_of_target(target_id), participant_id_of_program(program_id))
    )
  )
  with check (
    can_manage_programs(
      coalesce(participant_id_of_target(target_id), participant_id_of_program(program_id))
    )
  );

-- =========================================================================
-- generalization_dimensions / generalization_probes
-- =========================================================================

drop policy if exists generalization_dimensions_select on generalization_dimensions;
create policy generalization_dimensions_select on generalization_dimensions for select to authenticated
  using (can_access_participant(participant_id_of_program(program_id)));

drop policy if exists generalization_dimensions_write on generalization_dimensions;
create policy generalization_dimensions_write on generalization_dimensions for all to authenticated
  using (can_manage_programs(participant_id_of_program(program_id)))
  with check (can_manage_programs(participant_id_of_program(program_id)));

drop policy if exists generalization_probes_select on generalization_probes;
create policy generalization_probes_select on generalization_probes for select to authenticated
  using (can_access_participant(participant_id_of_program(program_id)));

drop policy if exists generalization_probes_insert on generalization_probes;
create policy generalization_probes_insert on generalization_probes for insert to authenticated
  with check (can_run_sessions(participant_id_of_program(program_id)));

drop policy if exists generalization_probes_update on generalization_probes;
create policy generalization_probes_update on generalization_probes for update to authenticated
  using (can_manage_programs(participant_id_of_program(program_id)))
  with check (can_manage_programs(participant_id_of_program(program_id)));

drop policy if exists generalization_probes_delete on generalization_probes;
create policy generalization_probes_delete on generalization_probes for delete to authenticated
  using (can_manage_programs(participant_id_of_program(program_id)));

-- =========================================================================
-- maintenance_plans / maintenance_checks
-- =========================================================================

drop policy if exists maintenance_plans_select on maintenance_plans;
create policy maintenance_plans_select on maintenance_plans for select to authenticated
  using (can_access_participant(participant_id_of_program(program_id)));

drop policy if exists maintenance_plans_write on maintenance_plans;
create policy maintenance_plans_write on maintenance_plans for all to authenticated
  using (can_manage_programs(participant_id_of_program(program_id)))
  with check (can_manage_programs(participant_id_of_program(program_id)));

drop policy if exists maintenance_checks_select on maintenance_checks;
create policy maintenance_checks_select on maintenance_checks for select to authenticated
  using (can_access_participant(participant_id_of_maintenance_plan(maintenance_plan_id)));

drop policy if exists maintenance_checks_insert on maintenance_checks;
create policy maintenance_checks_insert on maintenance_checks for insert to authenticated
  with check (can_run_sessions(participant_id_of_maintenance_plan(maintenance_plan_id)));

drop policy if exists maintenance_checks_update on maintenance_checks;
create policy maintenance_checks_update on maintenance_checks for update to authenticated
  using (can_manage_programs(participant_id_of_maintenance_plan(maintenance_plan_id)))
  with check (can_manage_programs(participant_id_of_maintenance_plan(maintenance_plan_id)));

drop policy if exists maintenance_checks_delete on maintenance_checks;
create policy maintenance_checks_delete on maintenance_checks for delete to authenticated
  using (can_manage_programs(participant_id_of_maintenance_plan(maintenance_plan_id)));

-- =========================================================================
-- sessions / trial_data — canRunSessions to record, any capability to view
-- =========================================================================

drop policy if exists sessions_select on sessions;
create policy sessions_select on sessions for select to authenticated
  using (can_access_participant(participant_id));

drop policy if exists sessions_insert on sessions;
create policy sessions_insert on sessions for insert to authenticated
  with check (can_run_sessions(participant_id));

drop policy if exists sessions_update on sessions;
create policy sessions_update on sessions for update to authenticated
  using (can_run_sessions(participant_id))
  with check (can_run_sessions(participant_id));

drop policy if exists sessions_delete on sessions;
create policy sessions_delete on sessions for delete to authenticated
  using (can_manage_programs(participant_id));

drop policy if exists trial_data_select on trial_data;
create policy trial_data_select on trial_data for select to authenticated
  using (can_access_participant(participant_id_of_target(target_id)));

drop policy if exists trial_data_insert on trial_data;
create policy trial_data_insert on trial_data for insert to authenticated
  with check (can_run_sessions(participant_id_of_target(target_id)));

-- Trial data carries its own edit-history trail (edited_from_id /
-- edit_reason) rather than being mutated in place — no update policy;
-- corrections should insert a new row referencing the old one, matching
-- the "never silently overwrite" comment already in schema.ts.
drop policy if exists trial_data_delete on trial_data;
create policy trial_data_delete on trial_data for delete to authenticated
  using (can_manage_programs(participant_id_of_target(target_id)));

-- =========================================================================
-- fidelity_protocols / fidelity_items / fidelity_observations
-- =========================================================================

drop policy if exists fidelity_protocols_select on fidelity_protocols;
create policy fidelity_protocols_select on fidelity_protocols for select to authenticated
  using (can_access_participant(participant_id_of_program(program_id)));

drop policy if exists fidelity_protocols_write on fidelity_protocols;
create policy fidelity_protocols_write on fidelity_protocols for all to authenticated
  using (can_manage_programs(participant_id_of_program(program_id)))
  with check (can_manage_programs(participant_id_of_program(program_id)));

drop policy if exists fidelity_items_select on fidelity_items;
create policy fidelity_items_select on fidelity_items for select to authenticated
  using (can_access_participant(participant_id_of_fidelity_protocol(protocol_id)));

drop policy if exists fidelity_items_write on fidelity_items;
create policy fidelity_items_write on fidelity_items for all to authenticated
  using (can_manage_programs(participant_id_of_fidelity_protocol(protocol_id)))
  with check (can_manage_programs(participant_id_of_fidelity_protocol(protocol_id)));

-- fidelity_observations carries participant_id directly.
drop policy if exists fidelity_observations_select on fidelity_observations;
create policy fidelity_observations_select on fidelity_observations for select to authenticated
  using (can_access_participant(participant_id));

drop policy if exists fidelity_observations_insert on fidelity_observations;
create policy fidelity_observations_insert on fidelity_observations for insert to authenticated
  with check (can_manage_programs(participant_id)); -- scoring fidelity = canScoreFidelity = canManagePrograms

drop policy if exists fidelity_observations_update on fidelity_observations;
create policy fidelity_observations_update on fidelity_observations for update to authenticated
  using (can_manage_programs(participant_id))
  with check (can_manage_programs(participant_id));

drop policy if exists fidelity_observations_delete on fidelity_observations;
create policy fidelity_observations_delete on fidelity_observations for delete to authenticated
  using (can_manage_programs(participant_id));

-- =========================================================================
-- assignments / practice_logs / self_monitoring_entries — Practice Mode.
-- Any capability holder can log practice for "their" participant;
-- assigning practice itself needs canRunSessions (matches who's allowed
-- to assign: practitioner/implementer/full-access).
-- =========================================================================

drop policy if exists assignments_select on assignments;
create policy assignments_select on assignments for select to authenticated
  using (can_access_participant(participant_id) or assigned_to_user_id = app_user_id());

drop policy if exists assignments_insert on assignments;
create policy assignments_insert on assignments for insert to authenticated
  with check (can_run_sessions(participant_id));

drop policy if exists assignments_update on assignments;
create policy assignments_update on assignments for update to authenticated
  using (can_run_sessions(participant_id) or assigned_to_user_id = app_user_id())
  with check (can_run_sessions(participant_id) or assigned_to_user_id = app_user_id());

drop policy if exists assignments_delete on assignments;
create policy assignments_delete on assignments for delete to authenticated
  using (can_run_sessions(participant_id));

drop policy if exists practice_logs_select on practice_logs;
create policy practice_logs_select on practice_logs for select to authenticated
  using (can_access_participant(participant_id));

drop policy if exists practice_logs_insert on practice_logs;
create policy practice_logs_insert on practice_logs for insert to authenticated
  with check (has_any_capability(participant_id) or is_full_access());

drop policy if exists practice_logs_update on practice_logs;
create policy practice_logs_update on practice_logs for update to authenticated
  using (logged_by_user_id = app_user_id() or can_manage_programs(participant_id))
  with check (logged_by_user_id = app_user_id() or can_manage_programs(participant_id));

drop policy if exists practice_logs_delete on practice_logs;
create policy practice_logs_delete on practice_logs for delete to authenticated
  using (can_manage_programs(participant_id));

drop policy if exists self_monitoring_entries_select on self_monitoring_entries;
create policy self_monitoring_entries_select on self_monitoring_entries for select to authenticated
  using (can_access_participant(participant_id));

drop policy if exists self_monitoring_entries_insert on self_monitoring_entries;
create policy self_monitoring_entries_insert on self_monitoring_entries for insert to authenticated
  with check (has_any_capability(participant_id) or is_full_access());

drop policy if exists self_monitoring_entries_update on self_monitoring_entries;
create policy self_monitoring_entries_update on self_monitoring_entries for update to authenticated
  using (has_any_capability(participant_id) or is_full_access())
  with check (has_any_capability(participant_id) or is_full_access());

drop policy if exists self_monitoring_entries_delete on self_monitoring_entries;
create policy self_monitoring_entries_delete on self_monitoring_entries for delete to authenticated
  using (can_manage_programs(participant_id));

-- =========================================================================
-- contextual_tags — canonical org-wide tag list
-- =========================================================================

drop policy if exists contextual_tags_select on contextual_tags;
create policy contextual_tags_select on contextual_tags for select to authenticated
  using (org_id = app_org_id());

drop policy if exists contextual_tags_write on contextual_tags;
create policy contextual_tags_write on contextual_tags for all to authenticated
  using (org_id = app_org_id() and is_full_access())
  with check (org_id = app_org_id() and is_full_access());

-- =========================================================================
-- program_changes — Professional Decision Log. Practitioner-level
-- clinical reasoning, kept separate from caregiver-facing summaries per
-- the product's own design (see programs.caregiver_summary /
-- coach_summary) — so both read and write require canManagePrograms,
-- not just canAccessParticipant.
-- =========================================================================

drop policy if exists program_changes_select on program_changes;
create policy program_changes_select on program_changes for select to authenticated
  using (can_manage_programs(participant_id_of_program(program_id)));

drop policy if exists program_changes_write on program_changes;
create policy program_changes_write on program_changes for all to authenticated
  using (can_manage_programs(participant_id_of_program(program_id)))
  with check (can_manage_programs(participant_id_of_program(program_id)));

-- =========================================================================
-- templates — Program Library, org-wide with an isOrgWide flag
-- =========================================================================

drop policy if exists templates_select on templates;
create policy templates_select on templates for select to authenticated
  using (
    org_id = app_org_id()
    and (is_org_wide or created_by_user_id = app_user_id() or is_full_access())
  );

drop policy if exists templates_write on templates;
create policy templates_write on templates for all to authenticated
  using (org_id = app_org_id() and is_full_access())
  with check (org_id = app_org_id() and is_full_access());

-- =========================================================================
-- ai_drafts — optional per-program AI content (schema ready, no LLM
-- wired in yet per the build summary — policies written for when it is)
-- =========================================================================

drop policy if exists ai_drafts_select on ai_drafts;
create policy ai_drafts_select on ai_drafts for select to authenticated
  using (
    org_id = app_org_id()
    and (
      is_full_access()
      or created_by_user_id = app_user_id()
      or (program_id is not null and can_access_participant(participant_id_of_program(program_id)))
    )
  );

drop policy if exists ai_drafts_insert on ai_drafts;
create policy ai_drafts_insert on ai_drafts for insert to authenticated
  with check (
    org_id = app_org_id()
    and created_by_user_id = app_user_id()
    and (program_id is null or can_manage_programs(participant_id_of_program(program_id)))
  );

drop policy if exists ai_drafts_update on ai_drafts;
create policy ai_drafts_update on ai_drafts for update to authenticated
  using (
    org_id = app_org_id()
    and (is_full_access() or (program_id is not null and can_manage_programs(participant_id_of_program(program_id))))
  )
  with check (
    org_id = app_org_id()
    and (is_full_access() or (program_id is not null and can_manage_programs(participant_id_of_program(program_id))))
  );

-- No delete policy — treated like an audit trail; default deny.

-- =========================================================================
-- audit_logs — org_admin-only read (matches the Organization page gate),
-- any org member can insert their own entries (matches logAudit() being
-- called from many action functions across roles). Immutable: no
-- update/delete policy.
-- =========================================================================

drop policy if exists audit_logs_select on audit_logs;
create policy audit_logs_select on audit_logs for select to authenticated
  using (org_id = app_org_id() and is_org_admin());

drop policy if exists audit_logs_insert on audit_logs;
create policy audit_logs_insert on audit_logs for insert to authenticated
  with check (org_id = app_org_id() and (user_id = app_user_id() or user_id is null));

commit;
