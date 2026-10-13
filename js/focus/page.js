import { createTimer } from "./timer.js";
import { loadFocusData, saveFocusData } from "./storage.js";

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function initFocusPage(root = document, storage = globalThis.localStorage) {
  const formElements = {
    task: root.querySelector("#task"), category: root.querySelector("#category"),
    focusDuration: root.querySelector("#focus-duration"), breakDuration: root.querySelector("#break-duration"),
    dailyGoal: root.querySelector("#daily-goal"), weeklyGoal: root.querySelector("#weekly-goal"),
  };
  if (Object.values(formElements).some((element) => !element)) return;

  let data = loadFocusData(storage);
  let timer = null;
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
    controls.start.disabled = timerStatus === "running" || timerStatus === "paused";
    controls.pause.disabled = timerStatus !== "running";
    controls.resume.disabled = timerStatus !== "paused";
    controls.stop.disabled = timerStatus === "idle";
  }

  function storeSettings() {
    data.settings = {
      task: formElements.task.value.trim().slice(0, 120), category: formElements.category.value,
      focusDuration: Number(formElements.focusDuration.value), breakDuration: Number(formElements.breakDuration.value),
      dailyGoal: Number(formElements.dailyGoal.value), weeklyGoal: Number(formElements.weeklyGoal.value),
    };
    saveFocusData(storage, data);
    renderStats();
  }

  Object.entries(formElements).forEach(([key, element]) => {
    element.value = data.settings[key];
    element.addEventListener("change", storeSettings);
  });

  controls.start.addEventListener("click", () => {
    storeSettings();
    timer = createTimer({
      durationSeconds: data.settings.focusDuration * 60,
      onTick: (seconds, state) => { display.textContent = formatTime(seconds); renderControls(state.status); },
      onComplete: () => {
        const minutes = data.settings.focusDuration;
        data.stats.completedReps += 1;
        data.stats.focusedMinutes += minutes;
        data.stats.daily.minutes += minutes;
        data.stats.weekly.minutes += minutes;
        saveFocusData(storage, data);
        renderStats();
        status.textContent = "Focus rep complete. Your progress has been saved on this device.";
      },
    });
    timer.start();
    status.textContent = `Focusing on ${data.settings.task || "your selected task"}.`;
  });
  controls.pause.addEventListener("click", () => { timer?.pause(); status.textContent = "Session paused."; });
  controls.resume.addEventListener("click", () => { timer?.resume(); status.textContent = "Session resumed."; });
  controls.stop.addEventListener("click", () => { timer?.stop(); status.textContent = "Session stopped and reset."; });

  display.textContent = formatTime(data.settings.focusDuration * 60);
  renderStats();
  renderControls();
  status.textContent = "Ready when you are.";
}

if (typeof document !== "undefined") initFocusPage(document);
