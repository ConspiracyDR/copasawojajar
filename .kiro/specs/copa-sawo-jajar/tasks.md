# Implementation Plan: Copa Sawo Jajar

## Overview

This plan implements a client-side PWA for managing a local football tournament using Next.js 14 (App Router), TypeScript, and TailwindCSS. Tasks are structured to build foundational layers first (types, data, utilities), then state management, then UI components, and finally PWA integration. Each task builds incrementally on previous ones.

## Tasks

- [x] 1. Set up project structure and core types
  - [x] 1.1 Initialize Next.js 14 project with TypeScript and TailwindCSS
    - Run `npx create-next-app@14` with App Router, TypeScript, TailwindCSS, and ESLint enabled
    - Install dev dependencies: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `fast-check`, `jsdom`
    - Install production dependencies: `next-pwa`
    - Configure `vitest.config.ts` with jsdom environment and path aliases
    - Configure `tsconfig.json` path aliases (`@/` → `src/`)
    - _Requirements: 10.1, 10.2, 12.1_

  - [x] 1.2 Define TypeScript interfaces and type guards
    - Create `src/types/tournament.ts` with all interfaces: `Team`, `Match`, `Scorer`, `StandingRow`, `MatchFormData`, `TournamentState`, `Group`, `MatchStatus`, `TabId`
    - Implement `isValidTournamentState()` type guard that validates schema version, team array structure, and match array structure
    - Include `SubmitResult` and `ImportResult` union types
    - _Requirements: 7.3, 7.5, 11.1_

  - [x] 1.3 Create pre-configured teams and match generation
    - Create `src/data/teams.ts` with 8 teams (4 per group) and `generateMatchSlots()` function
    - Implement round-robin pairing: each team paired with every other team in same group exactly once (6 matches per group, 12 total)
    - Assign sequential `matchOrder` values 1-12
    - Export `TEAMS` constant and `generateMatchSlots` function
    - _Requirements: 11.1, 11.2, 11.3_

- [x] 2. Implement utility functions
  - [x] 2.1 Implement storage utility
    - Create `src/utils/storage.ts` with `StorageUtil` object containing: `save(state)`, `load(): TournamentState | null`, `exportToFile(state)`, `importFromFile(file): Promise<ImportResult>`
    - Use localStorage key `"copa-sawo-jajar-data"` and schema version `1`
    - `save`: serialize state to JSON, catch quota exceeded errors, return success/failure
    - `load`: parse JSON, validate with `isValidTournamentState`, return null if invalid
    - `exportToFile`: generate JSON Blob with timestamp filename, trigger download via anchor element
    - `importFromFile`: read File, parse JSON, validate schema, return ImportResult
    - Handle corrupted data by returning null (caller initializes defaults)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.4, 8.6_

  - [x] 2.2 Implement standings calculation
    - Create `src/utils/calculations.ts` with `calculateStandings(matches, teams, group): StandingRow[]`
    - Filter only matches with status "selesai" in the specified group
    - Compute M, W, D, L, GF, GA, GD, Points for each team
    - Sort by Points DESC → GD DESC → GF DESC → team name ASC (alphabetical tiebreaker)
    - Assign rank numbers 1-4
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 3.7_

  - [x] 2.3 Implement form validation helpers
    - Create `src/utils/validation.ts` with functions: `validateScore(value)`, `validateSameTeam(homeId, awayId)`, `validateDuplicateMatch(matches, group, homeId, awayId, excludeMatchId?)`, `validateScorer(scorer)`, `validatePlayerName(name)`
    - Score validation: integer 0-99 inclusive
    - Same team validation: homeId !== awayId
    - Duplicate match: check existing matches for same pairing in either order within same group
    - Scorer validation: name 1-50 chars non-whitespace-only, teamId matches one of match teams, count 1-20, minute null or 1-200
    - _Requirements: 1.4, 1.5, 1.8, 2.1, 2.6_

  - [ ]* 2.4 Write property tests for validation (Properties 2, 3, 4, 5)
    - **Property 2: Same-Team Validation** — For any team, selecting it as both home and away SHALL produce a validation error
    - **Property 3: Score Range Validation** — For any integer 0-99, validation accepts; for any other value, validation rejects
    - **Property 4: Duplicate Match Pairing Detection** — For any existing match set and new pairing that duplicates (in either order), submission SHALL be rejected
    - **Property 5: Scorer Field Validation** — For any scorer entry, acceptance iff name 1-50 non-whitespace-only, team is match team, count 1-20, minute null or 1-200
    - Create `src/__tests__/validation.property.ts`
    - **Validates: Requirements 1.4, 1.5, 1.8, 2.1, 2.6**

  - [ ]* 2.5 Write property tests for standings calculation (Property 7)
    - **Property 7: Standings Computation Correctness** — For any set of "selesai" matches: Played equals completed matches involving team, Points = 3W+D, GD = GF-GA, W+D+L = Played, correct sort order
    - Create `src/__tests__/calculations.property.ts`
    - **Validates: Requirements 3.2, 3.3, 3.4**

  - [ ]* 2.6 Write property tests for storage (Properties 12, 13, 14, 17)
    - **Property 12: Invalid Storage Data Recovery** — For any invalid JSON or non-conforming data, Storage_Manager discards it and returns default state
    - **Property 13: Export/Import Round-Trip** — For any valid tournament state, export then import produces equivalent state
    - **Property 14: Invalid Import File Rejection** — For any invalid file content, import fails and state remains unchanged
    - **Property 17: Initialization Idempotency** — For any valid existing state, initialization does not modify it
    - Create `src/__tests__/storage.property.ts`
    - **Validates: Requirements 7.3, 8.1, 8.4, 8.6, 11.4**

