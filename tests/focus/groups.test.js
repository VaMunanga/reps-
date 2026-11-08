import { JSDOM } from 'jsdom';
import { describe, it, expect } from 'vitest';

const bootstrap = { ok: true, serverTime: '2026-11-08T10:00:00Z', csrf: 'csrf-test', recoveryAvailable: false, user: { id: '1', name: 'Ada', email: 'a@example.test' }, groups: [{ id: 'g1', name: 'Maths', ownerId: '1' }] };
const view = { ok: true, serverTime: '2026-11-08T10:00:00Z', group: { id: 'g1', name: 'Maths', ownerId: '1', timezone: 'Africa/Johannesburg', leaderboardEnabled: false }, membership: { shareProgress: false, showRanking: false }, schedule: { id: 's1', task: 'Algebra', startsAt: '2026-11-08T09:59:00Z', focusMinutes: 25, breakMinutes: 5, rounds: 2 }, template: null, participants: [{ name: 'Ada', state: 'Focusing', focusedMinutes: 1, reps: 0 }], leaderboard: [], me: { state: 'Waiting', participating: false, focusedMinutes: 0, reps: 0 } };
async function setup({ signedIn = true, hash = '', fail = false, handler } = {}) {
  const { initGroups } = await import('../../js/focus/groups.js');
  const dom = new JSDOM('<main><div id="focus-extras"></div></main>', { url: `https://reps.test/focus.html${hash}`, pretendToBeVisual: true });
  const requests = [], timers = new Map(); let nextTimer = 0;
  const fetchFn = async (url, options = {}) => {
    const action = new URL(url, dom.window.location.href).searchParams.get('action');
    requests.push({ action, options, body: options.body ? JSON.parse(options.body) : null });
    if (handler) { const override = await handler(action, options); if (override) return override; }
    if (fail) throw new Error('offline');
    let result = { ok: true, serverTime: bootstrap.serverTime };
    if (action === 'bootstrap') result = { ...bootstrap, user: signedIn ? bootstrap.user : null, groups: signedIn ? bootstrap.groups : [] };
    if (action === 'login' || action === 'register') result = bootstrap;
    if (action === 'group_view') result = view;
    if (action === 'invite_join') result = { ...result, groupId: 'g1' };
    if (action === 'invite_rotate') result = { ...result, inviteToken: 'new-secret' };
    result = { ...result, serverTime: new Date(Date.parse(bootstrap.serverTime) + time - Date.parse('2026-11-08T09:00:00Z')).toISOString() };
    return { ok: true, json: async () => structuredClone(result) };
  };
  let time = Date.parse('2026-11-08T09:00:00Z');
  const ui = initGroups(dom.window.document, dom.window, { fetchFn, now: () => time, setIntervalFn: (fn, ms) => { timers.set(++nextTimer, { fn, ms }); return nextTimer; }, clearIntervalFn: id => timers.delete(id) });
  const doc = dom.window.document;
  const open = async () => { doc.querySelector('#focus-groups').open = true; doc.querySelector('#focus-groups').dispatchEvent(new dom.window.Event('toggle')); await ui.flush(); };
  const click = async selector => { doc.querySelector(selector).click(); await ui.flush(); };
  const submit = async selector => { doc.querySelector(selector).dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })); await ui.flush(); };
  return { ui, doc, requests, timers, open, click, submit, dom, advance: async ms => { time += ms; await [...timers.values()].find(t => t.ms === 1000).fn(); await ui.flush(); } };
}

