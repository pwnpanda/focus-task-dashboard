# Multiple Goals, Archive, Celebration & Streaks — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add tab-based multi-goal UI, auto-archiving, completion celebration with animation queue, and streak counters.

**Architecture:** All features extend the existing vanilla JS/ES module structure. State gains `archive`, `activeGoalId` fields and bumps to version 2. A celebration queue lives in app.js as transient module-level state (not persisted). Auto-archive runs before every render.

**Tech Stack:** Vanilla JS ES modules, CSS keyframe animations. No new dependencies.

**Design reference:** docs/plans/2026-03-08-features-design.md

---

## Task 1: State migration and auto-archive (modules/state.js + app.js)

**Files:**
- Modify: `modules/state.js`
- Modify: `app.js`

### Step 1: Add migrateState to modules/state.js

Append this function to modules/state.js:

```js
/**
 * Migrate state from older versions to current schema.
 * v1 -> v2: add archive array and activeGoalId.
 * @param {object} state
 * @returns {object}
 */
export function migrateState(state) {
  if (!state) return null;
  if (state.version === 1) {
    return {
      version: 2,
      goals: state.goals ?? [],
      archive: [],
      activeGoalId: state.goals?.[0]?.id ?? null,
    };
  }
  return state;
}

/**
 * Create initial empty v2 state.
 */
export function emptyState() {
  return { version: 2, goals: [], archive: [], activeGoalId: null };
}
```

Note: replace the existing emptyState() entirely.

### Step 2: Rewrite app.js

Replace app.js with:

```js
// app.js
import {
  loadFromStorage, decodeStateFromHash, saveToStorage,
  clearHash, emptyState, migrateState,
} from './modules/state.js';
import { toDateString } from './modules/goal.js';
import { render } from './modules/ui.js';

let state = emptyState();

// Goals finishing today that need a celebration before archiving.
// Managed as transient UI state, not persisted.
let celebrationQueue = [];

function autoArchive() {
  const today = toDateString(new Date());
  const finishing = state.goals.filter(g => today > g.endDate);
  if (finishing.length === 0) return;

  const finishingIds = new Set(finishing.map(g => g.id));
  const remaining = state.goals.filter(g => !finishingIds.has(g.id));
  // Prepend to archive so newest completed goal is first
  const newArchive = [...finishing, ...state.archive];

  let newActiveId = state.activeGoalId;
  if (finishingIds.has(newActiveId)) {
    newActiveId = remaining[0]?.id ?? (newArchive.length > 0 ? 'archive' : null);
  }

  state = { ...state, goals: remaining, archive: newArchive, activeGoalId: newActiveId };
}

function queueCelebrations() {
  const today = toDateString(new Date());
  state.goals.forEach(g => {
    if (g.endDate === today && !celebrationQueue.includes(g.id)) {
      celebrationQueue.push(g.id);
    }
  });
  // If celebrating, switch to first goal in queue
  if (celebrationQueue.length > 0 && !state.goals.find(g => g.id === state.activeGoalId)?.endDate) {
    state = { ...state, activeGoalId: celebrationQueue[0] };
  }
  if (celebrationQueue.length > 0) {
    state = { ...state, activeGoalId: celebrationQueue[0] };
  }
}

// Called from ui.js after the celebration animation for goalId completes.
export function onCelebrationDone(goalId) {
  // Archive the goal
  const goal = state.goals.find(g => g.id === goalId);
  if (goal) {
    state = {
      ...state,
      goals: state.goals.filter(g => g.id !== goalId),
      archive: [goal, ...state.archive],
    };
  }
  // Remove from queue
  celebrationQueue = celebrationQueue.filter(id => id !== goalId);
  // Switch to next in queue or first remaining goal
  if (celebrationQueue.length > 0) {
    state = { ...state, activeGoalId: celebrationQueue[0] };
  } else {
    const next = state.goals[0];
    state = { ...state, activeGoalId: next?.id ?? (state.archive.length > 0 ? 'archive' : null) };
  }
  saveToStorage(state);
  renderApp();
}

export function getCelebrationQueue() {
  return celebrationQueue;
}

function init() {
  const hashState = decodeStateFromHash();
  const rawLocal = loadFromStorage();

  let loaded;
  if (hashState) {
    const useShared = confirm('A shared goal was found in the URL.\n\nUse it? (Cancel to keep your local state)');
    clearHash();
    loaded = useShared ? hashState : rawLocal;
  } else {
    loaded = rawLocal;
  }

  state = migrateState(loaded) ?? emptyState();
  autoArchive();
  queueCelebrations();
  saveToStorage(state);
  renderApp();
}

export function updateState(newState) {
  state = newState;
  autoArchive();
  saveToStorage(state);
  renderApp();
}

export function getState() {
  return state;
}

function renderApp() {
  render(document.getElementById('app'), state, updateState, celebrationQueue, onCelebrationDone);
}

init();
```

