import { describe, expect, it, vi } from "vitest";
import { createTimer } from "../../js/focus/timer.js";

function harness(durationSeconds = 10) {
  let now = 0;
  const intervals = new Set();
  const onComplete = vi.fn();
  const onTick = vi.fn();
  const timer = createTimer({
    durationSeconds,
    now: () => now,
    onComplete,
    onTick,
    setIntervalFn: (callback) => {
      intervals.add(callback);
      return callback;
    },
    clearIntervalFn: (callback) => intervals.delete(callback),
  });

  return {
    timer,
    onComplete,
    onTick,
    activeIntervals: () => intervals.size,
    advance(milliseconds) {
      now += milliseconds;
      [...intervals].forEach((callback) => callback());
    },
  };
}

describe("createTimer", () => {
  it("starts one interval and ignores repeated starts", () => {
    const subject = harness();
    subject.timer.start();
    subject.timer.start();

    expect(subject.timer.getState()).toMatchObject({ status: "running", remainingSeconds: 10 });
    expect(subject.activeIntervals()).toBe(1);
  });

  it("pauses and resumes from elapsed wall time", () => {
    const subject = harness();
    subject.timer.start();
    subject.advance(3200);
    subject.timer.pause();

    expect(subject.timer.getState()).toMatchObject({ status: "paused", remainingSeconds: 7 });
    expect(subject.activeIntervals()).toBe(0);

    subject.advance(5000);
    subject.timer.resume();
    expect(subject.timer.getState()).toMatchObject({ status: "running", remainingSeconds: 7 });
  });

  it("stops and resets the configured duration", () => {
    const subject = harness();
    subject.timer.start();
    subject.advance(4500);
    subject.timer.stop();

    expect(subject.timer.getState()).toEqual({ status: "idle", durationSeconds: 10, remainingSeconds: 10 });
    expect(subject.activeIntervals()).toBe(0);
  });

  it("completes exactly once after a delayed tick", () => {
    const subject = harness(5);
    subject.timer.start();
    subject.advance(9000);
    subject.advance(1000);

    expect(subject.timer.getState()).toMatchObject({ status: "complete", remainingSeconds: 0 });
    expect(subject.onComplete).toHaveBeenCalledTimes(1);
    expect(subject.activeIntervals()).toBe(0);
  });

  it("rejects a non-positive duration", () => {
    expect(() => createTimer({ durationSeconds: 0 })).toThrow(RangeError);
  });
});
