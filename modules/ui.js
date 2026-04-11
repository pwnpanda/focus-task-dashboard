// modules/ui.js
import {
  createGoal, toggleLog, countLoggedDays, totalDays, effectiveTarget,
  daysIn, daysLeft, getLog, toDateString, calendarDays,
  currentStreak, bestStreak, allTodosDone, todosProgress, targetDaysReached,
} from './goal.js';
import { encodeStateToHash } from './state.js';
import * as log from './logger.js';

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
      const celebrating = celebrationQueue.includes(goal.id);
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
    title.textContent = goal.title.length > 22 ? goal.title.slice(0, 21) + '\u2026' : goal.title;
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
  const archiveSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  archiveSvg.setAttribute('width', '16');
  archiveSvg.setAttribute('height', '16');
  archiveSvg.setAttribute('viewBox', '0 0 24 24');
  archiveSvg.setAttribute('fill', 'none');
  archiveSvg.setAttribute('stroke', 'currentColor');
  archiveSvg.setAttribute('stroke-width', '2');
  archiveSvg.setAttribute('stroke-linecap', 'round');
  archiveSvg.setAttribute('stroke-linejoin', 'round');
  const svgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  svgRect.setAttribute('x', '2'); svgRect.setAttribute('y', '4');
  svgRect.setAttribute('width', '20'); svgRect.setAttribute('height', '5');
  svgRect.setAttribute('rx', '1');
  const svgBody = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  svgBody.setAttribute('d', 'M4 9v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9');
  const svgLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  svgLine.setAttribute('d', 'M10 13h4');
  archiveSvg.appendChild(svgRect);
  archiveSvg.appendChild(svgBody);
  archiveSvg.appendChild(svgLine);
  archiveLabel.appendChild(archiveSvg);
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
  form.appendChild(makeTargetField());
  form.appendChild(makeField('text', 'reward', 'Reward', 'e.g. New mechanical keyboard'));

  const todosField = makeTodosField();
  form.appendChild(todosField);

  const submitBtn = el('button', 'btn btn-primary');
  submitBtn.type = 'submit';
  submitBtn.textContent = 'Start tracking \u2192';
  form.appendChild(submitBtn);

  form.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const todos = todosField.getTodos();
    const goal = createGoal(
      fd.get('title'), fd.get('startDate'), fd.get('endDate'),
      fd.get('reward'), fd.get('targetDays') || null, todos,
    );
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
  const target = effectiveTarget(goal);
  const logPct = target > 0 ? Math.min(100, Math.round((logged / target) * 100)) : 0;
  const tp = todosProgress(goal);
  const pct = tp.total > 0 ? Math.round((tp.done / tp.total) * 100) : logPct;
  const streak = currentStreak(goal);
  const best = bestStreak(goal);

  const wrap = el('div', 'goal-view');

  const topBar = el('div', 'goal-top-bar');
  const shareBtn = el('button', 'btn btn-ghost btn-sm');
  shareBtn.textContent = 'Copy share link';
  topBar.appendChild(shareBtn);
  wrap.appendChild(topBar);

  if (celebrating) {
    wrap.appendChild(renderCelebrationBanner(goal, pct, allTodosDone(goal), onCelebrationDone));
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
  if (tp.total > 0) {
    statsLeft.textContent = tp.done + ' of ' + tp.total + ' tasks done \u00B7 ' + logged + ' days logged';
  } else {
    const targetLabel = goal.targetDays && goal.targetDays < total ? ' target' : '';
    statsLeft.textContent = logged + ' of ' + target + targetLabel + ' days (' + logPct + '%)';
  }
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

  if (!celebrating && targetDaysReached(goal)) {
    const finishWrap = el('div', 'finish-goal-wrap');
    const finishMsg = el('p', 'finish-goal-msg');
    finishMsg.textContent = 'Target reached! You logged ' + logged + ' of ' + target + ' days.';
    finishWrap.appendChild(finishMsg);
    const finishBtn = el('button', 'btn btn-primary btn-sm');
    finishBtn.textContent = 'Mark as finished';
    finishBtn.addEventListener('click', () => {
      const newGoals = state.goals.map(g =>
        g.id === goal.id ? { ...g, finished: true } : g
      );
      update({ ...state, goals: newGoals });
    });
    finishWrap.appendChild(finishBtn);
    card.appendChild(finishWrap);
  }

  const todosSection = renderTodos(goal, state, update);
  if (todosSection) card.appendChild(todosSection);

  card.appendChild(renderCalendar(goal, today, state, update));

  const notesSection = el('div', 'goal-notes');
  const notesLbl = el('div', 'form-label-text');
  notesLbl.textContent = 'Notes';
  notesSection.appendChild(notesLbl);
  const notesArea = el('textarea', 'notes-textarea');
  notesArea.placeholder = 'Add notes about your progress\u2026';
  notesArea.value = goal.note || '';
  notesArea.addEventListener('blur', () => {
    const newNote = notesArea.value;
    if (newNote !== (goal.note || '')) {
      update({ ...state, goals: state.goals.map(g => g.id === goal.id ? { ...g, note: newNote } : g) });
    }
  });
  notesSection.appendChild(notesArea);
  card.appendChild(notesSection);

  wrap.appendChild(card);

  shareBtn.addEventListener('click', () => {
    const url = window.location.origin + window.location.pathname + encodeStateToHash(state);
    navigator.clipboard.writeText(url).then(() => {
      shareBtn.textContent = 'Copied!';
      const resetTimer = setTimeout(() => { shareBtn.textContent = 'Copy share link'; }, 2000);
      shareBtn.addEventListener('click', () => clearTimeout(resetTimer), { once: true });
    });
  });

  return wrap;
}