### Step 3: Commit

```bash
git add modules/state.js app.js
git commit -m "Add state v2 schema, migration, auto-archive, and celebration queue"
```

---

## Task 2: Streak functions (modules/goal.js)

**Files:**
- Modify: `modules/goal.js`

Append these two functions to modules/goal.js:

```js
/**
 * Count consecutive logged days ending on today or yesterday.
 * A single missed day resets to 0.
 * @param {object} goal
 * @returns {number}
 */
export function currentStreak(goal) {
  const today = toDateString(new Date());
  let streak = 0;
  let check = today;
  while (check >= goal.startDate) {
    if (goal.logs[check]?.done) {
      streak++;
      check = addDays(check, -1);
    } else if (check === today) {
      // Allow one miss for today — check yesterday
      check = addDays(check, -1);
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Longest consecutive logged-day run across the entire goal period.
 * @param {object} goal
 * @returns {number}
 */
export function bestStreak(goal) {
  let best = 0;
  let run = 0;
  const days = calendarDays(goal).filter(d => d >= goal.startDate && d <= goal.endDate);
  for (const date of days) {
    if (goal.logs[date]?.done) {
      run++;
      if (run > best) best = run;
    } else {
      run = 0;
    }
  }
  return best;
}
```

### Step 3: Commit

```bash
git add modules/goal.js
git commit -m "Add currentStreak and bestStreak pure functions"
```

---

## Task 3: Tab bar and multi-goal UI (modules/ui.js)

**Files:**
- Modify: `modules/ui.js`

This is the largest change. Rewrite modules/ui.js completely.

The key structural changes:
- `render()` gains two new params: `celebrationQueue` and `onCelebrationDone`
- When state has no goals and no archive: show centered create form (original empty state)
- Otherwise: render tab bar + content area
- Tab bar: goal tabs (with X on hover) + "+" tab + archive tab
- Content: active goal view, inline create form, or archive view
- activeGoalId can be a goal UUID, null (+ tab / new goal form), or 'archive'

