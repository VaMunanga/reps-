import { describe, it, expect, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { createLedger } from '../../js/focus/ledger.js';
import { defaultFocusData, FOCUS_STORAGE_KEY } from '../../js/focus/storage.js';

describe('transactional session persistence', () => {
  it('migrates without replacing legacy data and serializes duplicate-tab completions', async () => {
    const legacy = defaultFocusData(); legacy.stats.completedReps = 7; legacy.stats.focusedMinutes = 175;
    const original = JSON.stringify(legacy);
    const win = { indexedDB: new IDBFactory(), localStorage: { getItem: () => original, setItem: () => { throw Error('legacy must stay intact'); } } };
    const first = await createLedger(win), second = await createLedger(win);
    const clock = vi.spyOn(Date, 'now').mockReturnValue(1000);
    try {
      await first.update({ type: 'start', id: 'one', settings: { ...legacy.settings, task: 'Java', focusDuration: 1 } });
      clock.mockReturnValue(62000);
      const completions = await Promise.all([first.update({ type: 'reconcile' }), second.update({ type: 'reconcile' })]);
      expect(completions.filter(result => result.effect)).toHaveLength(1);
      const saved = (await second.read()).record;
      expect(saved.entries).toHaveLength(1); expect(saved.baseline.completedReps).toBe(7);
      expect(saved.session.status).toBe('complete');
      expect((await first.update({ type: 'reconcile' })).effect).toBeNull();
    } finally { clock.mockRestore(); first.close(); second.close(); }
  });
  it('restores paused state after closing and reopening the database', async () => {
    const win = { indexedDB: new IDBFactory(), localStorage: { getItem: () => null } };
    const clock = vi.spyOn(Date, 'now').mockReturnValue(1000);
    let ledger = await createLedger(win);
    try {
      await ledger.update({ type: 'start', id: 'paused', settings: { task: 'Java', focusDuration: 25, breakDuration: 5 } });
      clock.mockReturnValue(2500); await ledger.update({ type: 'pause' }); ledger.close();
      ledger = await createLedger(win); clock.mockReturnValue(9000000);
      const restored = (await ledger.update({ type: 'reconcile' })).record.session;
      expect(restored.status).toBe('paused'); expect(restored.pausedRemaining).toBe(1498500);
    } finally { clock.mockRestore(); ledger.close(); }
  });
  it('retains readable legacy totals when IndexedDB is unavailable', async () => {
    const legacy = defaultFocusData(); legacy.stats.completedReps = 12;
    const ledger = await createLedger({ localStorage: { getItem: () => JSON.stringify(legacy) } });
    expect(ledger.durable).toBe(false); expect((await ledger.read()).record.baseline.completedReps).toBe(12);
  });
});
