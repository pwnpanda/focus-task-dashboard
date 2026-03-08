# Features: Multiple Goals, Archive, Celebration, Streaks — Design Document

**Date:** 2026-03-08

## Overview

Four new features added to the goal tracker, designed together because they share state and UI structure.

---

## 1. Multiple Goals (Tab UI)

### State changes

```js
{
  version: 2,
  goals: Goal[],          // active goals only
  archive: Goal[],        // auto-archived goals
  activeGoalId: string | null
}
```

### Tab bar

Replaces the current sticky header. Contains:
- One tab per active goal (title truncated to ~20 chars)
- X button on each tab (visible on hover) — always shows a confirm dialog before removing
- "+" tab at the end to create a new goal
- Archive tab (archive icon) always at the far right

### Goal removal

- X on tab → confirm dialog → remove from goals array
- "New goal" button inside goal view removed; "+" tab handles creation
- No other removal mechanism (archive is automatic)

### Active goal tracking

`activeGoalId` tracks the selected tab. On load, defaults to first active goal. When a goal is removed or archived, switch to the nearest remaining tab.

---

## 2. Goal Archive (Auto)

### Auto-archive logic

On every app init and state update: move any goal where `today > goal.endDate` from `goals` to `archive`. This runs before rendering.

### Archive tab view

- Shows archived goals newest-first as fully expanded, read-only cards
- Each card: title, reward badge, date range, completion %, progress bar, streak stats, non-clickable calendar
- Empty state: "No archived goals yet."

### No manual archive

The "Archive goal" button is not implemented. Auto-archive is the only mechanism.

---

## 3. Completion Celebration

### Trigger

When `today === goal.endDate` for an active goal (checked on app load/state update, before auto-archive runs next day).

### Queue

If multiple goals finish on the same day, process them in order (by array index). Celebrate one fully, then move to the next.

### Flow per goal

1. Auto-switch to that goal's tab
2. Show celebration banner on the goal card:
   - ≥ 80% logged: congratulatory message + shimmer border animation + "You earned: [reward]"
   - < 80%: neutral "Goal period ended" notice, no animation
3. After animation completes (or user clicks banner): show message "This goal has been moved to your archive", then auto-archive it
4. Move to next celebrating goal if any remain in the queue

### Implementation

Pure CSS keyframe animation on the goal card border. No external libraries.

---

## 4. Streak Counter

### Logic (pure functions in goal.js)

- **currentStreak**: count consecutive logged days ending on today or yesterday. A single missed day resets to 0.
- **bestStreak**: longest consecutive logged-day run across the entire goal period.

### Display

Two stat chips below the progress bar, between stats row and calendar:

    🔥 5 day streak · Best: 12

Hidden entirely when both values are 0.

---

## Data Migration

State version bumps from 1 to 2. On load, if `state.version === 1`, add `archive: []` and `activeGoalId: state.goals[0]?.id ?? null`.
