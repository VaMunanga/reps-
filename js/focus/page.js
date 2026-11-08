import { createLedger } from './ledger.js';
import { remaining, summarize } from './session.js';
import { createClock } from './clock.js';
import { createAlerts } from './alerts.js';
import { initMusic } from './music.js';
import { initGroups } from './groups.js';
import { connectSoloRecording } from './solo.js';

export async function initFocusPage(root = document, _storage, options = {}) {
  if (!root.querySelector('#clock')) return;
  const win = root.defaultView ?? window, now = options.now ?? Date.now;
  const $ = selector => root.querySelector(selector);
  // Subscribe before awaiting device storage so an early account bootstrap is retained.
  const accountTotals = event => {
    const totals = event.detail;
    if (!Number.isInteger(totals?.reps) || totals.reps < 0 || !Number.isFinite(totals.focusedMinutes) || totals.focusedMinutes < 0) return;
    $('#account-reps').textContent = totals.reps;
    $('#account-minutes').textContent = totals.focusedMinutes;
    $('#account-progress').hidden = false;
  };
  const accountChanged = event => {
    if (event.detail.user) return;
    $('#account-progress').hidden = true;
    $('#account-reps').textContent = '0'; $('#account-minutes').textContent = '0';
  };
  win.addEventListener('reps:account-totals', accountTotals);
  win.addEventListener('reps:account', accountChanged);
  const ledger = options.ledger ?? await createLedger(win);
  const clock = createClock(root);
  const alerts = options.alerts ?? createAlerts(win, message => { $('#alert-status').textContent = message; });
  const fields = { task: '#task', category: '#category', focusDuration: '#focus-duration', breakDuration: '#break-duration', dailyGoal: '#daily-goal', weeklyGoal: '#weekly-goal', sound: '#sound', motion: '#motion', reminder: '#reminder' };
  let record = (await ledger.read()).record, queue = Promise.resolve(), destroyed = false, lastPhase = '', startCaptionUntil = 0, groupTitle = '', restoring = true;
  const soundAttempted = new Set();
  const baseTitle = 'Focus Tool | REPS Student Club';
  function attemptSound(id, phase) {
    if (restoring || !record.settings.sound || !alerts.canSound?.() || soundAttempted.has(id) || record.soundClaims?.includes(id)) return;
    soundAttempted.add(id);
    dispatch({ type: 'claim-sound', id, phase });
  }
  function hydrate() {
    for (const [key, selector] of Object.entries(fields)) {
      const field = $(selector);
      if (field.type === 'checkbox') field.checked = record.settings[key];
      else if (root.activeElement !== field) field.value = record.settings[key];
    }
  }
  function settings() {
    const result = {};
    for (const [key, selector] of Object.entries(fields)) {
      const field = $(selector);
      result[key] = field.type === 'checkbox' ? field.checked : field.type === 'number' ? Number(field.value) : field.value.trim();
      if (field.type === 'number' && (!Number.isInteger(result[key]) || !field.checkValidity())) { field.focus(); throw new Error(`Enter a whole number from ${field.min} to ${field.max} for ${field.previousElementSibling?.textContent.toLowerCase()}.`); }
    }
    return result;
  }
  function paint(event) {
    const session = record.session, active = ['running', 'paused'].includes(session?.status);
    const complete = session?.status === 'complete';
    const seconds = session && session.status !== 'ended' ? Math.ceil(remaining(session, now()) / 1000) : record.settings.focusDuration * 60;
    clock.draw(seconds, session && session.status !== 'ended' ? remaining(session, now()) / session.duration : 1, session, event);
    const primary = $('#timer-primary'); primary.disabled = false;
    primary.textContent = session?.status === 'running' ? 'Pause' : session?.status === 'paused' ? 'Resume' : complete ? session.phase === 'focus' ? 'Start break' : 'Next rep' : 'Start';
    $('#timer-end').disabled = !active;
    $('#task').disabled = active;
    $('#current-task').hidden = !active; $('#current-task').textContent = active ? session.task : '';
    const caption = session?.status === 'paused' ? 'Paused' : complete ? session.phase === 'focus' ? 'Rep complete. Take a breather.' : 'Ready for another rep?' : active ? session.phase === 'break' ? 'Take a breather.' : 'One task. You’ve got this.' : 'Ready when you are.';
    if (event === 'start' && session.phase === 'focus') startCaptionUntil = now() + 1400;
    if (!active || session.status === 'paused') startCaptionUntil = 0;
    $('#clock-caption').textContent = active && session.status === 'running' && session.phase === 'focus' && now() < startCaptionUntil ? 'Let’s put in a rep' : caption;
    const phaseKey = `${session?.id}:${session?.status}`;
    if (phaseKey !== lastPhase) { $('#focus-status').textContent = caption; lastPhase = phaseKey; }
    root.title = !active && groupTitle ? groupTitle : complete ? `${session.phase === 'focus' ? 'Rep complete' : 'Break complete'} · REPS` : active ? `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')} · ${session.status === 'paused' ? 'Paused' : session.phase === 'focus' ? 'Focus' : 'Rest'} · REPS` : baseTitle;
    const stats = summarize(record, new Date(now()));
    $('#completed-reps').textContent = stats.completedReps; $('#focused-minutes').textContent = stats.focusedMinutes;
    $('#today-summary').textContent = `Today: ${stats.dailyRepsIncomplete ? 'at least ' : ''}${stats.dailyReps} ${stats.dailyReps === 1 ? 'rep' : 'reps'} · ${stats.dailyMinutes} focused minutes`;
    if (stats.dailyRepsIncomplete) $('#today-summary').title = 'Earlier progress stored minutes but no daily rep count. Existing totals are retained.';
    for (const [period, value] of [['daily', stats.dailyMinutes], ['weekly', stats.weeklyMinutes]]) {
      const progress = $(`#${period}-progress`); progress.max = record.settings[`${period}Goal`]; progress.value = Math.min(value, progress.max); progress.textContent = `${value} / ${progress.max}`; progress.setAttribute('aria-label', `${period === 'daily' ? 'Today' : 'This week'}: ${value} of ${progress.max} focused minutes`);
    }
    $('.focus-workspace').dataset.motion = record.settings.motion ? 'on' : 'off';
    $('.focus-workspace').dataset.hidden = String(root.hidden);
    $('#settling-reminder').hidden = !record.settings.reminder;
    for (const button of root.querySelectorAll('[data-preset]')) button.setAttribute('aria-pressed', String(button.dataset.preset === `${record.settings.focusDuration},${record.settings.breakDuration}`));
    if (complete) attemptSound(session.id, session.phase);
  }
  function dispatch(action, { animate = false, hydrateFields = false } = {}) {
    queue = queue.then(async () => {
      if (destroyed) return;
      const result = await ledger.update(action);
      record = result.record;
      if (hydrateFields) hydrate();
      paint(result.effect && animate ? 'complete' : animate && action.type === 'start' ? 'start' : undefined);
      if (result.effect?.source === 'sound') alerts.playSound?.();
      else if (result.effect) {
        if (!action.quiet) Promise.resolve(alerts.notify(result.effect.phase, { sound: false, id: result.effect.id, source: result.effect.source })).catch(() => {});
        if (result.effect.source !== 'group') root.dispatchEvent(new win.CustomEvent('reps:session', { detail: { session: record.session } }));
      } else if (!['reconcile','settings','claim-alert','claim-sound','server-deadline'].includes(action.type)) root.dispatchEvent(new win.CustomEvent('reps:session', { detail: { session: record.session } }));
    }).catch(error => { $('#focus-status').textContent = error.message || 'Could not update this session. Try again.'; });
    return queue;
  }
  $('#timer-primary').addEventListener('click', () => {
    alerts.stopSound?.();
    groupTitle = '';
    // Audio unlocking is invoked synchronously from the gesture before storage awaits.
    alerts.unlock($('#sound').checked);
    const status = record.session?.status;
    if (status === 'running' || status === 'paused') dispatch({ type: status === 'running' ? 'pause' : 'resume' }, { animate: false });
    else {
      try { dispatch({ type: 'start', id: win.crypto?.randomUUID?.() ?? `${now()}-${Math.random()}`, settings: settings() }, { animate: true }); }
      catch (error) { $('#focus-status').textContent = error.message; }
    }
  });
  $('#timer-end').addEventListener('click', () => dispatch({ type: 'end' }));
  for (const selector of Object.values(fields)) $(selector).addEventListener('change', () => {
    if (selector === '#sound') alerts.unlock($('#sound').checked);
    try { dispatch({ type: 'settings', settings: settings() }); } catch (error) { $('#focus-status').textContent = error.message; }
  });
  for (const button of root.querySelectorAll('[data-preset]')) button.addEventListener('click', () => {
    const [focus, rest] = button.dataset.preset.split(','); $('#focus-duration').value = focus; $('#break-duration').value = rest;
    dispatch({ type: 'settings', settings: settings() });
  });
  $('#enable-notifications').addEventListener('click', () => alerts.enable());
  $('#test-alert').addEventListener('click', () => alerts.test({ sound: $('#sound').checked }));
  const groupComplete = event => {
    groupTitle = `${event.detail.phase === 'focus' ? 'Group focus complete' : 'Group break complete'} · REPS`;
    dispatch({ type: 'claim-alert', ...event.detail });
    attemptSound(event.detail.id, event.detail.phase);
  };
  win.addEventListener('reps:group-complete', groupComplete);
  const serverDeadline = event => dispatch({ type: 'server-deadline', ...event.detail });
  root.addEventListener('reps:solo-deadline', serverDeadline);
  const visible = () => { $('.focus-workspace').dataset.hidden = String(root.hidden); if (!root.hidden) dispatch({ type: 'reconcile' }); };
  root.addEventListener('visibilitychange', visible); win.addEventListener('pageshow', visible);
  const unsubscribe = ledger.subscribe(() => { queue = queue.then(async () => {
    const before = `${record.session?.id}:${record.session?.status}`;
    record = (await ledger.read()).record; hydrate(); paint();
    if (`${record.session?.id}:${record.session?.status}` !== before) root.dispatchEvent(new win.CustomEvent('reps:session', { detail: { session: record.session } }));
  }).catch(() => {}); });
  hydrate();
  if (!ledger.durable) $('#storage-status').textContent = 'Browser storage is unavailable. This session and new progress remain in this tab; refresh recovery and duplicate-tab protection are unavailable.';
  await dispatch({ type: 'reconcile', quiet: true }); // Restore without replaying alerts or celebrations.
  // Suppress only this restored tab: another live, audio-ready tab may still chime.
  if (record.session?.status === 'complete') soundAttempted.add(record.session.id);
  restoring = false;
  const interval = (options.setIntervalFn ?? win.setInterval.bind(win))(() => {
    if (destroyed) return;
    if (record.session?.status === 'running' && remaining(record.session, now()) === 0) dispatch({ type: 'reconcile' }, { animate: !root.hidden });
    else paint();
  }, 250);
  return { flush: () => queue, reconcile: () => dispatch({ type: 'reconcile' }, { animate: !root.hidden }), getRecord: () => record, destroy: () => { destroyed = true; (options.clearIntervalFn ?? win.clearInterval.bind(win))(interval); clock.destroy(); unsubscribe(); ledger.close(); root.removeEventListener('visibilitychange', visible); win.removeEventListener('pageshow', visible); win.removeEventListener('reps:group-complete', groupComplete); root.removeEventListener('reps:solo-deadline', serverDeadline); win.removeEventListener('reps:account-totals', accountTotals); win.removeEventListener('reps:account', accountChanged); } };
}

if (typeof document !== 'undefined') {
  initMusic(document, window);
  const groups = initGroups(document, window);
  const recording = connectSoloRecording(document, window, groups);
  initFocusPage(document).then(page => { if (page) recording.sync(page.getRecord().session); }).catch(() => { const status = document.querySelector('#focus-status'); if (status) status.textContent = 'Could not prepare the timer. Refresh to retry; existing progress is unchanged.'; });
}
