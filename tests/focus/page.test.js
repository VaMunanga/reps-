import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { describe, it, expect, vi } from 'vitest';
import { initFocusPage } from '../../js/focus/page.js';
import { initialRecord, applyAction } from '../../js/focus/session.js';
import { projectRoot } from '../helpers/load-page.js';
async function setup(seed, duringRead) {
  const dom = new JSDOM(await readFile(`${projectRoot}/focus.html`, 'utf8'), { url: 'https://reps.test/focus.html' });
  let time = 1000, record = seed ?? initialRecord();
  let subscription;
  const ledger = { durable: true, read: async () => { duringRead?.(dom.window); return { record }; }, update: async action => { const result = applyAction(record, action, time); record = result.record; return result; }, subscribe: listener => { subscription = listener; return () => {}; }, close: () => {} };
  const alerts = { unlock: vi.fn(), notify: vi.fn(), enable: vi.fn(), test: vi.fn() };
  const page = await initFocusPage(dom.window.document, undefined, { ledger, alerts, now: () => time, setIntervalFn: () => 1, clearIntervalFn: () => {} });
  const click = async selector => { dom.window.document.querySelector(selector).click(); await page.flush(); };
  return { dom, page, alerts, click, external: async action => { await ledger.update(action); subscription(); await page.flush(); }, advance: async ms => { time += ms; await page.reconcile(); }, doc: dom.window.document };
}
describe('Focus page', () => {
  it('shows confirmed account progress separately without adding it to device totals or goals', async () => {
    const s = await setup();
    expect(s.doc.querySelector('#account-progress')?.hidden).toBe(true);
    const update = totals => s.dom.window.dispatchEvent(new s.dom.window.CustomEvent('reps:account-totals', { detail: totals }));
    update({ reps: 2, focusedMinutes: 52.5 }); update({ reps: 2, focusedMinutes: 52.5 });
    expect(s.doc.querySelector('#account-progress').hidden).toBe(false);
    expect(s.doc.querySelector('#account-reps').textContent).toBe('2');
    expect(s.doc.querySelector('#account-minutes').textContent).toBe('52.5');
    expect(s.doc.querySelector('#completed-reps').textContent).toBe('0');
    expect(s.doc.querySelector('#focused-minutes').textContent).toBe('0');
    expect(s.doc.querySelector('#daily-progress').value).toBe(0);
    s.dom.window.dispatchEvent(new s.dom.window.CustomEvent('reps:account', { detail: { user: null } }));
    expect(s.doc.querySelector('#account-progress').hidden).toBe(true);
    expect(s.doc.querySelector('#account-reps').textContent).toBe('0');
    s.page.destroy(); update({ reps: 8, focusedMinutes: 200 });
    expect(s.doc.querySelector('#account-progress').hidden).toBe(true);
  });
  it('receives account bootstrap totals while device storage is still loading', async () => {
    const s = await setup(undefined, win => win.dispatchEvent(new win.CustomEvent('reps:account-totals', { detail: { reps: 3, focusedMinutes: 75 } })));
    expect(s.doc.querySelector('#account-reps')?.textContent).toBe('3');
    expect(s.doc.querySelector('#account-progress').hidden).toBe(false); s.page.destroy();
  });
  it('restores an expired rep quietly and credits it without replaying alerts', async () => {
    const seed = applyAction(initialRecord(), { type:'start', id:'expired', settings:{task:'Java', focusDuration:1, breakDuration:1} }, -60000).record;
    const s = await setup(seed);
    expect(s.alerts.notify).not.toHaveBeenCalled();
    expect(s.doc.querySelector('#completed-reps').textContent).toBe('1');
    expect(s.doc.querySelector('#clock').dataset.event).toBeUndefined(); s.page.destroy();
  });
  it('broadcasts remote session transitions to the signed-in recorder', async () => {
    const s = await setup(); s.doc.querySelector('#task').value='Java'; await s.click('#timer-primary');
    const listener = vi.fn(); s.doc.addEventListener('reps:session', listener);
    await s.external({type:'pause'});
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({detail:expect.objectContaining({session:expect.objectContaining({status:'paused'})})}));
    await s.external({type:'resume'});
    expect(listener.mock.calls.at(-1)[0].detail.session.status).toBe('running'); s.page.destroy();
  });
  it('requires an outcome and exposes one primary Start/Pause/Resume control', async () => {
    const s = await setup(); await s.click('#timer-primary');
    expect(s.doc.querySelector('#focus-status').textContent).toContain('concrete outcome');
    s.doc.querySelector('#task').value = 'Practise Java inheritance'; await s.click('#timer-primary');
    expect(s.doc.querySelector('#timer-primary').textContent).toBe('Pause');
    await s.advance(1500); await s.click('#timer-primary');
    expect(s.doc.querySelector('#timer-primary').textContent).toBe('Resume');
    expect(s.doc.querySelector('#clock').dataset.status).toBe('paused');
    expect(s.doc.querySelector('#timer').getAttribute('aria-live')).not.toBe('polite'); s.page.destroy();
  });
  it('holds zero and credits focus once without counting rest', async () => {
    const s = await setup(); s.doc.querySelector('#task').value = 'Java';
    s.doc.querySelector('#focus-duration').value = '1'; s.doc.querySelector('#break-duration').value = '1';
    await s.click('#timer-primary'); await s.advance(61000);
    expect(s.doc.querySelector('#timer').getAttribute('aria-label')).toBe('00:00 remaining');
    expect(s.doc.querySelector('#timer-primary').textContent).toBe('Start break');
    expect(s.doc.querySelector('#completed-reps').textContent).toBe('1');
    await s.advance(10000); expect(s.alerts.notify).toHaveBeenCalledTimes(1);
    await s.click('#timer-primary'); await s.advance(61000);
    expect(s.doc.querySelector('#timer-primary').textContent).toBe('Next rep');
    expect(s.doc.querySelector('#completed-reps').textContent).toBe('1');
    expect(s.doc.title).toContain('Break complete'); s.page.destroy();
  });
  it('never credits an abandoned rep', async () => {
    const s = await setup(); s.doc.querySelector('#task').value = 'Java'; await s.click('#timer-primary');
    await s.advance(10000); await s.click('#timer-end');
    expect(s.doc.querySelector('#timer-primary').textContent).toBe('Start');
    expect(s.doc.querySelector('#completed-reps').textContent).toBe('0'); s.page.destroy();
  });
});
