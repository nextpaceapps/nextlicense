# Student Practice Workflow (NextLicense)

This document defines the working process for internship students contributing to NextLicense.

## Goals

1. Help students learn real software delivery flow (SDLC) through production-like tasks.
2. Reduce mentor load with consistent task templates, CI checks, and structured PR reviews.

## Roles

- Mentor/Owner: prioritization, daily sync, final acceptance.
- Student: implementation, PR delivery, self-reflection.
- AI reviewer: structured feedback and score support.

## Workflow States

- Backlog
- Ready
- In Progress
- In Review
- Changes Requested
- Done
- Retro Note

## Definition of Ready (DoR)

A task can move to `Ready` only if it includes:

- Product context (why this matters for NextLicense)
- System area (API / Dashboard / Licensing Core)
- Clear implementation scope
- Acceptance criteria (testable)
- SDLC stage
- Complexity (S/M/L)

## Definition of Done (DoD)

A task is `Done` only if:

- PR is open and follows template
- CI passes
- Acceptance criteria are met
- Student reflection is provided
- Required review comments are resolved

## Branching Convention

`student/<name>/task-<id>-<slug>`

Examples:
- `student/alex/task-01-license-validation`
- `student/maria/task-04-products-table-filters`

## Pull Request Rules

- 1 PR = 1 task
- no direct pushes to `main`
- keep commits small and meaningful
- update task card status when opening PR

## Cadence

### Daily (10-15 min)

- Yesterday: what was done
- Today: what is planned
- Blockers: where mentor support is needed

### Monthly Retro

- What improved
- What was hard
- Which process step needs adjustment

## Project Fields (GitHub Project)

- Status
- Student
- Track Day
- Area
- Type
- Complexity
- Mentor Priority
- PR URL
- AI Score
- SDLC Stage