// --- Celebration banner ---

function startConfetti() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText =
    'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999';
  document.body.appendChild(canvas);
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');

  const colors = ['#818cf8', '#f472b6', '#60a5fa', '#10b981', '#f59e0b', '#fb7185', '#a78bfa'];
  const pieces = Array.from({ length: 100 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * -canvas.height * 0.5,
    w: 7 + Math.random() * 8,
    h: 4 + Math.random() * 5,
    color: colors[Math.floor(Math.random() * colors.length)],
    rot: Math.random() * Math.PI * 2,
    speed: 2.5 + Math.random() * 4,
    rotSpeed: (Math.random() - 0.5) * 0.14,
    drift: (Math.random() - 0.5) * 1.8,
  }));

  const endTime = Date.now() + 4000;
  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.y += p.speed;
      p.x += p.drift;
      p.rot += p.rotSpeed;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (Date.now() < endTime) {
      requestAnimationFrame(frame);
    } else {
      canvas.remove();
    }
  }
  requestAnimationFrame(frame);
}

function renderCelebrationBanner(goal, pct, todosDone, onCelebrationDone) {
  const isWin = pct >= 80 || todosDone || goal.finished;
  const banner = el('div', isWin ? 'celebration-banner celebration-banner--win' : 'celebration-banner');
  if (isWin) startConfetti();

  const msg = el('p', 'celebration-msg');
  if (todosDone) {
    msg.textContent = 'All tasks complete! You earned: ' + goal.reward;
  } else if (goal.finished) {
    msg.textContent = 'Target days reached! You earned: ' + goal.reward;
  } else {
    msg.textContent = pct >= 80
      ? 'Goal complete! You earned: ' + goal.reward
      : 'Goal period ended. ' + pct + '% completed.';
  }
  banner.appendChild(msg);

  const note = el('p', 'celebration-note');
  note.textContent = 'This goal will be moved to your archive.';
  banner.appendChild(note);

  const dismissBtn = el('button', 'btn btn-ghost btn-sm');
  dismissBtn.textContent = 'Move to archive \u2192';
  banner.appendChild(dismissBtn);

  let dismissed = false;
  function dismiss() {
    if (dismissed) return;
    dismissed = true;
    onCelebrationDone(goal.id);
  }

  dismissBtn.addEventListener('click', () => dismiss());

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
    const target = effectiveTarget(goal);
    const pct = target > 0 ? Math.min(100, Math.round((logged / target) * 100)) : 0;
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
    const targetLabel = goal.targetDays && goal.targetDays < total ? ' target' : '';
    statsLeft.textContent = logged + ' of ' + target + targetLabel + ' days (' + pct + '%)';
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

    if (goal.note) {
      const notesSection = el('div', 'goal-notes');
      const notesLbl = el('div', 'form-label-text');
      notesLbl.textContent = 'Notes';
      notesSection.appendChild(notesLbl);
      const notesText = el('p', 'notes-readonly');
      notesText.textContent = goal.note;
      notesSection.appendChild(notesText);
      card.appendChild(notesSection);
    }

    const archivedTodos = renderTodos(goal, null, null);
    if (archivedTodos) card.appendChild(archivedTodos);

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
      const entry = getLog(goal, date);

      if (date === today) cell.classList.add('day--today');
      cell.classList.add(inRange ? 'day--in-range' : 'day--outside');

      if (entry?.done) {
        cell.classList.add(entry.loggedOn !== date ? 'day--backdated' : 'day--done');
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
          log.debug('day click:', date, 'goal:', goal.id);
          update({ ...state, goals: state.goals.map(g => g.id === goal.id ? toggleLog(g, date) : g) });
        });
      }

      grid.appendChild(cell);
    });
  });

  calWrap.appendChild(grid);
  return calWrap;
}