- [x] 3. Checkpoint - Ensure all utility tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement state management hook
  - [x] 4.1 Implement useTournament hook
    - Create `src/hooks/useTournament.ts` implementing `UseTournamentReturn` interface
    - On mount: call `StorageUtil.load()`; if null, initialize with `TEAMS` + `generateMatchSlots(TEAMS)` and persist
    - If valid data exists, use it without modification (idempotent init)
    - `submitMatch`: validate (same team, duplicate, score range), create match, save, return SubmitResult
    - `updateMatch`: validate, overwrite match, save, return SubmitResult
    - `deleteMatch`: reset match to upcoming/0-0/empty scorers, save
    - `getStandings(group)`: call `calculateStandings` with current matches/teams
    - `addScorer`/`removeScorer`: modify match scorers array (max 30 cap), save
    - `exportData`: call `StorageUtil.exportToFile`
    - `importData(file)`: call `StorageUtil.importFromFile`, replace state on success
    - `resetAll`: reset all matches to default (upcoming, scores 0, empty scorers), keep teams and match pairings
    - Expose `isLoaded` boolean for hydration guard
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.8, 2.2, 2.5, 3.1, 3.6, 5.4, 6.1, 6.2, 6.4, 6.5, 7.1, 7.2, 8.3, 8.4, 9.1, 9.3, 9.5, 11.4_

  - [ ]* 4.2 Write property tests for tournament operations (Properties 6, 10, 11, 15, 16)
    - **Property 6: Scorer List Integrity** — Adding scorer to N entries produces N+1; removing at index i produces N-1 with others unchanged
    - **Property 10: Unrestricted Status Transitions** — Any status to any status succeeds
    - **Property 11: Delete Resets Match to Default** — Deleting produces upcoming/0-0/empty scorers, preserving id/group/teams/order
    - **Property 15: Reset Preserves Structure But Clears Results** — After reset: 8 teams, 12 match slots, all upcoming/0-0/empty
    - **Property 16: Round-Robin Match Generation** — For N teams per group, generates N(N-1)/2 matches with each team paired with every other exactly once
    - Create `src/__tests__/tournament.property.ts`
    - **Validates: Requirements 2.3, 2.5, 5.4, 6.4, 9.3, 9.5, 11.2**

