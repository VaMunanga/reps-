export function createTimer({
  durationSeconds,
  now = () => Date.now(),
  onTick = () => {},
  onStateChange = () => {},
  onComplete = () => {},
  setIntervalFn = globalThis.setInterval,
  clearIntervalFn = globalThis.clearInterval,
}) {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new RangeError("durationSeconds must be greater than zero");
  }

  const initialDuration = Math.ceil(durationSeconds);
  let status = "idle";
  let remainingSeconds = initialDuration;
  let endsAt = null;
  let intervalId = null;
  let completionSent = false;

  function state() {
    return { status, durationSeconds: initialDuration, remainingSeconds };
  }

  function emit() {
    onTick(remainingSeconds, state());
    onStateChange(state());
  }

  function clearSchedule() {
    if (intervalId !== null) clearIntervalFn(intervalId);
    intervalId = null;
  }

  function reconcile() {
    if (status !== "running") return;
    remainingSeconds = Math.max(0, Math.ceil((endsAt - now()) / 1000));
    if (remainingSeconds === 0) {
      clearSchedule();
      status = "complete";
      emit();
      if (!completionSent) {
        completionSent = true;
        onComplete(state());
      }
      return;
    }
    emit();
  }

  function schedule() {
    if (intervalId === null) intervalId = setIntervalFn(reconcile, 250);
  }

  return {
    start() {
      if (status === "running" || status === "paused") return state();
      if (status === "complete") remainingSeconds = initialDuration;
      completionSent = false;
      status = "running";
      endsAt = now() + remainingSeconds * 1000;
      schedule();
      emit();
      return state();
    },
    pause() {
      if (status !== "running") return state();
      reconcile();
      if (status === "running") {
        clearSchedule();
        status = "paused";
        emit();
      }
      return state();
    },
    resume() {
      if (status !== "paused") return state();
      status = "running";
      endsAt = now() + remainingSeconds * 1000;
      schedule();
      emit();
      return state();
    },
    stop() {
      clearSchedule();
      status = "idle";
      remainingSeconds = initialDuration;
      completionSent = false;
      endsAt = null;
      emit();
      return state();
    },
    getState: state,
  };
}
