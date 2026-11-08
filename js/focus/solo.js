// Server participation is separate from retained device history. No task text is sent.
export function connectSoloRecording(root, win, groups, { setIntervalFn = win.setInterval.bind(win), clearIntervalFn = win.clearInterval.bind(win) } = {}) {
  let tracked = null, latest = null, groupActive = false, pending = Promise.resolve(), destroyed = false;
  const report = message => { const output = root.querySelector('#recording-status'); if (output) output.textContent = message; };
  const send = async body => {
    const result = await groups.callSolo(body);
    if (result.deadline && result.serverTime && result.state === 'running') {
      const remaining = Date.parse(result.deadline) - Date.parse(result.serverTime);
      if (Number.isFinite(remaining) && remaining > 0) root.dispatchEvent(new win.CustomEvent('reps:solo-deadline', { detail: { id: body.clientId, deadline: Date.now() + remaining } }));
    }
    return result;
  };
  function sync(session) {
    latest = session;
    pending = pending.then(async () => {
      if (destroyed || !session) return;
      if (session.phase === 'focus' && ['running','paused'].includes(session.status)) {
        await groups.ensureReady?.();
        if (!groups.getUser()) { tracked = null; return; }
        if (groupActive) { report('Group participation is being recorded. Your device timer still works; overlapping time is not recorded twice.'); return; }
        if (tracked?.id !== session.id) {
          if (tracked) await send({ operation: 'end', clientId: tracked.id });
          await send({ operation: 'start', clientId: session.id, durationMinutes: session.duration / 60000 });
          tracked = { id: session.id, status: 'running' };
          report('Signed-in participation is recorded only while the server can confirm it. Your device totals are retained separately.');
        }
        if (tracked.status !== session.status) {
          await send({ operation: session.status === 'paused' ? 'pause' : 'resume', clientId: tracked.id });
          tracked.status = session.status;
        }
      } else if (tracked) {
        if (session.id === tracked.id && session.status === 'complete') await send({ operation: 'heartbeat', clientId: tracked.id });
        await send({ operation: 'end', clientId: tracked.id }); tracked = null;
      }
    }).catch(() => { report('Server participation could not be confirmed. Your device timer and progress still work; unconfirmed time is not added to group rankings.'); });
    return pending;
  }
  const sessionEvent = event => sync(event.detail.session);
  const accountEvent = () => { if (!groups.getUser()) tracked = null; else if (latest) sync(latest); };
  const groupEvent = event => { groupActive = event.detail.active; };
  root.addEventListener('reps:session', sessionEvent); win.addEventListener('reps:account', accountEvent); win.addEventListener('reps:group-participation', groupEvent);
  const timer = setIntervalFn(() => {
    if (!tracked || tracked.status !== 'running' || groupActive || destroyed) return;
    pending = pending.then(() => send({ operation: 'heartbeat', clientId: tracked.id })).catch(() => report('Connection interrupted. Only server-confirmed participation is recorded; your device timer continues.'));
  }, 15000);
  return { sync, flush: () => pending, destroy: () => { destroyed = true; clearIntervalFn(timer); root.removeEventListener('reps:session', sessionEvent); win.removeEventListener('reps:account', accountEvent); win.removeEventListener('reps:group-participation', groupEvent); } };
}
