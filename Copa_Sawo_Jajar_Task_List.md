# Copa Sawo Jajar PWA - Task List

**Estimated Total Effort:** 3-4 days full-time (or 1 week part-time)  
**Priority:** Must-have before tournament starts

---

## Phase 1: Setup & Architecture (2-3 hours)

### 1.1 Project Initialization
- [ ] Create Next.js 14 project: `npx create-next-app@latest copa-sawo-jajar --typescript --tailwind`
- [ ] Remove default boilerplate (pages, styles, etc)
- [ ] Setup folder structure:
  ```
  src/
  ├── app/ (Next.js app router)
  ├── components/
  │   ├── Klasemen.tsx
  │   ├── Jadwal.tsx
  │   ├── InputMatch.tsx
  │   ├── MatchCard.tsx
  │   └── ClassementTable.tsx
  ├── hooks/
  │   └── useTournament.ts (custom hook untuk state)
  ├── types/
  │   └── tournament.ts
  ├── utils/
  │   ├── storage.ts (localStorage wrapper)
  │   └── calculations.ts (klasemen logic)
  └── data/
      └── teams.ts (pre-configured teams)
  ```

### 1.2 Type Definitions
- [ ] Create `types/tournament.ts`:
  - `Team` interface
  - `Match` interface
  - `Scorer` interface
  - `Klasemen` (calculated row)

### 1.3 Pre-configured Data
- [ ] Create `data/teams.ts` dengan hardcoded 8 teams (4 per grup)
- [ ] Create initial matches list (12 match templates, empty score)

---

## Phase 2: Core State Management (3-4 hours)

### 2.1 Custom Hook: useTournament
- [ ] Create `hooks/useTournament.ts`
- [ ] Manage state:
  - `teams: Team[]`
  - `matches: Match[]`
- [ ] Functions:
  - `addMatch(match)` → update match result
  - `updateScore(matchId, scoreHome, scoreAway)`
  - `addScorer(matchId, teamId, scorer)`
  - `removeScorer(matchId, scorerId)`
  - `deleteMatch(matchId)` → reset to "upcoming"
  - `getClassement(grup)` → calculate & return sorted klasemen
  - `getAllMatches()` → return all matches

### 2.2 Storage Utility
- [ ] Create `utils/storage.ts`:
  - `saveMatches()` → JSON to localStorage
  - `loadMatches()` → from localStorage
  - `saveTournamentState()` → full state backup
  - `loadTournamentState()`
  - `exportAsJSON()` → download backup file
  - `importFromJSON(file)` → restore from backup

### 2.3 Calculation Logic
- [ ] Create `utils/calculations.ts`:
  - `calculatePoints(scoreHome, scoreAway)` → {pointsHome, pointsAway}
  - `calculateClassement(matches, teamList)` → sorted array
    - Sort by: Poin DESC → GoalDifference DESC → GoalFor DESC
  - `getTeamStats(teamId, matches)` → {M, W, D, L, GF, GA, GD, Poin}
  - `getTopScorers(matches)` → scorers ranked by goals

---

## Phase 3: UI Components (6-8 hours)

### 3.1 Layout & Navigation
- [ ] Create `app/layout.tsx`:
  - Header (logo, title)
  - Tab navigation (Klasemen | Jadwal | Input)
  - Mobile-friendly nav (hamburger for mobile)
  
- [ ] Create `app/page.tsx` (main dashboard):
  - Tab state management (`activeTab`)
  - Conditional render of 3 tabs

### 3.2 Klasemen Tab
- [ ] Create `components/Klasemen.tsx`:
  - 2 tabel (Grup A, Grup B) side-by-side on desktop, stacked on mobile
  - Columns: Rank | Team | M | W | D | L | GF | GA | GD | Poin
  - Responsive table (scroll on mobile if needed)

- [ ] Create `components/ClassementTable.tsx` (reusable):
  - Accept `klasemen` data + `grup` title
  - Render table rows
  - Highlight top 2 (qualified to semis, if applicable)

### 3.3 Jadwal Tab
- [ ] Create `components/Jadwal.tsx`:
  - Filter/sort options: By Grup or Chronological
  - List view of all 12 matches

- [ ] Create `components/MatchCard.tsx`:
  - Display: Tim A vs Tim B | Score | Status badge
  - Tap to expand → show all scorers
  - Responsive card layout

### 3.4 Input Match Tab
- [ ] Create `components/InputMatch.tsx`:
  - Form section 1: Pilih Grup (radio: A / B)
  - Form section 2: Pilih Team Home & Away (dropdowns)
  - Form section 3: Input Skor (2 number inputs)
  - Form section 4: Add Scorers
    - List of added scorers (name, goal count, minute)
    - "Add Scorer" button → modal/inline form
    - Remove scorer button

- [ ] Create `components/ScorerForm.tsx` (sub-component):
  - Input: Player name, minute (optional), count (default 1)
  - Add / Cancel buttons

- [ ] Validation:
  - Team Home ≠ Team Away
  - Score ≥ 0
  - At least one team harus score ≥ 1 (implicit check)
  - Player name required

- [ ] After submit:
  - Save to state
  - Call `useTournament.addMatch()`
  - Show success toast/message
  - Reset form

### 3.5 Detail View (Optional Enhanced)
- [ ] Create `components/MatchDetail.tsx`:
  - Modal/page untuk lihat detail 1 match
  - Semua scorers + menit
  - Edit/Delete buttons

---

## Phase 4: Styling & Responsiveness (2-3 hours)

