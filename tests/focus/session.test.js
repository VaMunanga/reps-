import { describe, it, expect } from 'vitest';
import { newSession, transition, remaining, applyAction, initialRecord, summarize } from '../../js/focus/session.js';
import { defaultFocusData } from '../../js/focus/storage.js';

describe('durable Focus session', () => {
  it('lets an audio-ready tab claim sound separately from the system notification winner', () => {
    let record=applyAction(initialRecord(),{type:'start',id:'audio',settings:{task:'Java',focusDuration:1,breakDuration:1}},0).record;
    record=applyAction(record,{type:'reconcile'},60001).record;
    const sound=applyAction(record,{type:'claim-sound',id:'audio',phase:'focus'},60002);
    expect(sound.effect).toEqual({id:'audio',phase:'focus',source:'sound'});
    expect(applyAction(sound.record,{type:'claim-sound',id:'audio',phase:'focus'},60003).effect).toBeNull();
  });
  it('aligns a signed-in running session to its server deadline without changing a paused session', () => {
    let record=applyAction(initialRecord(),{type:'start',id:'server',settings:{task:'Java',focusDuration:1,breakDuration:1}},0).record;
    record=applyAction(record,{type:'server-deadline',id:'server',deadline:65000},5000).record;
    expect(record.session.deadline).toBe(65000);
    record=applyAction(record,{type:'pause'},6000).record;
    const paused=applyAction(record,{type:'server-deadline',id:'server',deadline:68000},7000).record;
    expect(paused.session.pausedRemaining).toBe(59000);
    expect(paused.session.status).toBe('paused');
  });
  it('claims a shared phase alert once without awarding an ineligible rep', () => {
    const first = applyAction(initialRecord(), { type: 'claim-alert', id: 'group-1-0-focus', phase: 'focus' }, 1000);
    expect(first.effect).toEqual({ id: 'group-1-0-focus', phase: 'focus', source: 'group' });
    expect(first.record.entries).toHaveLength(0);
    expect(applyAction(first.record, { type: 'claim-alert', id: 'group-1-0-focus', phase: 'focus' }, 2000).effect).toBeNull();
  });
  it('restores a persisted deadline and paused millisecond remainder without drift', () => {
    let session = newSession({ task: 'Practise inheritance', focusDuration: 25, breakDuration: 5 }, 'focus', 1000, 'rep-a');
    session = transition(session, 'pause', 2250);
    expect(remaining(session, 900000)).toBe(1498750);
    session = transition(JSON.parse(JSON.stringify(session)), 'resume', 10000);
    expect(remaining(session, 11000)).toBe(1497750);
    expect(session.deadline).toBe(1508750);
  });
  it('credits a completed focus once across repeat reconciliation and never credits a break or abandonment', () => {
    let record = initialRecord(defaultFocusData(new Date(0)));
    record = applyAction(record, { type: 'start', id: 'rep-a', settings: { task: 'Java', focusDuration: 1, breakDuration: 1 } }, 1000).record;
    const first = applyAction(record, { type: 'reconcile' }, 70000);
    expect(first.effect.phase).toBe('focus');
    expect(first.record.session.status).toBe('complete');
    expect(summarize(first.record, new Date(70000)).completedReps).toBe(1);
    expect(applyAction(first.record, { type: 'reconcile' }, 80000).effect).toBeNull();
    record = applyAction(first.record, { type: 'start', id: 'break-a', settings: first.record.settings }, 80000).record;
    record = applyAction(record, { type: 'reconcile' }, 150000).record;
    expect(summarize(record, new Date(150000)).completedReps).toBe(1);
    record = applyAction(record, { type: 'start', id: 'rep-b', settings: record.settings }, 160000).record;
    record = applyAction(record, { type: 'end' }, 161000).record;
    expect(summarize(record, new Date(161000)).completedReps).toBe(1);
  });
  it('retains legacy totals and attributes sleeping completion to its deadline day', () => {
    const start = new Date(2026, 10, 8, 23, 58).getTime();
    const legacy = defaultFocusData(new Date(start));
    legacy.stats.completedReps = 9;
    legacy.stats.focusedMinutes = 225;
    legacy.stats.daily.minutes = 25;
    let record = initialRecord(legacy);
    record = applyAction(record, { type: 'start', id: 'night', settings: { ...legacy.settings, task: 'Java', focusDuration: 1 } }, start).record;
    record = applyAction(record, { type: 'reconcile' }, start + 3600000).record;
    const summary = summarize(record, new Date(start + 3600000));
    expect(summary.completedReps).toBe(10);
    expect(summary.focusedMinutes).toBe(226);
    expect(summary.dailyMinutes).toBe(0);
    expect(summary.dailyReps).toBe(0);
  });
});
