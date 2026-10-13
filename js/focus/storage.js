export const FOCUS_STORAGE_KEY = "reps.focus.v1";
const VERSION = 1;

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function weekKey(date) {
  const start = new Date(date);
  const day = start.getUTCDay();
  start.setUTCDate(start.getUTCDate() - ((day + 6) % 7));
  return dateKey(start);
}

export function defaultFocusData(now = new Date()) {
  return {
    version: VERSION,
    settings: {
      task: "",
      category: "Study",
      focusDuration: 25,
      breakDuration: 5,
      dailyGoal: 60,
      weeklyGoal: 300,
    },
    stats: {
      completedReps: 0,
      focusedMinutes: 0,
      daily: { date: dateKey(now), minutes: 0 },
      weekly: { weekStart: weekKey(now), minutes: 0 },
    },
  };
}

function positiveInteger(value, fallback, maximum) {
  return Number.isInteger(value) && value > 0 && value <= maximum ? value : fallback;
}

function nonNegativeInteger(value, fallback = 0) {
  return Number.isInteger(value) && value >= 0 ? value : fallback;
}

function normalize(candidate, now) {
  const fallback = defaultFocusData(now);
  if (!candidate || candidate.version !== VERSION) return fallback;

  const settings = candidate.settings ?? {};
  const stats = candidate.stats ?? {};
  const normalized = {
    version: VERSION,
    settings: {
      task: typeof settings.task === "string" ? settings.task.slice(0, 120) : "",
      category: ["Study", "Coding", "Projects", "Challenges"].includes(settings.category) ? settings.category : "Study",
      focusDuration: positiveInteger(settings.focusDuration, 25, 180),
      breakDuration: positiveInteger(settings.breakDuration, 5, 60),
      dailyGoal: positiveInteger(settings.dailyGoal, 60, 720),
      weeklyGoal: positiveInteger(settings.weeklyGoal, 300, 5040),
    },
    stats: {
      completedReps: nonNegativeInteger(stats.completedReps),
      focusedMinutes: nonNegativeInteger(stats.focusedMinutes),
      daily: {
        date: typeof stats.daily?.date === "string" ? stats.daily.date : fallback.stats.daily.date,
        minutes: nonNegativeInteger(stats.daily?.minutes),
      },
      weekly: {
        weekStart: typeof stats.weekly?.weekStart === "string" ? stats.weekly.weekStart : fallback.stats.weekly.weekStart,
        minutes: nonNegativeInteger(stats.weekly?.minutes),
      },
    },
  };

  if (normalized.stats.daily.date !== dateKey(now)) {
    normalized.stats.daily = { date: dateKey(now), minutes: 0 };
  }
  if (normalized.stats.weekly.weekStart !== weekKey(now)) {
    normalized.stats.weekly = { weekStart: weekKey(now), minutes: 0 };
  }
  return normalized;
}

export function loadFocusData(storage, now = new Date()) {
  try {
    const stored = storage.getItem(FOCUS_STORAGE_KEY);
    return stored ? normalize(JSON.parse(stored), now) : defaultFocusData(now);
  } catch {
    return defaultFocusData(now);
  }
}

export function saveFocusData(storage, data) {
  storage.setItem(FOCUS_STORAGE_KEY, JSON.stringify(data));
}