### 4.1 TailwindCSS Setup
- [ ] Configure Tailwind (should auto in Next.js)
- [ ] Create global styles / utility classes:
  - Color palette (primary, success, warning, etc)
  - Spacing system
  - Typography

### 4.2 Mobile-First Design
- [ ] Test on mobile viewport (375px, 480px, 768px)
- [ ] Klasemen table: scrollable on mobile
- [ ] Form inputs: full-width on mobile
- [ ] Tabs: stacked or bottom nav on mobile
- [ ] Cards: responsive padding

### 4.3 Dark Mode (Optional)
- [ ] Add dark mode toggle (header)
- [ ] Use Tailwind dark mode utilities

---

## Phase 5: Data Persistence (2-3 hours)

### 5.1 localStorage Integration
- [ ] useTournament hook: auto-save after state change
- [ ] Load from localStorage on app init
- [ ] Handle empty/corrupted data (fallback to defaults)

### 5.2 Export/Import
- [ ] Add button: "Download Backup" (JSON file)
- [ ] Add button: "Restore from Backup" (file upload)
- [ ] Test: export → clear browser → import → verify

---

## Phase 6: PWA Features (1-2 hours)

### 6.1 Next.js PWA Setup
- [ ] Install `next-pwa`: `npm install next-pwa`
- [ ] Configure in `next.config.js`:
  ```javascript
  const withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
  });
  
  module.exports = withPWA({
    // Next.js config
  });
  ```

### 6.2 Manifest & Icons
- [ ] Create `public/manifest.json`:
  - Name: "Copa Sawo Jajar"
  - Short name: "Copa Sawo"
  - Icons (192x192, 512x512)
  - Theme color
  - Start URL
  
- [ ] Generate app icons (logo)

### 6.3 Test PWA
- [ ] Test on mobile: "Add to Home Screen"
- [ ] Test offline mode: disable internet, app still works
- [ ] Test service worker: check DevTools

---

## Phase 7: Testing & QA (2-3 hours)

### 7.1 Manual Testing
- [ ] **Input Flow:**
  - [ ] Add match grup A: Tim 1 vs Tim 2, 2-1 (Tim 1 cetak 2 gol)
  - [ ] Verify klasemen grup A updated
  - [ ] Add match grup B
  - [ ] Verify both klasemen independent
  
- [ ] **Validation:**
  - [ ] Try submit match dengan tim sama (should fail)
  - [ ] Try input negative score (should fail)
  
- [ ] **Data Persistence:**
  - [ ] Refresh page → data masih ada
  - [ ] Close & reopen browser → data still there
  
- [ ] **Responsive:**
  - [ ] Mobile (375px): all usable, no overflow
  - [ ] Tablet (768px): nice layout
  - [ ] Desktop (1200px+): full width, good spacing

### 7.2 Browser Compatibility
- [ ] Chrome (latest)
- [ ] Safari iOS (if dev has iPhone)
- [ ] Firefox (latest)

### 7.3 Edge Cases
- [ ] Edit match result (change score)
- [ ] Delete match (reset to "upcoming")
- [ ] Add multiple scorers per team in 1 match
- [ ] Export → Import → verify data integrity

---

## Phase 8: Deployment & Documentation (1-2 hours)

### 8.1 Deploy to Production
- [ ] Push to GitHub
- [ ] Connect to Vercel (or Netlify)
- [ ] Build & deploy
- [ ] Test live URL on mobile

### 8.2 Documentation
- [ ] Create README.md:
  - Quick start (access URL)
  - How to input match
  - How to backup data
  - How to restore backup
  
- [ ] Create simple user guide (screenshot + step-by-step)

### 8.3 Final Handoff
- [ ] Live URL ready
- [ ] Backup data from localhost (if any)
- [ ] Admin trained on all features
- [ ] 24h support window before tournament

---

## Task Breakdown by Complexity

### HIGH Priority (Must-Do)
- [x] Data model & types
- [x] useTournament hook (core logic)
- [x] Input match form
- [x] Klasemen calculation & display
- [x] localStorage persistence
- [x] Mobile responsiveness

### MEDIUM Priority (Should-Do)
- [x] Jadwal display
- [x] Scorer details
- [x] Tab navigation
- [x] Edit/Delete match
- [x] Export/Import backup

### LOW Priority (Nice-to-Have)
- [ ] Dark mode
- [ ] Top scorers leaderboard
- [ ] Match history/stats
- [ ] Notification alerts

---

## Timeline & Milestones

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| 1-2: Setup & State | 6 hrs | App scaffolding + hook ready |
| 3-4: Components & Styling | 8-10 hrs | All UI ready, styled |
| 5-6: Persistence & PWA | 3-4 hrs | Data save/load + app install |
| 7-8: Testing & Deploy | 3-4 hrs | Live, tested, documented |
| **TOTAL** | **20-25 hrs** | **Production-ready** |

---

## Notes for Developer

- **No complex state library needed** → useState + useReducer is fine
- **No backend/DB required** → localStorage is enough (single device/admin)
- **Focus on speed** → Match input should be < 30 sec per entry
- **Test on phone first** → This will be used on smartphone at lapangan
- **Data integrity > fancy features** → Ensure klasemen calculation is bulletproof

---

## Sign-off Checklist (Before Tournament)

- [ ] All matches inputtable, score saved
- [ ] Klasemen accurate & updates live
- [ ] Jadwal clear & complete (12 matches)
- [ ] Scorers tracked correctly
- [ ] Mobile friendly (tested on real phone)
- [ ] PWA installable
- [ ] Offline mode works
- [ ] Backup/restore tested
- [ ] Live URL deployed
- [ ] Admin trained