```js
// modules/ui.js
import {
  createGoal, toggleLog, countLoggedDays, totalDays,
  daysIn, daysLeft, getLog, toDateString, calendarDays,
  currentStreak, bestStreak,
} from './goal.js';
import { encodeStateToHash } from './state.js';

export function render(root, state, update, celebrationQueue, onCelebrationDone) {
  root.textContent = '';
  const hasContent = state.goals.length > 0 || state.archive.length > 0;

  if (!hasContent) {
    // True empty state: show centered create form
    root.appendChild(renderCreateForm(state, update, true));
    return;
  }

  const layout = el('div', 'app-layout');
  layout.appendChild(renderTabBar(state, update));

  const content = el('div', 'tab-content');
  if (state.activeGoalId === 'archive') {
    content.appendChild(renderArchiveView(state, update));
  } else if (state.activeGoalId === null) {
    content.appendChild(renderCreateForm(state, update, false));
  } else {
    const goal = state.goals.find(g => g.id === state.activeGoalId);
    if (goal) {
      const celebrating = celebrationQueue.includes(goal.id) && goal.endDate === toDateString(new Date());
      content.appendChild(renderGoalView(state, update, goal, celebrating, onCelebrationDone));
    }
  }

  layout.appendChild(content);
  root.appendChild(layout);
}

// --- Tab bar ---

function renderTabBar(state, update) {
  const bar = el('nav', 'tab-bar');

  state.goals.forEach(goal => {
    const isActive = goal.id === state.activeGoalId;
    const tab = el('div', 'tab' + (isActive ? ' tab--active' : ''));

    const title = el('span', 'tab-title');
    title.textContent = goal.title.length > 22 ? goal.title.slice(0, 20) + '\u2026' : goal.title;
    tab.appendChild(title);

    const closeBtn = el('button', 'tab-close');
    closeBtn.textContent = '\u00D7';
    closeBtn.title = 'Remove goal';
    closeBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (confirm('Remove "' + goal.title + '"? This cannot be undone.')) {
        const newGoals = state.goals.filter(g => g.id !== goal.id);
        const newActiveId = newGoals[0]?.id ?? (state.archive.length > 0 ? 'archive' : null);
        update({ ...state, goals: newGoals, activeGoalId: newActiveId });
      }
    });
    tab.appendChild(closeBtn);

    tab.addEventListener('click', () => {
      update({ ...state, activeGoalId: goal.id });
    });

    bar.appendChild(tab);
  });

  // "+" tab
  const addTab = el('div', 'tab tab--add' + (state.activeGoalId === null ? ' tab--active' : ''));
  addTab.textContent = '+';
  addTab.title = 'New goal';
  addTab.addEventListener('click', () => update({ ...state, activeGoalId: null }));
  bar.appendChild(addTab);

  // Archive tab
  const isArchiveActive = state.activeGoalId === 'archive';
  const archiveTab = el('div', 'tab tab--archive' + (isArchiveActive ? ' tab--active' : ''));
  archiveTab.title = 'Archive';
  const archiveLabel = el('span');
  archiveLabel.textContent = '\uD83D\uDCE6';
  archiveTab.appendChild(archiveLabel);
  if (state.archive.length > 0) {
    const count = el('span', 'tab-count');
    count.textContent = state.archive.length;
    archiveTab.appendChild(count);
  }
  archiveTab.addEventListener('click', () => update({ ...state, activeGoalId: 'archive' }));
  bar.appendChild(archiveTab);

  return bar;
}

// --- Create form ---

function renderCreateForm(state, update, centered) {
  const wrap = el('div', centered ? 'create-form-wrap' : 'create-form-inline');
  const card = el('div', 'card create-card');

  if (centered) {
    const title = el('h1', 'app-title');
    title.textContent = 'Focus Tracker';
    const subtitle = el('p', 'subtitle');
    subtitle.textContent = 'Set a goal. Show up every day. Earn your reward.';
    card.appendChild(title);
    card.appendChild(subtitle);
  } else {
    const heading = el('h2', 'create-heading');
    heading.textContent = 'New goal';
    card.appendChild(heading);
  }

  const form = el('form', 'goal-form');

  form.appendChild(makeField('text', 'title', 'Goal title', 'e.g. Write every morning'));
  const dateRow = el('div', 'form-row');
  dateRow.appendChild(makeDateField('startDate', 'Start date'));
  dateRow.appendChild(makeDateField('endDate', 'End date'));
  form.appendChild(dateRow);
  form.appendChild(makeField('text', 'reward', 'Reward', 'e.g. New mechanical keyboard'));

  const submitBtn = el('button', 'btn btn-primary');
  submitBtn.type = 'submit';
  submitBtn.textContent = 'Start tracking \u2192';
  form.appendChild(submitBtn);

  form.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const goal = createGoal(fd.get('title'), fd.get('startDate'), fd.get('endDate'), fd.get('reward'));
    update({ ...state, goals: [...state.goals, goal], activeGoalId: goal.id });
  });

  card.appendChild(form);
  wrap.appendChild(card);
  return wrap;
}

// --- Goal view ---

function renderGoalView(state, update, goal, celebrating, onCelebrationDone) {
  const today = toDateString(new Date());
  const logged = countLoggedDays(goal);
  const total = totalDays(goal);
  const pct = total > 0 ? Math.round((logged / total) * 100) : 0;
  const streak = currentStreak(goal);
  const best = bestStreak(goal);

  const wrap = el('div', 'goal-view');

  // Share button in top-right corner
  const topBar = el('div', 'goal-top-bar');
  const shareBtn = el('button', 'btn btn-ghost btn-sm');
  shareBtn.textContent = 'Copy share link';
  topBar.appendChild(shareBtn);
  wrap.appendChild(topBar);

  // Celebration banner (shown when celebrating)
  if (celebrating) {
    wrap.appendChild(renderCelebrationBanner(goal, pct, onCelebrationDone));
  }

  // Goal card
  const card = el('div', 'card goal-card');

  const goalHeader = el('div', 'goal-header');
  const goalTitle = el('h2', 'goal-title');
  goalTitle.textContent = goal.title;
  const rewardBadge = el('span', 'reward-badge');
  rewardBadge.textContent = '\uD83C\uDF81 ' + goal.reward;
  goalHeader.appendChild(goalTitle);
  goalHeader.appendChild(rewardBadge);

  const goalDates = el('div', 'goal-dates');
  goalDates.textContent = goal.startDate + ' \u2192 ' + goal.endDate;

  const progressWrap = el('div', 'progress-bar-wrap');
  const progressBar = el('div', 'progress-bar');
  progressBar.style.width = pct + '%';
  progressWrap.appendChild(progressBar);

  const goalStats = el('div', 'goal-stats');
  const statsLeft = el('span');
  statsLeft.textContent = logged + ' of ' + total + ' days worked (' + pct + '%)';
  const statsRight = el('span');
  statsRight.textContent = daysIn(goal) + ' days in \u00B7 ' + daysLeft(goal) + ' days left';
  goalStats.appendChild(statsLeft);
  goalStats.appendChild(statsRight);

  card.appendChild(goalHeader);
  card.appendChild(goalDates);
  card.appendChild(progressWrap);
  card.appendChild(goalStats);

  // Streak chips (hidden when both 0)
  if (streak > 0 || best > 0) {
    const streakRow = el('div', 'streak-row');
    const streakChip = el('span', 'streak-chip');
    streakChip.textContent = '\uD83D\uDD25 ' + streak + ' day streak';
    const bestChip = el('span', 'streak-chip streak-chip--best');
    bestChip.textContent = 'Best: ' + best;
    streakRow.appendChild(streakChip);
    streakRow.appendChild(bestChip);
    card.appendChild(streakRow);
  }

  // Calendar
  card.appendChild(renderCalendar(goal, today, state, update));
  wrap.appendChild(card);

  // Share button handler
  shareBtn.addEventListener('click', () => {
    const url = window.location.origin + window.location.pathname + encodeStateToHash(state);
    navigator.clipboard.writeText(url).then(() => {
      shareBtn.textContent = 'Copied!';
      setTimeout(() => { shareBtn.textContent = 'Copy share link'; }, 2000);
    });
  });

  return wrap;
}

// --- Celebration banner ---

function renderCelebrationBanner(goal, pct, onCelebrationDone) {
  const banner = el('div', pct >= 80 ? 'celebration-banner celebration-banner--win' : 'celebration-banner');

  const msg = el('p', 'celebration-msg');
  if (pct >= 80) {
    msg.textContent = 'Goal complete! You earned: ' + goal.reward;
  } else {
    msg.textContent = 'Goal period ended. ' + pct + '% completed.';
  }
  banner.appendChild(msg);

  const note = el('p', 'celebration-note');
  note.textContent = 'This goal will be moved to your archive.';
  banner.appendChild(note);

  const dismissBtn = el('button', 'btn btn-ghost btn-sm');
  dismissBtn.textContent = 'Got it';
  dismissBtn.addEventListener('click', () => onCelebrationDone(goal.id));
  banner.appendChild(dismissBtn);

  // Auto-dismiss after 8 seconds
  setTimeout(() => onCelebrationDone(goal.id), 8000);

  return banner;
}

// --- Archive view ---

function renderArchiveView(state) {
  const wrap = el('div', 'archive-view');

  const heading = el('h2', 'archive-heading');
  heading.textContent = 'Archive';
  wrap.appendChild(heading);

  if (state.archive.length === 0) {
    const empty = el('p', 'archive-empty');
    empty.textContent = 'No archived goals yet.';
    wrap.appendChild(empty);
    return wrap;
  }

  state.archive.forEach(goal => {
    const today = toDateString(new Date());
    const logged = countLoggedDays(goal);
    const total = totalDays(goal);
    const pct = total > 0 ? Math.round((logged / total) * 100) : 0;
    const streak = currentStreak(goal);
    const best = bestStreak(goal);

    const card = el('div', 'card goal-card goal-card--archived');

    const goalHeader = el('div', 'goal-header');
    const goalTitle = el('h3', 'goal-title');
    goalTitle.textContent = goal.title;
    const rewardBadge = el('span', 'reward-badge');
    rewardBadge.textContent = '\uD83C\uDF81 ' + goal.reward;
    goalHeader.appendChild(goalTitle);
    goalHeader.appendChild(rewardBadge);

    const goalDates = el('div', 'goal-dates');
    goalDates.textContent = goal.startDate + ' \u2192 ' + goal.endDate;

    const progressWrap = el('div', 'progress-bar-wrap');
    const progressBar = el('div', 'progress-bar');
    progressBar.style.width = pct + '%';
    progressWrap.appendChild(progressBar);

    const goalStats = el('div', 'goal-stats');
    const statsLeft = el('span');
    statsLeft.textContent = logged + ' of ' + total + ' days worked (' + pct + '%)';
    goalStats.appendChild(statsLeft);

    card.appendChild(goalHeader);
    card.appendChild(goalDates);
    card.appendChild(progressWrap);
    card.appendChild(goalStats);

    if (streak > 0 || best > 0) {
      const streakRow = el('div', 'streak-row');
      const streakChip = el('span', 'streak-chip');
      streakChip.textContent = '\uD83D\uDD25 ' + streak + ' day streak';
      const bestChip = el('span', 'streak-chip streak-chip--best');
      bestChip.textContent = 'Best: ' + best;
      streakRow.appendChild(streakChip);
      streakRow.appendChild(bestChip);
      card.appendChild(streakRow);
    }

    card.appendChild(renderCalendar(goal, today, null, null));
    wrap.appendChild(card);
  });

  return wrap;
}

// --- Calendar ---

function renderCalendar(goal, today, state, update) {
  const calWrap = el('div', 'calendar-wrap');

  const calHeader = el('div', 'calendar-header');
  ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].forEach(name => {
    const d = el('div', 'calendar-day-name');
    d.textContent = name;
    calHeader.appendChild(d);
  });
  calWrap.appendChild(calHeader);

  const grid = el('div', 'calendar-grid');
  const days = calendarDays(goal);
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  let lastMonthKey = null;
  const readonly = state === null;

  weeks.forEach(week => {
    const monthStartDate = week.find(d => d.slice(8) === '01');
    const newMonthKey = monthStartDate ? monthStartDate.slice(0, 7) : null;

    if (lastMonthKey === null || newMonthKey) {
      const labelDate = newMonthKey ?? week[0];
      const label = el('div', 'calendar-month-label');
      label.textContent = formatMonth(labelDate);
      grid.appendChild(label);
      lastMonthKey = newMonthKey ?? week[0].slice(0, 7);
    }

    week.forEach(date => {
      const cell = el('div', 'day');
      const inRange = date >= goal.startDate && date <= goal.endDate;
      const log = getLog(goal, date);

      if (date === today) cell.classList.add('day--today');
      cell.classList.add(inRange ? 'day--in-range' : 'day--outside');

      if (log?.done) {
        cell.classList.add(log.loggedOn !== date ? 'day--backdated' : 'day--done');
      }

      if (inRange && date > today) cell.classList.add('day--future');

      cell.title = date;
      const numSpan = el('span', 'day-number');
      numSpan.textContent = parseInt(date.slice(8), 10);
      cell.appendChild(numSpan);
      const dot = el('span', 'day-dot');
      cell.appendChild(dot);

      if (!readonly && inRange && date <= today) {
        cell.addEventListener('click', () => {
          update({ ...state, goals: state.goals.map(g => g.id === goal.id ? toggleLog(g, date) : g) });
        });
      }

      grid.appendChild(cell);
    });
  });

  calWrap.appendChild(grid);
  return calWrap;
}

// --- Form helpers ---

function makeField(type, name, labelText, placeholder) {
  const label = el('label', 'form-label');
  const span = el('span', 'form-label-text');
  span.textContent = labelText;
  const input = el('input', 'form-input');
  input.type = type;
  input.name = name;
  input.placeholder = placeholder;
  input.required = true;
  label.appendChild(span);
  label.appendChild(input);
  return label;
}

function makeDateField(name, labelText) {
  const label = el('label', 'form-label');
  const span = el('span', 'form-label-text');
  span.textContent = labelText;
  const input = el('input', 'form-input');
  input.type = 'date';
  input.name = name;
  input.required = true;
  label.appendChild(span);
  label.appendChild(input);
  return label;
}

// --- Utilities ---

function el(tag, className) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  return e;
}

function formatMonth(dateStr) {
  const [y, m] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
}
```

