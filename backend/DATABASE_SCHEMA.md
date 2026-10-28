# Civic Pulse database schema

MongoDB collections use Mongoose timestamps (`createdAt`, `updatedAt`). All identifiers are ObjectIds.

## User

`name` (required, trimmed, 2–100 characters), normalized unique `email`, `passwordHash` (`select:false`), `role` (`citizen`, `case_worker`, `manager`, `admin`), `active`, optional `department`, and Mongoose timestamps. The unique email index supports duplicate-account rejection. `{role, active}` supports the eligible-worker picker and role administration. Public registration fixes role to citizen; privileged accounts are introduced by the local seed script or the protected admin account API.

## Grievance

`reference` (required, unique public tracking code); `citizen` required User reference; title (5–120), description (20–4000), category enum, location (2–200), priority (`Low`, `Medium`, `High`, `Urgent`), status (`Submitted`, `Acknowledged`, `In Progress`, `Awaiting Information`, `Resolved`, `Closed`), optional `assignee`, `submittedAt`, required `slaDeadline`, `resolutionNote`, `resolvedAt`, `closedAt`, timestamps, and escalation level/reason/trigger/state.

Indexes: unique reference; `{citizen, createdAt}` and `{assignee, createdAt}` for scoped, newest-first lists; `{status, slaDeadline}` for escalation scans; `{citizen, status, slaDeadline}` and `{assignee, status, slaDeadline}` for dashboard counts; and `{category, status}` for operational analysis.

`history` is an embedded append-only event list with `previousStatus`, new `status`, actor User reference, timestamp, and optional note. `assignmentHistory` records prior and new assignee, actor User reference, timestamp, and optional reason. Keeping these audit events embedded makes each case update atomic with its current state. Escalation is an embedded one-time case state (`none`, `open`, `acknowledged`) with level, reason and trigger time.

## SLA behavior

`SLA_HOURS` configures the deadline from submission (default 72). Reassignment never changes it. A one-minute process checks nonterminal cases by `{status, slaDeadline}` and opens a level-one escalation once. Completed cases aren't escalated. Status and assignment audit events are stored with the grievance for atomic updates.

## Authorization scope

Citizen list/detail/count queries are constrained to the authenticated citizen. Case worker list/detail/count queries are constrained to their assignments. Managers and admins can view all cases and assign. Only managers/admins can retrieve eligible workers; account directory/create/deactivate operations are admin-only.
