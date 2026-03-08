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
    root.appendChild(renderCreateForm(state, update, true));
    return;
  }

  const layout = el('div', 'app-layout');
  layout.appendChild(renderTabBar(state, update));

  const content = el('div', 'tab-content');
  if (state.activeGoalId === 'archive') {
    content.appendChild(renderArchiveView(state));
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

  const topBar = el('div', 'goal-top-bar');
  const shareBtn = el('button', 'btn btn-ghost btn-sm');
  shareBtn.textContent = 'Copy share link';
  topBar.appendChild(shareBtn);
  wrap.appendChild(topBar);

  if (celebrating) {
    wrap.appendChild(renderCelebrationBanner(goal, pct, onCelebrationDone));
  }

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

  card.appendChild(renderCalendar(goal, today, state, update));
  wrap.appendChild(card);

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
  msg.textContent = pct >= 80
    ? 'Goal complete! You earned: ' + goal.reward
    : 'Goal period ended. ' + pct + '% completed.';
  banner.appendChild(msg);

  const note = el('p', 'celebration-note');
  note.textContent = 'This goal will be moved to your archive.';
  banner.appendChild(note);

  const dismissBtn = el('button', 'btn btn-ghost btn-sm');
  dismissBtn.textContent = 'Got it';
  banner.appendChild(dismissBtn);

  let dismissed = false;
  function dismiss() {
    if (dismissed) return;
    dismissed = true;
    onCelebrationDone(goal.id);
  }

  dismissBtn.addEventListener('click', dismiss);
  setTimeout(dismiss, 8000);

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