// --- Todos section ---

function renderTodos(goal, state, update) {
  const todos = goal.todos ?? [];
  if (todos.length === 0) return null;

  const section = el('div', 'goal-todos');
  const lbl = el('div', 'form-label-text');
  lbl.textContent = 'Checklist';
  section.appendChild(lbl);

  const list = el('ul', 'todo-list');
  todos.forEach(todo => {
    const li = el('li', 'todo-item' + (todo.done ? ' todo-item--done' : ''));

    const checkbox = el('span', 'todo-checkbox' + (todo.done ? ' todo-checkbox--done' : ''));
    if (todo.done) checkbox.textContent = '\u2713';

    const text = el('span', 'todo-text');
    text.textContent = todo.text;

    li.appendChild(checkbox);
    li.appendChild(text);

    if (!todo.done && update) {
      li.addEventListener('click', () => {
        const today = toDateString(new Date());
        const newTodos = todos.map(t => t.id === todo.id ? { ...t, done: true } : t);
        const newGoals = state.goals.map(g => {
          if (g.id !== goal.id) return g;
          const logs = g.logs[today]?.done
            ? g.logs
            : { ...g.logs, [today]: { done: true, loggedOn: today } };
          return { ...g, todos: newTodos, logs };
        });
        update({ ...state, goals: newGoals });
      });
    }

    list.appendChild(li);
  });

  section.appendChild(list);
  return section;
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

function makeTargetField() {
  const label = el('label', 'form-label');
  const span = el('span', 'form-label-text');
  span.textContent = 'Target days';
  const hint = el('span', 'form-label-hint');
  hint.textContent = ' — optional, leave blank for every day';
  span.appendChild(hint);
  const input = el('input', 'form-input');
  input.type = 'number';
  input.name = 'targetDays';
  input.min = '1';
  input.placeholder = 'e.g. 20';
  label.appendChild(span);
  label.appendChild(input);
  return label;
}

function makeTodosField() {
  const container = el('div', 'todos-field');

  const lbl = el('label', 'form-label');
  const span = el('span', 'form-label-text');
  span.textContent = 'Checklist';
  const hint = el('span', 'form-label-hint');
  hint.textContent = ' \u2014 optional';
  span.appendChild(hint);
  lbl.appendChild(span);
  container.appendChild(lbl);

  const inputRow = el('div', 'todo-input-row');
  const input = el('input', 'form-input');
  input.type = 'text';
  input.placeholder = 'Add a checklist item\u2026';
  const addBtn = el('button', 'btn btn-ghost btn-sm todo-add-btn');
  addBtn.type = 'button';
  addBtn.textContent = '+';
  inputRow.appendChild(input);
  inputRow.appendChild(addBtn);
  container.appendChild(inputRow);

  const list = el('ul', 'todo-draft-list');
  container.appendChild(list);

  const items = [];

  function addItem(text) {
    text = text.trim();
    if (!text) return;
    const item = { id: crypto.randomUUID(), text, done: false };
    items.push(item);

    const li = el('li', 'todo-draft-item');
    const itemText = el('span', 'todo-draft-text');
    itemText.textContent = text;
    const removeBtn = el('button', 'todo-draft-remove');
    removeBtn.type = 'button';
    removeBtn.textContent = '\u00D7';
    removeBtn.addEventListener('click', () => {
      items.splice(items.indexOf(item), 1);
      li.remove();
    });
    li.appendChild(itemText);
    li.appendChild(removeBtn);
    list.appendChild(li);

    input.value = '';
    input.focus();
  }

  addBtn.addEventListener('click', () => addItem(input.value));
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem(input.value);
    }
  });

  container.getTodos = () => [...items];
  return container;
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
