// modules/goal.js
import * as log from './logger.js';

export function createGoal(title, startDate, endDate, reward) {
  return {
    id: crypto.randomUUID(),
    title,
    startDate,
    endDate,
    reward,
    note: '',
    logs: {},
  };
}

export function toggleLog(goal, date) {
  const today = toDateString(new Date());
  const logs = { ...goal.logs };
  if (logs[date]) {
    log.debug('toggleLog: removing', date, 'from goal', goal.id);
    delete logs[date];
  } else {
    log.debug('toggleLog: adding', date, 'to goal', goal.id, '(loggedOn', today + ')');
    logs[date] = { done: true, loggedOn: today };
  }
  return { ...goal, logs };
}

export function countLoggedDays(goal) {
  return Object.keys(goal.logs).filter(d => goal.logs[d].done).length;
}

export function totalDays(goal) {
  return daysBetween(goal.startDate, goal.endDate) + 1;
}

export function daysIn(goal) {
  const today = toDateString(new Date());
  if (today < goal.startDate) return 0;
  if (today > goal.endDate) return totalDays(goal);
  return daysBetween(goal.startDate, today) + 1;
}

export function daysLeft(goal) {
  const today = toDateString(new Date());
  if (today > goal.endDate) return 0;
  if (today < goal.startDate) return totalDays(goal);
  return daysBetween(today, goal.endDate);
}

export function getLog(goal, date) {
  return goal.logs[date] ?? null;
}

export function toDateString(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function fromDateString(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function daysBetween(a, b) {
  return Math.round((fromDateString(b) - fromDateString(a)) / 86400000);
}

export function addDays(dateStr, n) {
  const d = fromDateString(dateStr);
  d.setDate(d.getDate() + n);
  return toDateString(d);
}

export function calendarDays(goal) {
  const TOTAL = 60;
  // Start ~3 weeks before goal start, anchored to Monday
  const start = fromDateString(addDays(goal.startDate, -21));
  const dow = start.getDay();
  const rollBack = dow === 0 ? 6 : dow - 1;
  start.setDate(start.getDate() - rollBack);
  const startStr = toDateString(start);
  return Array.from({ length: TOTAL }, (_, i) => addDays(startStr, i));
}

/**
 * Count consecutive logged days ending on today or yesterday.
 * Allows today to be unlogged (checks yesterday before breaking).
 * A single missed day (other than today) resets to 0.
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
      // Today not yet logged — check yesterday before giving up
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
  let cur = goal.startDate;
  while (cur <= goal.endDate) {
    const date = cur;
    cur = addDays(cur, 1);
    if (goal.logs[date]?.done) {
      run++;
      if (run > best) best = run;
    } else {
      run = 0;
    }
  }
  return best;
}
