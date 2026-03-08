# Goal Tracker — Design Document

**Date:** 2026-03-08

## Overview

A client-side short-goal tracker hosted as a static web service. Users set a goal with a start date, end date, and reward, then log daily binary progress. All state lives in the browser (localStorage); a share link encodes full state in the URL hash for recovery and sharing.

## Tech Stack

- **Vanilla HTML/CSS/JS** — no framework, no build step
- **ES modules** — clean code organization, modern browser support
- **Hosted** on a static server (GitHub Pages, Netlify, etc.)

## File Structure

```
index.html
style.css
app.js              ← entry point, bootstraps the app
modules/
  state.js          ← localStorage read/write + URL encode/decode
  goal.js           ← goal data model and helpers
  ui.js             ← rendering and DOM event handling
```

## Data Model

```js
// App state
{
  version: 1,
  goals: [Goal]     // array (UI shows single goal for now; multi-goal is a future improvement)
}

// Goal
{
  id: string,           // UUID (crypto.randomUUID())
  title: string,
  startDate: string,    // "YYYY-MM-DD"
  endDate: string,      // "YYYY-MM-DD"
  reward: string,
  note: string,
  logs: {
    "YYYY-MM-DD": {
      done: boolean,
      loggedOn: string  // "YYYY-MM-DD" — actual date entry was made
    }
  }
}
```

A loggedOn date that differs from the key date means the entry was backdated.

## State Persistence

- **Primary store:** localStorage key `focus-tracker`. Written on every state change.
- **Share link:** "Copy share link" button serialises full state as JSON.stringify → btoa (base64) → stored in window.location.hash.
- **On load:**
  1. If URL hash is present: decode it and prompt the user — "Use this shared state" or "Keep my local state".
  2. Else: load from localStorage.
  3. If neither: show "Create your first goal" screen.

No external libraries needed — btoa/atob are built into all modern browsers.

## UI Layout

### No goal state
Centered card with form fields: title, start date, end date, reward. "Start tracking" button creates the goal.

### Active goal view
- **Header bar:** app name · "Copy share link" button · "New Goal" button (replaces current goal after confirmation)
- **Goal card:**
  - Title + reward badge
  - Date range display
  - Progress bar: X of Y days worked (Z%)
  - Time stats: N days in · M days left
- **Calendar grid:** ~2 months always in view, weeks displayed Mon–Sun

### Calendar day cells

| State | Visual |
|---|---|
| Outside goal range | Visible, dimmed, not clickable |
| In range, no log | Neutral background (range is visually distinct from outside) |
| In range, done on the day | Green |
| In range, backdated | Red |

Clicking a cell inside the goal range toggles it done/undone. Removing a log deletes the entry entirely (default is "no work performed").

## Visual Design

- Dark theme, clean card layout
- Inter font (Google Fonts)
- Satisfying click feedback on day cells
- Responsive — works on mobile and desktop

## Future Improvements

1. Per-goal notes — editable text field on each goal card, updated throughout the process
2. Multiple goals — show all active goals in a single scrollable view (data model already supports this)
3. Streak counter — highlight consecutive green days; show current and best streak
4. Completion celebration — animation when end date is reached with a high completion percentage
5. Goal archive — completed goals move to a read-only history view
6. Progress target — set "X out of Y days" instead of "every day"
7. Export to PNG/PDF — shareable visual summary of a completed goal

## Out of Scope (this version)

- Server-side storage or user accounts
- Push notifications or reminders
- Multiple goals in UI (data model ready, UI deferred)
