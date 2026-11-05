---
name: frontend-development
description: >-
  React + Vite + Tailwind frontend conventions for the Carpooling Platform.
  Use when building or editing UI — pages, components, hooks, the api/ client
  layer, forms, auth context, responsive layouts, or accessibility. Enforces
  the approved folder structure and CLAUDE.md §5.
---

# Frontend Development

Follow `plan.md` §5 and `CLAUDE.md` §5. Do not implement features beyond the current task's scope.

## React development
- Functional components with hooks only; no class components.
- One component per file; keep components small and single-purpose.
- Presentational components stay dumb; data-fetching and logic live in hooks (`hooks/`).
- Co-locate nothing business-critical in components that belongs in a hook or the api layer.

## Component architecture
- Respect the structure: `api/`, `context/`, `hooks/`, `components/`, `pages/`, `routes/`.
- `pages/` compose `components/`; shared UI (RideCard, BookingBadge, SeatSelector, Navbar, FormField) lives in `components/`.
- Guard authenticated pages with `routes/ProtectedRoute.jsx`.
- Lift shared state to context or hooks; avoid prop-drilling more than ~2 levels.

## Tailwind CSS
- Styling is Tailwind utility classes only. No inline style objects for layout, no ad-hoc CSS files.
- Keep class lists readable; extract repeated patterns into a reusable component, not a custom CSS class.
- Use the configured `content` globs; rely on Tailwind's design tokens for spacing/color consistency.

## React hooks
- Encapsulate API + state per resource: `useAuth`, `useRides`, `useBookings`.
- Respect rules of hooks (top-level, no conditional calls).
- Handle loading, error, and empty states explicitly in every data hook.
- Clean up effects (abort in-flight requests on unmount where relevant).

## Form validation
- Validate on the client for UX (required fields, future dates, seats ≥ 1, price ≥ 0) — but treat the server as the source of truth.
- Surface field-level errors near inputs; disable submit while pending.
- Mirror the backend's validation rules so the UX matches server rejections.

## API integration
- All HTTP goes through the `api/` client layer — components and pages never call `fetch`/`axios` directly.
- The client attaches the JWT Bearer token and base URL from `VITE_API_URL`.
- Map the documented error shape `{ error: { code, message } }` to user-friendly messages.
- Handle `401` by clearing auth state and redirecting to login.

## Responsive UI
- Mobile-first; use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`).
- Ensure search, ride cards, and dashboards reflow cleanly on small screens.
- Avoid fixed widths; prefer flex/grid with `max-w-*` and relative units.

## Accessibility
- Semantic HTML (buttons are `<button>`, labels tied to inputs via `htmlFor`/`id`).
- Keyboard navigable; visible focus states; sufficient color contrast.
- `alt` text on images; `aria-*` only where semantics are insufficient.
- Announce async state changes (e.g., booking submitted) accessibly.

## Reuse checklist
Before adding UI: is there an existing component/hook to extend? Does the api layer already expose this call? After the task: report changed files and any manual/responsive checks performed.