- [x] 5. Implement UI components
  - [x] 5.1 Create shared UI components
    - Create `src/components/ConfirmDialog.tsx`: modal overlay with title, message, confirm/cancel buttons; 44px min touch targets
    - Create `src/components/Toast.tsx`: auto-dismiss notification (3s default), success/error variants, positioned top-center
    - Create `src/components/OfflineIndicator.tsx`: uses `navigator.onLine` + online/offline events, shows banner when offline
    - All components styled with TailwindCSS, mobile-first responsive
    - _Requirements: 6.6, 1.7, 10.5, 12.5_

  - [x] 5.2 Create TabNavigation component
    - Create `src/components/TabNavigation.tsx` with 3 tabs: Klasemen, Jadwal, Input Match
    - Bottom-positioned on viewports < 768px, top-positioned on wider screens
    - Active tab visually highlighted, 44px minimum touch target
    - Accept `activeTab` and `onTabChange` props as per interface
    - _Requirements: 12.4, 12.5_

  - [x] 5.3 Implement ClassementTable component
    - Create `src/components/ClassementTable.tsx` accepting `group` and `standings` props
    - Render table with columns: Rank, Team Name, M, W, D, L, GF, GA, GD, Points
    - Horizontally scrollable container on viewports < 768px
    - Display zero stats when no completed matches exist
    - _Requirements: 3.5, 3.7, 12.2_

  - [x] 5.4 Implement Klasemen page component
    - Create `src/components/Klasemen.tsx` that renders two `ClassementTable` components (Group A and Group B)
    - Call `getStandings('A')` and `getStandings('B')` from useTournament hook
    - Group labels clearly visible
    - _Requirements: 3.5_

  - [x] 5.5 Implement MatchCard component
    - Create `src/components/MatchCard.tsx` accepting `match`, `teams`, `onEdit`, `onDelete` props
    - Display team names, status badge (Upcoming/Live/Selesai), and score
    - "Live" badge with pulsing dot/distinct color
    - "Upcoming" shows "vs" instead of score; "Live" and "Selesai" show score
    - Expandable on tap for completed matches to show scorer details
    - Edit and delete action buttons
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.7_

  - [x] 5.6 Implement Jadwal page component
    - Create `src/components/Jadwal.tsx` with group filter (All/Grup A/Grup B)
    - Display matches sorted by matchOrder
    - Filter matches by selected group; show all when no filter selected
    - Render each match using MatchCard
    - _Requirements: 4.1, 4.6, 4.8, 4.9_

  - [x] 5.7 Implement ScorerForm component
    - Create `src/components/ScorerForm.tsx` accepting `homeTeam`, `awayTeam`, `onAdd` props
    - Fields: player name (text, 16px min font), team select (home/away), goal count (number, default 1), minute (optional number)
    - Inline validation errors for empty/whitespace name, out-of-range values
    - Full-width inputs on mobile
    - _Requirements: 2.1, 2.6, 12.3, 12.6_

  - [x] 5.8 Implement MatchForm component
    - Create `src/components/MatchForm.tsx` accepting `teams`, `matches`, `editingMatch`, `onSubmit`, `onCancel` props
    - Fields: group select, home team dropdown (filtered by group), away team dropdown (filtered by group), home score, away score, status select
    - Inline validation: same team error, score range error, duplicate match error
    - Integrate ScorerForm for adding scorers (max 30), display scorer list with remove buttons
    - On submit: validate all fields, call onSubmit, reset form on success
    - On edit mode: pre-populate all fields from editingMatch
    - 16px font on inputs, 44px touch targets on buttons
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.6, 1.8, 2.1, 2.2, 5.1, 5.2, 6.1, 6.3, 12.3, 12.5, 12.6_

  - [ ]* 5.9 Write property tests for UI filtering (Properties 1, 8, 9)
    - **Property 1: Group Filter Shows Only Correct Teams** — For any group selection, filtered team list contains only and all teams with matching group field
    - **Property 8: Match Order Sort Invariant** — Matches in Jadwal appear in non-decreasing matchOrder
    - **Property 9: Match Group Filter Correctness** — Filtered matches contain exactly matches with matching group field
    - Create `src/__tests__/filtering.property.ts`
    - **Validates: Requirements 1.2, 4.6, 4.8**

- [x] 6. Checkpoint - Ensure all component tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Wire everything together and integrate
  - [x] 7.1 Implement main page with tab routing
    - Create `src/app/page.tsx` as client component ('use client')
    - Manage `activeTab` state and render TabNavigation + conditional view (Klasemen/Jadwal/MatchForm)
    - Wire useTournament hook: pass teams, matches, standings to child components
    - Handle edit flow: set `editingMatch` state when MatchCard triggers onEdit, pass to MatchForm
    - Handle delete flow: show ConfirmDialog, call deleteMatch on confirm
    - Show Toast on match submit/delete success
    - Show loading state while `isLoaded` is false
    - _Requirements: 1.3, 1.6, 1.7, 6.4, 6.5, 6.6, 6.7, 8.7_

  - [x] 7.2 Implement root layout and global styles
    - Update `src/app/layout.tsx` with metadata (title: "Copa Sawo Jajar"), PWA manifest link, viewport meta for mobile
    - Update `src/app/globals.css` with TailwindCSS base styles and any custom utilities
    - Set up font configuration (system fonts for performance)
    - _Requirements: 10.1, 12.1, 12.6_

  - [x] 7.3 Add data management UI (export, import, reset)
    - Add export button that calls `exportData()` from useTournament
    - Add import file input with confirmation dialog before importing
    - Add reset button with confirmation dialog warning about data loss
    - Place data management controls in a settings area or menu accessible from all tabs
    - After successful import: refresh all views
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 8. PWA configuration
  - [x] 8.1 Configure next-pwa and service worker
    - Update `next.config.js` with next-pwa wrapper: dest 'public', register true, skipWaiting true, disable in dev
    - Configure runtime caching strategy (NetworkFirst for general requests)
    - Create `public/manifest.json` with app name, icons (192x192, 512x512), theme color, display standalone, start_url
    - Add placeholder icon files in `public/icons/` directory
    - Verify service worker generates correctly on production build
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 9. Final checkpoint - Ensure all tests pass and app builds
  - Run `npm run build` to verify production build succeeds
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The design uses TypeScript throughout, so all implementations are in TypeScript
- PWA configuration is deferred to the end since the app works identically in development without it

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["2.1", "2.2", "2.3"] },
    { "id": 3, "tasks": ["2.4", "2.5", "2.6"] },
    { "id": 4, "tasks": ["4.1"] },
    { "id": 5, "tasks": ["4.2", "5.1", "5.2", "5.3"] },
    { "id": 6, "tasks": ["5.4", "5.5", "5.6", "5.7"] },
    { "id": 7, "tasks": ["5.8", "5.9"] },
    { "id": 8, "tasks": ["7.1", "7.2"] },
    { "id": 9, "tasks": ["7.3", "8.1"] }
  ]
}
```