describe('Study together', () => {
  it.each(['[data-participation=join]', '[data-invite-link]', '[data-group-view] h3'])('keeps shared schedules fresh while %s has focus', async selector => {
    let updated = false;
    const s = await setup({ handler: action => action === 'group_view' && updated ? { ok: true, json: async () => ({ ...structuredClone(view), schedule: { ...view.schedule, task: 'Updated shared outcome' } }) } : null });
    await s.open();
    const focused = s.doc.querySelector(selector); focused.closest('details').open = true; focused.tabIndex = 0; focused.focus();
    expect(s.doc.activeElement).toBe(focused);
    updated = true; await [...s.timers.values()].find(t => t.ms === 20000).fn(); await s.ui.flush();
    expect(s.doc.querySelector('[data-group-view]').textContent).toContain('Updated shared outcome'); s.ui.destroy();
  });
  it('defers group polling while a student edits a field, then refreshes after focus leaves it', async () => {
    const s = await setup(); await s.open();
    const field = s.doc.querySelector('[data-group-schedule] [name=task]'); field.closest('details').open = true; field.focus(); field.value = 'Keep my draft';
    const reads = () => s.requests.filter(request => request.action === 'group_view').length;
    const before = reads();
    await [...s.timers.values()].find(t => t.ms === 20000).fn(); await s.ui.flush();
    expect(reads()).toBe(before); expect(field.value).toBe('Keep my draft');
    field.blur(); await [...s.timers.values()].find(t => t.ms === 20000).fn(); await s.ui.flush();
    expect(reads()).toBe(before + 1); expect(s.doc.querySelector('[data-group-schedule] [name=task]').value).toBe('Keep my draft'); s.ui.destroy();
  });
  it('publishes authoritative aggregate totals from bootstrap and confirmed group participation', async () => {
    const s = await setup({ handler: action => {
      if (action === 'bootstrap') return { ok: true, json: async () => ({ ...bootstrap, accountTotals: { reps: 1, focusedMinutes: 25 } }) };
      if (action === 'participation') return { ok: true, json: async () => ({ ok: true, serverTime: bootstrap.serverTime, accountTotals: { reps: 2, focusedMinutes: 50 } }) };
    } });
    const totals = [];
    s.dom.window.addEventListener('reps:account-totals', event => totals.push(event.detail));
    await s.open(); expect(totals).toEqual([{ reps: 1, focusedMinutes: 25 }]);
    await s.click('[data-participation=join]');
    expect(totals.at(-1)).toEqual({ reps: 2, focusedMinutes: 50 }); s.ui.destroy();
  });
  it('ignores a previous account\'s delayed totals after sign-out', async () => {
    let finishHeartbeat;
    const s = await setup({ handler: action => {
      if (action === 'solo') return new Promise(resolve => { finishHeartbeat = () => resolve({ ok: true, json: async () => ({ ok: true, accountTotals: { reps: 9, focusedMinutes: 225 } }) }); });
      if (action === 'logout') return { ok: true, json: async () => ({ ...bootstrap, user: null, groups: [] }) };
    } });
    await s.open(); const totals = [];
    s.dom.window.addEventListener('reps:account-totals', event => totals.push(event.detail));
    const heartbeat = s.ui.callSolo({ operation: 'heartbeat', clientId: 'old-account-session' });
    await s.click('[data-auth-logout]'); finishHeartbeat(); await heartbeat;
    expect(totals).toEqual([]); s.ui.destroy();
  });
  it('loads on opening and derives shared time from server offset without touching the personal timer', async () => {
    const s = await setup(); expect(s.requests).toHaveLength(0); await s.open();
    expect(s.doc.querySelector('[data-group-countdown]').textContent).toContain('24:00');
    expect(s.doc.querySelector('[data-group-timezone]').textContent).toContain('Africa/Johannesburg');
    expect(s.doc.querySelector('[data-group-participants]').textContent).toContain('Ada');
    expect(s.doc.querySelector('[data-group-ranking]').textContent).toContain('disabled'); s.ui.destroy();
  });
  it('sends explicit consent and participation with CSRF, heartbeating only while personally active', async () => {
    const s = await setup(); await s.open();
    s.doc.querySelector('[name=shareProgress]').checked = true; await s.submit('[data-group-preferences]');
    expect(s.requests.find(r => r.action === 'group_preferences').body).toMatchObject({ shareProgress: true, showRanking: false });
    await s.click('[data-participation=join]');
    const heartbeat = [...s.timers.values()].find(t => t.ms === 15000); expect(heartbeat).toBeTruthy();
    await heartbeat.fn(); await s.ui.flush();
    expect(s.requests.filter(r => r.action === 'participation').map(r => r.body.operation)).toEqual(['join', 'heartbeat']);
    expect(s.requests.find(r => r.action === 'participation').options.headers['X-CSRF-Token']).toBe('csrf-test');
    await s.click('[data-participation=pause]');
    expect([...s.timers.values()].filter(t => t.ms === 15000)).toHaveLength(0);
    expect(s.doc.querySelector('[data-group-countdown]').textContent).toContain('24:00'); s.ui.destroy();
  });
  it('requires authentication then explicit fragment invitation acceptance and removes the secret from the URL', async () => {
    const s = await setup({ signedIn: false, hash: '#invite=secret-token' }); await s.open();
    expect(s.requests.some(r => r.action === 'invite_join')).toBe(false);
    s.doc.querySelector('[data-auth-login] [name=email]').value = 'a@example.test';
    s.doc.querySelector('[data-auth-login] [name=password]').value = 'long-password'; await s.submit('[data-auth-login]');
    await s.click('[data-invite-accept]');
    expect(s.requests.find(r => r.action === 'invite_join').body.token).toBe('secret-token');
    expect(s.dom.window.location.hash).toBe(''); s.ui.destroy();
  });
  it('exposes owner rotation and accurate unavailable recovery/offline messages', async () => {
    const s = await setup(); await s.open(); await s.click('[data-invite-rotate]');
    expect(s.doc.querySelector('[data-invite-link]').value).toBe('https://reps.test/focus.html#invite=new-secret'); s.ui.destroy();
    const anonymous = await setup({ signedIn: false }); await anonymous.open();
    expect(anonymous.doc.querySelector('[data-recovery-status]').textContent).toContain('not configured'); anonymous.ui.destroy();
    const offline = await setup({ fail: true }); await offline.open();
    expect(offline.doc.querySelector('[data-group-status]').textContent).toContain('unavailable'); offline.ui.destroy();
  });
  it('stops confirmation after connection loss and offers an explicit resume', async () => {
    const s = await setup({ handler: (action, options) => action === 'participation' && JSON.parse(options.body).operation === 'heartbeat' ? Promise.reject(new Error('offline')) : null });
    await s.open(); await s.click('[data-participation=join]');
    await [...s.timers.values()].find(t => t.ms === 15000).fn(); await s.ui.flush();
    expect([...s.timers.values()].some(t => t.ms === 15000)).toBe(false);
    expect(s.doc.querySelector('[data-participation=resume]')).not.toBeNull();
    expect(s.doc.querySelector('[data-group-status]').textContent).toContain('unavailable'); s.ui.destroy();
  });
  it('sends an owner schedule with UTC start and explicit template selection', async () => {
    const s = await setup(); await s.open(); const form = s.doc.querySelector('[data-group-schedule]');
    form.elements.task.value = 'Solve five exercises'; form.elements.startsAt.value = '2026-11-09T12:00';
    form.elements.focusMinutes.value = '50'; form.elements.breakMinutes.value = '10'; form.elements.rounds.value = '3'; form.elements.saveTemplate.checked = true;
    await s.submit('[data-group-schedule]');
    expect(s.requests.find(r => r.action === 'group_schedule').body).toEqual({ groupId: 'g1', task: 'Solve five exercises', startsAt: new Date(2026, 10, 9, 12).toISOString(), focusMinutes: 50, breakMinutes: 10, rounds: 3, saveTemplate: true }); s.ui.destroy();
  });
  it('finishes at the last focus boundary without inventing a trailing break', async () => {
    const s = await setup({ handler: action => action === 'group_view' ? { ok: true, json: async () => ({ ...structuredClone(view), serverTime: '2026-11-08T10:54:00Z' }) } : null });
    await s.open(); expect(s.doc.querySelector('[data-group-countdown]').textContent).toContain('Finished'); s.ui.destroy();
  });
  it('provides account and participation lifecycle events plus CSRF-protected solo bridge', async () => {
    const s = await setup(); let user, participation;
    s.dom.window.addEventListener('reps:account', event => { user = event.detail.user; });
    s.dom.window.addEventListener('reps:group-participation', event => { participation = event.detail.active; });
    await s.open(); expect(user.id).toBe('1');
    await s.click('[data-participation=join]'); expect(participation).toBe(true);
    await s.ui.callSolo({ operation: 'start', clientId: 'solo1', durationMinutes: 25 });
    expect(s.requests.find(r => r.action === 'solo').options.headers['X-CSRF-Token']).toBe('csrf-test');
    expect(s.ui.getCsrf()).toBe('csrf-test'); s.ui.destroy();
  });
  it('can lazily prepare the solo account bridge without opening the group panel', async () => {
    const s = await setup(); await s.ui.ensureReady(); await s.ui.ensureReady();
    expect(s.ui.getUser().id).toBe('1'); expect(s.doc.querySelector('#focus-groups').open).toBe(false);
    expect(s.requests.filter(r => r.action === 'bootstrap')).toHaveLength(1); s.ui.destroy();
  });
  it('does not silently resume confirmations after a failed heartbeat when a poll reports an active server session', async () => {
    let heartbeatFailed = false;
    const s = await setup({ handler: (action, options) => {
      if (action === 'participation' && JSON.parse(options.body).operation === 'heartbeat') { heartbeatFailed = true; throw new Error('offline'); }
      if (action === 'group_view' && heartbeatFailed) return { ok: true, json: async () => ({ ...structuredClone(view), me: { ...view.me, participating: true, state: 'Focusing' } }) };
    } });
    await s.open(); await s.click('[data-participation=join]'); await [...s.timers.values()].find(t => t.ms === 15000).fn(); await s.ui.flush();
    await [...s.timers.values()].find(t => t.ms === 20000).fn(); await s.ui.flush();
    expect([...s.timers.values()].some(t => t.ms === 15000)).toBe(false);
    expect(s.doc.querySelector('[data-participation=resume]')).not.toBeNull(); s.ui.destroy();
  });
  it('keeps the owner’s unsaved schedule and fresh invite accessible during polling', async () => {
    const s = await setup(); await s.open(); await s.click('[data-invite-rotate]');
    const form = s.doc.querySelector('[data-group-schedule]'); form.closest('details').open = true;
    form.elements.task.value = 'My draft outcome';
    await [...s.timers.values()].find(t => t.ms === 20000).fn(); await s.ui.flush();
    expect(s.doc.querySelector('[data-group-schedule]').elements.task.value).toBe('My draft outcome');
    expect(s.doc.querySelector('[data-group-schedule]').closest('details').open).toBe(true);
    expect(s.doc.querySelector('[data-invite-link]').value).toContain('#invite=new-secret'); s.ui.destroy();
  });
  it('announces and emits shared phase endings once while participating without claiming a rep', async () => {
    const s = await setup(), events = [];
    s.dom.window.addEventListener('reps:group-complete', event => events.push(event.detail));
    await s.open(); expect(events).toEqual([]); await s.click('[data-participation=join]');
    await s.advance(24 * 60000);
    expect(events).toEqual([{ id: 'group-s1-1-focus', phase: 'focus' }]);
    expect(s.doc.querySelector('[data-group-phase]').textContent).toContain('Shared focus finished');
    expect(s.doc.querySelector('[data-group-countdown]').getAttribute('aria-live')).toBe('off');
    await s.advance(1000); expect(events).toHaveLength(1);
    expect(s.doc.querySelector('[data-group-phase]').textContent).toContain('Shared focus finished');
    await s.advance(299000); expect(events[1]).toEqual({ id: 'group-s1-1-break', phase: 'break' });
    await s.advance(25 * 60000); expect(events[2]).toEqual({ id: 'group-s1-2-focus', phase: 'focus' });
    expect(s.requests.filter(r => r.action === 'participation' && r.body.operation === 'heartbeat')).toHaveLength(3);
    expect(s.doc.querySelector('[data-group-countdown]').textContent).toContain('Finished'); s.ui.destroy();
  });
  it('does not replay a group completion on initial restore or while paused', async () => {
    const s = await setup(), events = [];
    s.dom.window.addEventListener('reps:group-complete', event => events.push(event.detail));
    await s.open(); await s.click('[data-participation=join]'); await s.click('[data-participation=pause]');
    await s.advance(24 * 60000); expect(events).toEqual([]); s.ui.destroy();
    const anonymous = await setup({ signedIn: false }); await anonymous.open();
    expect(anonymous.doc.querySelector('[data-auth-register] [name=password]').minLength).toBe(12); anonymous.ui.destroy();
  });
  it('observes a final boundary before a poll marks the participant finished', async () => {
    let finished = false;
    const s = await setup({ handler: action => action === 'group_view' && finished ? { ok: true, json: async () => ({ ...structuredClone(view), serverTime: '2026-11-08T10:54:00Z', me: { ...view.me, state: 'Finished', participating: false } }) } : null });
    const events = []; s.dom.window.addEventListener('reps:group-complete', event => events.push(event.detail));
    await s.open(); await s.click('[data-participation=join]'); finished = true;
    await [...s.timers.values()].find(t => t.ms === 20000).fn(); await s.ui.flush();
    expect(events).toEqual([{ id: 'group-s1-2-focus', phase: 'focus' }]);
    expect(s.doc.querySelector('[data-group-phase]').textContent).toContain('Shared focus finished'); s.ui.destroy();
  });
});
