<!--
  Name: Aquino, Edrel P.
  Date: November 18, 2026
  Assignment: CSAPPD1 Final Project - LibroTrack
-->

# Decision: Angular workspace lives at the repo root

- Date: November 18, 2026
- Context: Sprint 2 (Core CRUD UI) on `refactor/match-gym-leader-registry`, commits `0153623` through `aaa7f66` plus the save-feedback fix.

## Decision

Assignment prompts reference `frontend/src/app/...`, but this repository has no
`frontend/` wrapper. The Angular v22 application is rooted at the repository top
level: `src/`, `angular.json`, and `package.json` sit beside the Express API in
`backend/`. Map prompt paths as `frontend/src/...` to `src/...`.

Component layout for future sprints:

- Pages: `src/app/pages/<name>/<name>.ts` with bare class names (`BookList`,
  `BookDetail`, `BookForm`) and `app-` prefixed selectors.
- Shared reusable UI: `src/app/components/` (see `confirm-dialog` for the
  destructive-action confirmation pattern).
- Data access: `src/app/services/book.service.ts` only; models in
  `src/app/models/book.model.ts`.
- Routes: `src/app/app.routes.ts`. `pages/home` and `pages/not-found` are live
  routes (default redirect and the `**` wildcard), not placeholders.

## Rationale

Later sprints can skip searching for a nonexistent `frontend/` directory, and
new components stay consistent with the team's established layout.

## Addendum: transient success feedback

Create, update, and delete confirmations are passed via router navigation state
(`router.navigate(['/books'], { state: { feedback } })`) and rendered as a
dismissible banner on the catalog page. Read it with
`router.getCurrentNavigation()` in the receiving component's constructor so a
page refresh does not replay the banner.
