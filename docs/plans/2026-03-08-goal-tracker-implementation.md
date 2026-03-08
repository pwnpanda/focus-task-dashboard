# Goal Tracker Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a vanilla JS/HTML/CSS short-goal tracker with daily progress logging, a 2-month calendar view, localStorage persistence, and URL-based state sharing.

**Architecture:** Single-page app using ES modules served from a static host. State lives entirely in localStorage and is optionally encoded into the URL hash for sharing. No framework, no build step.

**Tech Stack:** Vanilla HTML5, CSS custom properties, JavaScript ES modules, Inter font (Google Fonts).

**Design reference:** docs/plans/2026-03-08-goal-tracker-design.md

---

## Task 0: Clean up old prototype

Delete src/, public/, node_modules/, package-lock.json using trash (not rm).
Replace package.json with minimal version (no dependencies).
Create new structure: index.html, style.css, app.js, modules/state.js, modules/goal.js, modules/ui.js

Commit: "Remove React prototype, scaffold vanilla JS structure"

---

## Task 1: Goal data model (modules/goal.js)

Pure functions, no DOM. Implement:
- createGoal(title, startDate, endDate, reward) -> goal object with id (crypto.randomUUID()), note: '', logs: {}
- toggleLog(goal, date) -> new goal: if log exists remove it, else add {done: true, loggedOn: today}
- countLoggedDays(goal) -> number of dates with done=true
- totalDays(goal) -> daysBetween(startDate, endDate) + 1
- daysIn(goal) -> elapsed days clamped to goal range
- daysLeft(goal) -> remaining days clamped to 0
- getLog(goal, date) -> logs[date] or null
- toDateString(Date) -> "YYYY-MM-DD" in local time
- fromDateString("YYYY-MM-DD") -> Date at midnight local
- daysBetween(a, b) -> Math.round((fromDateString(b) - fromDateString(a)) / 86400000)
- addDays(dateStr, n) -> new date string
- calendarDays(goal) -> array of 60 date strings, starting on Monday ~3 weeks before goal.startDate

Commit: "Add goal data model with pure helper functions"

---

## Task 2: State persistence (modules/state.js)

Implement:
- loadFromStorage() -> parse localStorage["focus-tracker"] or null
- saveToStorage(state) -> JSON.stringify to localStorage
- encodeStateToHash(state) -> "#" + btoa(JSON.stringify(state))
- decodeStateFromHash() -> parse atob(location.hash.slice(1)) or null
- clearHash() -> history.replaceState to remove hash
- emptyState() -> { version: 1, goals: [] }

Commit: "Add state persistence module with localStorage and URL hash encoding"

---

## Task 3: HTML scaffold and app entry point

index.html: minimal HTML5 shell. Load Inter from Google Fonts. Load style.css. Mount div#app. Load app.js as type=module.

app.js bootstrap logic:
1. decodeStateFromHash() -- if present, confirm() prompt to use shared or local state, clearHash()
2. else loadFromStorage()
3. else emptyState()
4. export updateState(newState): saves to storage, calls render
5. export getState(): returns current state
6. renderApp(): calls render(document.getElementById("app"), state, updateState)
7. call init() on load

Commit: "Add HTML scaffold and app entry point"

---

## Task 4: UI rendering (modules/ui.js)

render(root, state, update): clears root, shows create form if no goals, else goal view.

Create form: card centered on page with fields: title (text), startDate (date), endDate (date), reward (text). On submit, createGoal() and update state with new goal.

Goal view:
- Header bar: app name left, buttons right ("Copy share link", "New goal")
- Goal card: title, reward badge, date range, progress bar (width = pct%), stats row ("X of Y days worked", "N days in / M days left")  
- Calendar card: day name headers (Mo Tu We Th Fr Sa Su), then 60 day cells in 7-column grid

Day cell logic:
- inRange = date >= startDate && date <= endDate
- log = getLog(goal, date)
- Classes: day--today (if date === today), day--in-range or day--outside
- If log.done and log.loggedOn === date: add day--done
- If log.done and log.loggedOn !== date: add day--backdated  
- Cell text: day number (parseInt(date.slice(8), 10))
- Only in-range cells get click handler -> toggleLog -> update

