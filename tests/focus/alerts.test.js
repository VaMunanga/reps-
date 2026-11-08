import { describe, it, expect, vi } from 'vitest';
import { createAlerts } from '../../js/focus/alerts.js';
describe('completion alert channels', () => {
  it('repeats the completion chime for at least five seconds and can silence it', async () => {
    const tones = [];
    const alerts = createAlerts({ navigator: {}, AudioContext: class {
      state = 'running'; currentTime = 10;
      createOscillator() { const tone = { frequency: {}, connect() {}, start: vi.fn(), stop: vi.fn() }; tones.push(tone); return tone; }
      createGain() { return { gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
    } });
    await alerts.unlock(true); alerts.playSound();
    expect(tones.length).toBeGreaterThan(2);
    expect(tones.at(-1).stop.mock.calls[0][0] - tones[0].start.mock.calls[0][0]).toBeGreaterThanOrEqual(5);
    expect(tones.at(-1).stop.mock.calls[0][0] - tones[0].start.mock.calls[0][0]).toBeLessThan(6);
    await alerts.unlock(false);
    expect(tones.every(tone => tone.stop.mock.calls.at(-1).length === 0)).toBe(true);
  });
  it('unlocks audio only on interaction and keeps the sound-off path silent', async () => {
    const start=vi.fn(), Audio=vi.fn(function() { this.state='running'; this.currentTime=0; this.createOscillator=()=>({frequency:{},connect(){},start,stop(){}}); this.createGain=()=>({gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}}); });
    const alerts=createAlerts({navigator:{},document:{title:''},AudioContext:Audio});
    await alerts.notify('focus',{sound:false}); expect(Audio).not.toHaveBeenCalled();
    await alerts.unlock(true); expect(alerts.canSound()).toBe(true);
    await alerts.notify('focus',{sound:true}); const count = start.mock.calls.length; expect(count).toBeGreaterThan(2);
    await alerts.notify('break',{sound:false}); expect(start).toHaveBeenCalledTimes(count);
  });
  it('tolerates unsupported browsers without breaking completion', async () => {
    const status = vi.fn(); const alerts = createAlerts({ navigator: {}, document: { title: '' } }, status);
    await expect(alerts.notify('focus', { sound: true })).resolves.toBeUndefined();
    await alerts.enable(); expect(status).toHaveBeenCalledWith(expect.stringMatching(/not supported/i));
  });
  it('asks permission only on Enable and does not send when denied', async () => {
    const Notification = Object.assign(vi.fn(), { permission: 'denied', requestPermission: vi.fn(async () => 'denied') });
    const alerts = createAlerts({ Notification, navigator: {}, isSecureContext: true, document: { title: '' } }, vi.fn());
    await alerts.notify('focus', { sound: false }); expect(Notification.requestPermission).not.toHaveBeenCalled();
    await alerts.enable(); expect(Notification.requestPermission).toHaveBeenCalledOnce(); expect(Notification).not.toHaveBeenCalled();
  });
  it('uses worker notifications and isolates blocked audio', async () => {
    const showNotification = vi.fn(async () => {});
    const Notification = Object.assign(vi.fn(), { permission: 'granted' });
    const alerts = createAlerts({ Notification, navigator: { serviceWorker: { register: async () => ({ showNotification }), ready: Promise.resolve({ showNotification }) } }, isSecureContext: true, document: { title: '' }, AudioContext: class { constructor() { throw Error('blocked'); } } }, vi.fn());
    await alerts.unlock(true); await alerts.notify('break', { sound: true, id: 'a' });
    expect(showNotification).toHaveBeenCalledWith('Break complete', expect.objectContaining({ tag: 'reps-a' }));
  });
});
