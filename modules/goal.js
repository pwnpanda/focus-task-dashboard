// modules/goal.js

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
    delete logs[date];
  } else {
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