Share button: build URL from origin + pathname + encodeStateToHash(state), write to clipboard, temporarily show "Copied!"
New goal button: confirm() then update with empty goals array

All user-supplied strings (title, reward) must be HTML-escaped before insertion.

Commit: "Render full goal view with calendar, stats, and share link"

---

## Task 5: Visual design (style.css)

Apply compound-engineering:frontend-design skill for a polished dark theme with mint and pastel accents.

Color palette:
  --bg: #0d1117
  --surface: #161b22
  --surface-2: #1e2530
  --border: #2a3441
  --text: #e0f2ee
  --text-muted: #6b8a80
  --mint: #2dd4bf  (primary accent: progress, buttons, focus rings)
  --mint-dim: rgba(45,212,191,0.15)
  --green: #86efac  (done-on-day cells)
  --green-dim: rgba(134,239,172,0.18)
  --red: #fca5a5  (backdated cells, soft pastel)
  --red-dim: rgba(252,165,165,0.18)
  --lavender: #c4b5fd  (reward badge)
  --peach: #fdba74  (secondary highlight)
  --radius: 12px
  --radius-sm: 6px

Key component styles needed:
- Body: dark bg, Inter font, text color
- .create-form-wrap: full-height flex center
- .create-card: max-width 480px, card surface
- .app-title: large bold mint
- .goal-form: flex column with gap
- .form-input: dark bg, border, mint focus outline
- .form-row: flex row (column on mobile)
- .app-header: sticky, surface bg, border-bottom, flex space-between
- .app-name: bold mint
- .main-content: centered column max-width 640px
- .card: surface bg, border, border-radius, padding
- .goal-title: large bold
- .reward-badge: lavender pill (20% opacity bg, lavender text)
- .progress-bar-wrap: full-width pill track, height 8px, surface-2 bg
- .progress-bar: mint bg, height 100%, transition width 0.4s ease
- .calendar-header + .calendar-grid: 7-column CSS Grid, gap 4px
- .calendar-day-name: centered, 0.7rem, uppercase, muted
- .day: aspect-ratio 1, flex center, 0.8rem, border-radius sm, transition 0.15s
- .day--in-range: surface-2 bg, cursor pointer, hover mint-dim
- .day--in-range:active: transform scale(0.92)
- .day--outside: opacity 0.2, pointer-events none
- .day--today: box-shadow 0 0 0 2px mint
- .day--done: green-dim bg, green text, font-weight 600
- .day--backdated: red-dim bg, red text, font-weight 600
- .btn-primary: mint bg, dark text
- .btn-ghost: transparent, border, hover surface-2
- .btn-danger: ghost with red on hover

Verify in browser:
- Dark bg with mint accents
- Create form centered, inputs have mint focus ring
- Reward badge is lavender pill
- Progress bar is mint
- Today has mint ring
- Done = soft green, backdated = soft pastel red, outside = barely visible
- Mobile 375px: no overflow, form-row stacks

Commit: "Apply mint and pastel dark theme with polished component styles"

---

## Task 6: End-to-end test and README

Test checklist:
- Create a goal spanning ~3 weeks around today
- Mark today -> green; mark yesterday -> red (backdated)
- Click marked day -> clears to neutral
- Progress bar and stats update correctly
- Hard reload -> goal and logs persist from localStorage
- Copy share link -> open in incognito -> accept -> goal loads with logs
- In incognito -> decline -> empty create form
- New goal -> confirm -> create form

Write README.md covering: what it does, features list, hosting options (GitHub Pages, Netlify, npx serve .), development instructions (no build step).

Commit: "Add README with hosting and development instructions"

---

## Completion Checklist

- [ ] Old React prototype removed, ES module structure in place
- [ ] modules/goal.js -- pure data model and calendar helpers
- [ ] modules/state.js -- localStorage + URL hash encode/decode
- [ ] modules/ui.js -- create form + goal view + calendar grid
- [ ] app.js -- bootstrap, hash/localStorage on load
- [ ] index.html -- minimal shell with Inter font
- [ ] style.css -- mint/pastel dark theme, all states styled
- [ ] Calendar: ~60 days, Mon-Sun grid
- [ ] Green = done, pastel red = backdated, outside = dimmed
- [ ] Share link round-trips in fresh browser session
- [ ] localStorage persists across reloads
- [ ] Mobile responsive (375px+)
