// modules/ui.js
import {
  createGoal, toggleLog, countLoggedDays, totalDays,
  daysIn, daysLeft, getLog, toDateString, calendarDays,
} from './goal.js';
import { encodeStateToHash } from './state.js';

export function render(root, state, update) {
  root.textContent = '';
  if (state.goals.length === 0) {
    root.appendChild(renderCreateForm(state, update));
  } else {
    root.appendChild(renderGoalView(state, update));
  }
}

// --- Create form ---

function renderCreateForm(state, update) {
  const wrap = el('div', 'create-form-wrap');
  const card = el('div', 'card create-card');

  const title = el('h1', 'app-title');
  title.textContent = 'Focus Tracker';

  const subtitle = el('p', 'subtitle');
  subtitle.textContent = 'Set a goal. Show up every day. Earn your reward.';

  const form = el('form', 'goal-form');
  form.id = 'create-form';

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
    const goal = createGoal(
      fd.get('title'),
      fd.get('startDate'),
      fd.get('endDate'),
      fd.get('reward'),
    );
    update({ ...state, goals: [goal] });
  });

  card.appendChild(title);
  card.appendChild(subtitle);
  card.appendChild(form);
  wrap.appendChild(card);
  return wrap;
}

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

// --- Goal view ---

function renderGoalView(state, update) {
  const goal = state.goals[0];
  const today = toDateString(new Date());
  const logged = countLoggedDays(goal);
  const total = totalDays(goal);
  const pct = total > 0 ? Math.round((logged / total) * 100) : 0;

  const wrap = el('div', 'goal-view');

  // Header
  const header = el('header', 'app-header');
  const appName = el('span', 'app-name');
  appName.textContent = 'Focus Tracker';

  const headerActions = el('div', 'header-actions');
  const shareBtn = el('button', 'btn btn-ghost');
  shareBtn.textContent = 'Copy share link';
  const newGoalBtn = el('button', 'btn btn-ghost btn-danger');
  newGoalBtn.textContent = 'New goal';
  headerActions.appendChild(shareBtn);
  headerActions.appendChild(newGoalBtn);

  header.appendChild(appName);
  header.appendChild(headerActions);
  wrap.appendChild(header);

  const main = el('main', 'main-content');

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
  main.appendChild(card);

  // Calendar
  const calCard = el('div', 'card calendar-card');

  const calHeader = el('div', 'calendar-header');
  ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].forEach(name => {
    const d = el('div', 'calendar-day-name');
    d.textContent = name;
    calHeader.appendChild(d);
  });
  calCard.appendChild(calHeader);

  const grid = el('div', 'calendar-grid');
  const days = calendarDays(goal);

  // Group into weeks of 7 so we can insert month labels between weeks
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  let lastMonthKey = null;
  weeks.forEach(week => {
    // A new month starts in this week if any day is the 1st
    const monthStartDate = week.find(d => d.slice(8) === '01');
    const newMonthKey = monthStartDate ? monthStartDate.slice(0, 7) : null;

    // Show a label at calendar start and whenever the month rolls over
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

      cell.title = date;

      const numSpan = el('span', 'day-number');
      numSpan.textContent = parseInt(date.slice(8), 10);
      cell.appendChild(numSpan);

      const dot = el('span', 'day-dot');
      cell.appendChild(dot);

      if (inRange) {
        cell.addEventListener('click', () => {
          update({ ...state, goals: [toggleLog(goal, date)] });
        });
      }

      grid.appendChild(cell);
    });
  });

  calCard.appendChild(grid);
  main.appendChild(calCard);
  wrap.appendChild(main);

  // Share button
  shareBtn.addEventListener('click', () => {
    const url = window.location.origin
      + window.location.pathname
      + encodeStateToHash(state);
    navigator.clipboard.writeText(url).then(() => {
      shareBtn.textContent = 'Copied!';
      setTimeout(() => { shareBtn.textContent = 'Copy share link'; }, 2000);
    });
  });

  // New goal button
  newGoalBtn.addEventListener('click', () => {
    if (confirm('Start a new goal? Your current goal will be lost.')) {
      update({ ...state, goals: [] });
    }
  });

  return wrap;
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
