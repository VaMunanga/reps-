import { describe, expect, it } from "vitest";
import {
  FOCUS_STORAGE_KEY,
  defaultFocusData,
  loadFocusData,
  saveFocusData,
} from "../../js/focus/storage.js";

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    value: (key) => values.get(key),
  };
}

const monday = new Date("2026-10-12T10:00:00Z");

describe("focus persistence", () => {
  it("returns dated defaults when nothing is stored", () => {
    const data = loadFocusData(memoryStorage(), monday);
    expect(data).toEqual(defaultFocusData(monday));
  });

  it("round trips valid focus data", () => {
    const storage = memoryStorage();
    const data = defaultFocusData(monday);
    data.settings.task = "Database revision";
    data.stats.completedReps = 3;
    saveFocusData(storage, data);

    expect(loadFocusData(storage, monday)).toEqual(data);
  });

  it("recovers from corrupt JSON and stale versions", () => {
    const corrupt = memoryStorage({ [FOCUS_STORAGE_KEY]: "{" });
    const stale = memoryStorage({ [FOCUS_STORAGE_KEY]: JSON.stringify({ version: 0 }) });

    expect(loadFocusData(corrupt, monday)).toEqual(defaultFocusData(monday));
    expect(loadFocusData(stale, monday)).toEqual(defaultFocusData(monday));
  });

  it("resets only the daily total on the next day in the same week", () => {
    const data = defaultFocusData(monday);
    data.stats.daily.minutes = 45;
    data.stats.weekly.minutes = 90;
    const storage = memoryStorage({ [FOCUS_STORAGE_KEY]: JSON.stringify(data) });

    const loaded = loadFocusData(storage, new Date("2026-10-13T10:00:00Z"));
    expect(loaded.stats.daily.minutes).toBe(0);
    expect(loaded.stats.weekly.minutes).toBe(90);
  });

  it("resets daily and weekly totals in a new week", () => {
    const data = defaultFocusData(monday);
    data.stats.daily.minutes = 45;
    data.stats.weekly.minutes = 90;
    const storage = memoryStorage({ [FOCUS_STORAGE_KEY]: JSON.stringify(data) });

    const loaded = loadFocusData(storage, new Date("2026-10-19T10:00:00Z"));
    expect(loaded.stats.daily.minutes).toBe(0);
    expect(loaded.stats.weekly.minutes).toBe(0);
  });
});