### Step 2: Verify in browser

Open http://localhost:3000 (run: npx serve .)

Check:
- [ ] Empty state (no goals) shows centered create form
- [ ] Creating a goal shows it as a tab and switches to it
- [ ] Creating a second goal adds another tab
- [ ] Clicking tabs switches goals
- [ ] X button on tab shows confirm dialog, removes goal
- [ ] "+" tab shows inline create form
- [ ] Archive tab shows empty archive message
- [ ] Share link still works

### Step 3: Commit

```bash
git add modules/ui.js
git commit -m "Rewrite UI with tab bar, multi-goal support, archive view, and streak display"
```

---

## Task 4: CSS for new components (style.css)

**Files:**
- Modify: `style.css`

Append the following to style.css (before the responsive section):

```css
/* --- App layout (tab-based) --- */
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* --- Tab bar --- */
.tab-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(13, 17, 23, 0.92);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: stretch;
  overflow-x: auto;
  scrollbar-width: none;
  gap: 2px;
  padding: 0 8px;
}

.tab-bar::-webkit-scrollbar {
  display: none;
}

.tab {
  align-items: center;
  border-bottom: 2px solid transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  font-size: 0.85rem;
  font-weight: 500;
  gap: 6px;
  padding: 10px 14px;
  position: relative;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
  white-space: nowrap;
  user-select: none;
  border-radius: var(--radius-xs) var(--radius-xs) 0 0;
}

.tab:hover {
  color: var(--text);
  background: var(--surface-2);
}

.tab--active {
  color: var(--mint);
  border-bottom-color: var(--mint);
}

.tab-title {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-close {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  opacity: 0;
  padding: 0 2px;
  transition: color 0.12s, opacity 0.12s;
}

.tab:hover .tab-close {
  opacity: 1;
}

.tab-close:hover {
  color: var(--red);
}

.tab--add {
  font-size: 1.2rem;
  font-weight: 400;
  padding: 8px 16px;
}

.tab--archive {
  margin-left: auto;
  gap: 6px;
}

.tab-count {
  background: var(--surface-2);
  border-radius: 99px;
  color: var(--text-muted);
  font-size: 0.7rem;
  font-weight: 600;
  padding: 1px 6px;
}

/* --- Tab content area --- */
.tab-content {
  flex: 1;
}

/* --- Goal view inside tabs --- */
.goal-view {
  max-width: 660px;
  margin: 0 auto;
  padding: 24px 16px 48px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.goal-top-bar {
  display: flex;
  justify-content: flex-end;
}

.btn-sm {
  font-size: 0.8rem;
  padding: 6px 14px;
}

/* --- Inline create form --- */
.create-form-inline {
  max-width: 480px;
  margin: 32px auto;
  padding: 0 16px;
}

.create-heading {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 20px;
  color: var(--text);
}

/* --- Streak row --- */
.streak-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.streak-chip {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 99px;
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 500;
  padding: 3px 10px;
}

.streak-chip--best {
  color: var(--peach);
  border-color: rgba(253, 186, 116, 0.25);
  background: rgba(253, 186, 116, 0.08);
}

/* --- Celebration banner --- */
.celebration-banner {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.celebration-banner--win {
  border-color: var(--mint);
  background: var(--mint-dim);
  animation: shimmer 2s ease-in-out 3;
}

@keyframes shimmer {
  0%, 100% { box-shadow: 0 0 0 0 var(--mint-glow); }
  50% { box-shadow: 0 0 24px 4px var(--mint-glow); }
}

.celebration-msg {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
}

.celebration-banner--win .celebration-msg {
  color: var(--mint);
}

.celebration-note {
  font-size: 0.85rem;
  color: var(--text-muted);
}

/* --- Archive view --- */
.archive-view {
  max-width: 660px;
  margin: 0 auto;
  padding: 24px 16px 48px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.archive-heading {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: -0.01em;
}

.archive-empty {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.goal-card--archived {
  opacity: 0.8;
}

/* --- Calendar wrap (extracted from .calendar-card) --- */
.calendar-wrap {
  margin-top: 8px;
}
```

