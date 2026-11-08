import { JSDOM } from 'jsdom';
import { describe, it, expect, vi } from 'vitest';
import { connectSoloRecording } from '../../js/focus/solo.js';
describe('authenticated solo participation bridge', () => {
  it('emits a local deadline aligned to the accepted server clock', async () => {
    const dom=new JSDOM('<p id="recording-status"></p>');
    const clock=vi.spyOn(Date,'now').mockReturnValue(10000), listener=vi.fn();
    dom.window.document.addEventListener('reps:solo-deadline',listener);
    const bridge=connectSoloRecording(dom.window.document,dom.window,{ensureReady:async()=>{},getUser:()=>({id:'1'}),callSolo:async()=>({state:'running',serverTime:'1970-01-01T00:00:05.000Z',deadline:'1970-01-01T00:01:05.000Z'})},{setIntervalFn:()=>1,clearIntervalFn:()=>{}});
    try { await bridge.sync({id:'a',phase:'focus',status:'running',duration:60000}); expect(listener.mock.calls[0][0].detail).toEqual({id:'a',deadline:70000}); }
    finally {clock.mockRestore();bridge.destroy();}
  });
  it('records lifecycle through the server without sending personal task details', async () => {
    const dom = new JSDOM('<p id="recording-status"></p>');
    const callSolo = vi.fn(async () => ({ totals: { reps: 0, focusedMinutes: 0 } }));
    const groups = { ensureReady: async () => {}, getUser: () => ({ id: '1' }), callSolo };
    const bridge = connectSoloRecording(dom.window.document, dom.window, groups, { setIntervalFn: () => 1, clearIntervalFn: () => {} });
    await bridge.sync({ id: 'a', phase: 'focus', status: 'running', task: 'PRIVATE', duration: 60000 });
    await bridge.sync({ id: 'a', phase: 'focus', status: 'paused', duration: 60000 });
    await bridge.sync({ id: 'a', phase: 'focus', status: 'running', duration: 60000 });
    await bridge.sync({ id: 'a', phase: 'focus', status: 'complete', duration: 60000 });
    expect(callSolo.mock.calls.map(([body]) => body.operation)).toEqual(['start','pause','resume','heartbeat','end']);
    expect(JSON.stringify(callSolo.mock.calls)).not.toContain('PRIVATE'); bridge.destroy();
  });
  it('keeps device focus usable when server recording fails', async () => {
    const dom = new JSDOM('<p id="recording-status"></p>');
    const bridge = connectSoloRecording(dom.window.document, dom.window, { ensureReady: async () => { throw Error('offline'); }, getUser: () => null }, { setIntervalFn: () => 1, clearIntervalFn: () => {} });
    await expect(bridge.sync({ id:'a', phase:'focus', status:'running', duration:60000 })).resolves.toBeUndefined();
    expect(dom.window.document.querySelector('#recording-status').textContent).toContain('device'); bridge.destroy();
  });
});
