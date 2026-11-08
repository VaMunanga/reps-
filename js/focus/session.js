import { defaultFocusData, reconcileFocusData } from './storage.js';

export function initialRecord(legacy = defaultFocusData()) {
  return { version: 2, settings: { ...legacy.settings, sound: false, motion: true, reminder: true }, baseline: structuredClone(legacy.stats), session: null, entries: [], alertClaims: [], soundClaims: [], revision: 0 };
}

export function newSession(settings, phase, now, id) {
  const minutes = Number(phase === 'break' ? settings.breakDuration : settings.focusDuration);
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > (phase === 'break' ? 60 : 180)) throw new Error('Choose a valid duration.');
  if (phase === 'focus' && !settings.task?.trim()) throw new Error('Name one concrete outcome before starting.');
  return { id, phase, task: String(settings.task).slice(0, 120), duration: minutes * 60000, breakDuration: Number(settings.breakDuration), status: 'running', startedAt: now, deadline: now + minutes * 60000, pausedRemaining: null };
}

export function remaining(session, now) {
  if (!session || session.status === 'ended') return 0;
  if (session.status === 'complete') return 0;
  return Math.max(0, session.status === 'paused' ? session.pausedRemaining : session.deadline - now);
}

export function transition(session, action, now) {
  if (!session) return null;
  if (session.status === 'running' && remaining(session, now) === 0) return { ...session, status: 'complete', completedAt: session.deadline };
  if (action === 'pause' && session.status === 'running') return { ...session, status: 'paused', pausedRemaining: remaining(session, now), deadline: null };
  if (action === 'resume' && session.status === 'paused') return { ...session, status: 'running', deadline: now + session.pausedRemaining, pausedRemaining: null };
  if (action === 'end' && ['running', 'paused'].includes(session.status)) return { ...session, status: 'ended', deadline: null };
  return session;
}

export function applyAction(source, action, now) {
  const record = structuredClone(source);
  let effect = null;
  const prior = record.session;
  record.session = transition(prior, 'reconcile', now);
  if (record.session?.status === 'complete' && !record.session.alertClaimed) {
    record.session.alertClaimed = true;
    effect = { id: record.session.id, phase: record.session.phase };
    if (record.session.phase === 'focus' && !record.entries.some(entry => entry.id === record.session.id)) {
      record.entries.push({ id: record.session.id, minutes: record.session.duration / 60000, completedAt: record.session.completedAt });
    }
  }
  if (action.type === 'settings') record.settings = { ...record.settings, ...action.settings };
  if (action.type === 'server-deadline' && record.session?.id === action.id && record.session.status === 'running' && Number.isFinite(action.deadline) && action.deadline > now) {
    record.session.deadline = action.deadline;
  }
  if (action.type === 'claim-sound') {
    record.soundClaims ??= [];
    if (!record.soundClaims.includes(action.id)) {
      record.soundClaims.push(action.id);
      effect = { id: action.id, phase: action.phase, source: 'sound' };
    }
  }
  if (action.type === 'claim-alert') {
    record.alertClaims ??= [];
    if (!record.alertClaims.includes(action.id)) {
      record.alertClaims.push(action.id);
      effect = { id: action.id, phase: action.phase, source: 'group' };
    }
  }
  if (action.type === 'start' && !['running', 'paused'].includes(record.session?.status)) {
    record.settings = { ...record.settings, ...action.settings };
    const phase = record.session?.status === 'complete' && record.session.phase === 'focus' ? 'break' : 'focus';
    const settings = phase === 'break' ? { ...record.settings, breakDuration: record.session.breakDuration } : record.settings;
    record.session = newSession(settings, phase, now, action.id);
  } else if (['pause', 'resume', 'end'].includes(action.type)) {
    record.session = transition(record.session, action.type, now);
  }
  record.revision += 1;
  return { record, effect };
}

export function summarize(record, now = new Date()) {
  const original = structuredClone(record.baseline);
  const baseline = reconcileFocusData({ stats: structuredClone(original) }, now).stats;
  const today = now.toDateString();
  const monday = new Date(now); monday.setHours(0, 0, 0, 0); monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const nextMonday = new Date(monday); nextMonday.setDate(nextMonday.getDate() + 7);
  let dailyMinutes = baseline.daily.minutes, weeklyMinutes = baseline.weekly.minutes, dailyReps = 0;
  for (const entry of record.entries) {
    const date = new Date(entry.completedAt);
    if (date.toDateString() === today) { dailyMinutes += entry.minutes; dailyReps++; }
    if (date >= monday && date < nextMonday) weeklyMinutes += entry.minutes;
  }
  return { completedReps: baseline.completedReps + record.entries.length, focusedMinutes: baseline.focusedMinutes + record.entries.reduce((total, entry) => total + entry.minutes, 0), dailyMinutes, weeklyMinutes, dailyReps, dailyRepsIncomplete: original.daily.date === `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}` && original.daily.minutes > 0 };
}
