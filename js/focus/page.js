import { createTimer } from "./timer.js";
import { loadFocusData, reconcileFocusData, saveFocusData } from "./storage.js";

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function initFocusPage(root = document, storage = globalThis.localStorage, {
  timerFactory = createTimer,
  now = () => new Date(),
} = {}) {
  const formElements = {
    task: root.querySelector("#task"), category: root.querySelector("#category"),
    focusDuration: root.querySelector("#focus-duration"), breakDuration: root.querySelector("#break-duration"),
    dailyGoal: root.querySelector("#daily-goal"), weeklyGoal: root.querySelector("#weekly-goal"),
  };
  if (Object.values(formElements).some((element) => !element)) return;

  let data = loadFocusData(storage);
  let timer = null;
  let nextPhase = "focus";
  let persistenceAvailable = true;
  const display = root.querySelector("#timer");
  const status = root.querySelector("#focus-status");
  const controls = Object.fromEntries([...root.querySelectorAll("[data-timer-action]")].map((button) => [button.dataset.timerAction, button]));

  function renderStats() {
    root.querySelector("#completed-reps").textContent = data.stats.completedReps;
    root.querySelector("#focused-minutes").textContent = data.stats.focusedMinutes;
    const daily = root.querySelector("#daily-progress");
    const weekly = root.querySelector("#weekly-progress");
    daily.max = data.settings.dailyGoal;
    daily.value = Math.min(data.stats.daily.minutes, data.settings.dailyGoal);
    weekly.max = data.settings.weeklyGoal;
    weekly.value = Math.min(data.stats.weekly.minutes, data.settings.weeklyGoal);
  }

  function renderControls(timerStatus = "idle") {
    const active = timerStatus === "running" || timerStatus === "paused";
    controls.start.disabled = active;
    controls.pause.disabled = timerStatus !== "running";
    controls.resume.disabled = timerStatus !== "paused";
    controls.stop.disabled = !active;
  }

  function readSettings({ announce = true } = {}) {
    const settings = {
      task: formElements.task.value.trim().slice(0, 120), category: formElements.category.value,
      focusDuration: Number(formElements.focusDuration.value), breakDuration: Number(formElements.breakDuration.value),
      dailyGoal: Number(formElements.dailyGoal.value), weeklyGoal: Number(formElements.weeklyGoal.value),
    };
    const ranges = {
      focusDuration: [1, 180], breakDuration: [1, 60], dailyGoal: [1, 720], weeklyGoal: [1, 5040],
    };
    let firstInvalid = null;
    Object.entries(ranges).forEach(([key, [minimum, maximum]]) => {
      const field = formElements[key];
      const valid = Number.isInteger(settings[key]) && settings[key] >= minimum && settings[key] <= maximum;
      field.setCustomValidity(valid ? "" : `Enter a whole number from ${minimum} to ${maximum}.`);
      field.toggleAttribute("aria-invalid", !valid);
      if (!valid && !firstInvalid) firstInvalid = field;
    });
    if (firstInvalid) {
      if (announce) {
        status.textContent = "Use valid whole numbers within the shown ranges before starting.";
        firstInvalid.focus();
        firstInvalid.reportValidity?.();
      }
      return null;
    }
    return settings;
  }

  function storeSettings(settings) {
    data.settings = settings;
    persistenceAvailable = saveFocusData(storage, data) && persistenceAvailable;
    renderStats();
    return persistenceAvailable;
  }

  function renderIdlePhase() {
    const minutes = nextPhase === "break" ? data.settings.breakDuration : data.settings.focusDuration;
    display.textContent = formatTime(minutes * 60);
    controls.start.textContent = nextPhase === "break" ? "Start break" : "Start";
    renderControls("idle");
  }

  Object.entries(formElements).forEach(([key, element]) => {
    element.value = data.settings[key];
    element.addEventListener("change", () => {
      const settings = readSettings();
      if (!settings) return;
      storeSettings(settings);
      if (!timer) renderIdlePhase();
      status.textContent = persistenceAvailable ? "Settings saved on this device." : "Settings will remain in this tab because browser storage is unavailable.";
    });
  });

  controls.start.addEventListener("click", () => {
    const settings = readSettings();
    if (!settings) return;
    storeSettings(settings);
    const session = {
      phase: nextPhase,
      durationMinutes: nextPhase === "break" ? settings.breakDuration : settings.focusDuration,
      task: settings.task,
    };
    timer = timerFactory({
      durationSeconds: session.durationMinutes * 60,
      onTick: (seconds, state) => { display.textContent = formatTime(seconds); renderControls(state.status); },
      onComplete: () => {
        timer = null;
        if (session.phase === "focus") {
          data = reconcileFocusData(data, now());
          data.stats.completedReps += 1;
          data.stats.focusedMinutes += session.durationMinutes;
          data.stats.daily.minutes += session.durationMinutes;
          data.stats.weekly.minutes += session.durationMinutes;
          persistenceAvailable = saveFocusData(storage, data) && persistenceAvailable;
          nextPhase = "break";
          status.textContent = persistenceAvailable
            ? `Focus rep complete. Start your ${data.settings.breakDuration}-minute break when ready.`
            : `Focus rep complete. Start your ${data.settings.breakDuration}-minute break when ready. Progress will remain in this tab.`;
        } else {
          nextPhase = "focus";
          status.textContent = "Break complete. Your next focus rep is ready.";
        }
        renderStats();
        renderIdlePhase();
      },
    });
    timer.start();
    renderControls("running");
    status.textContent = session.phase === "break"
      ? `Taking a ${session.durationMinutes}-minute break.`
      : `Focusing on ${session.task || "your selected task"}.${persistenceAvailable ? "" : " Progress will remain in this tab because browser storage is unavailable."}`;
  });
  controls.pause.addEventListener("click", () => { timer?.pause(); status.textContent = "Session paused."; });
  controls.resume.addEventListener("click", () => { timer?.resume(); status.textContent = "Session resumed."; });
  controls.stop.addEventListener("click", () => {
    timer?.stop();
    timer = null;
    nextPhase = "focus";
    renderIdlePhase();
    status.textContent = "Session stopped and reset.";
  });

  root.addEventListener?.("visibilitychange", () => {
    if (root.hidden) return;
    data = reconcileFocusData(data, now());
    persistenceAvailable = saveFocusData(storage, data) && persistenceAvailable;
    renderStats();
  });

  renderStats();
  renderIdlePhase();
  status.textContent = "Ready when you are.";
}

if (typeof document !== "undefined") initFocusPage(document);