Also remove the old `.calendar-card` padding rule and the `.main-content` block — they are replaced by `.goal-view` and `.calendar-wrap`. Replace:

```css
/* --- Calendar --- */
.calendar-card {
  padding: 24px;
}
```

with:

```css
/* --- Calendar --- */
```

And remove `.main-content` block entirely.

### Step 2: Verify visually

- [ ] Tab bar appears at top, tabs are styled correctly
- [ ] Active tab has mint underline
- [ ] X button appears on tab hover
- [ ] Archive tab is right-aligned
- [ ] Streak chips appear below progress bar
- [ ] Celebration banner glows on win, plain on loss
- [ ] Archive view has correct layout
- [ ] Mobile still works (tab bar scrolls horizontally)

### Step 3: Commit

```bash
git add style.css
git commit -m "Add CSS for tab bar, streaks, celebration banner, and archive view"
```

---

## Completion Checklist

- [ ] State migrates from v1 to v2 correctly (open app after clearing localStorage to test fresh start)
- [ ] Auto-archive moves goals where today > endDate silently on load
- [ ] Celebration triggers when today === endDate, queues multiple goals
- [ ] Celebration auto-archives goal after 8s or on "Got it" click
- [ ] Tab bar renders all active goals + "+" + archive icon
- [ ] X on tab shows confirm, removes goal, switches to next
- [ ] "+" tab shows inline create form; new goal switches to its tab
- [ ] Archive tab shows all archived goals, read-only calendars
- [ ] Streak chips show correctly (hidden when both 0)
- [ ] Share link still encodes full state
- [ ] Mobile: tab bar scrolls horizontally without showing scrollbar
