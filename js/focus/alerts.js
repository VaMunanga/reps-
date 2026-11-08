export function createAlerts(win, report = () => {}) {
  let audio = null, registration = null;
  const tones = new Set();
  function stopSound() {
    for (const tone of tones) { try { tone.stop(); } catch { /* already ended */ } }
    tones.clear();
  }
  if (win.isSecureContext && win.navigator?.serviceWorker) {
    registration = win.navigator.serviceWorker.register('focus-sw.js').then(() => win.navigator.serviceWorker.ready).catch(() => null);
  }
  async function unlock(enabled) {
    if (!enabled) { stopSound(); return; }
    try {
      const Audio = win.AudioContext ?? win.webkitAudioContext;
      if (!Audio) throw new Error('unsupported');
      audio ??= new Audio();
      if (audio.state === 'suspended') await audio.resume();
      if (audio.state !== 'running') throw new Error('blocked');
    } catch { report('Sound is blocked or unavailable. Try Test alert after enabling sound. Visual alerts still work.'); }
  }
  function chime() {
    try {
      if (audio?.state !== 'running') throw new Error('locked');
      stopSound();
      const time = audio.currentTime;
      // Schedule six gentle pairs on the audio clock: 5.55 seconds overall.
      // Audio scheduling keeps the loop independent of background-tab timers.
      for (let repeat = 0; repeat < 6; repeat++) {
        [523.25, 659.25].forEach((frequency, index) => {
          const start = time + repeat + index * .13;
          const oscillator = audio.createOscillator(), gain = audio.createGain();
          tones.add(oscillator);
          oscillator.onended = () => { tones.delete(oscillator); oscillator.disconnect?.(); gain.disconnect?.(); };
          oscillator.type = 'sine'; oscillator.frequency.value = frequency;
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(.075, start + .025);
          gain.gain.exponentialRampToValueAtTime(.001, start + .4);
          oscillator.connect(gain); gain.connect(audio.destination);
          oscillator.start(start); oscillator.stop(start + .42);
        });
      }
    } catch { report('Sound could not play. The completion message stays on the page.'); }
  }
  async function notify(phase, { sound = false, id = 'test', source } = {}) {
    if (sound) chime();
    if (win.Notification?.permission !== 'granted') return;
    const title = source === 'group' ? phase === 'focus' ? 'Group focus complete' : 'Group break complete' : phase === 'focus' ? 'Rep complete' : 'Break complete';
    const options = { body: source === 'group' ? 'Your shared phase has ended. Credit depends on recorded participation.' : phase === 'focus' ? 'Take a breather. Your break is ready when you are.' : 'Ready for another rep?', tag: `reps-${id}`, icon: 'images/brand/reps-icon.png', data: { url: 'focus.html' } };
    try {
      const worker = await registration;
      if (worker) await worker.showNotification(title, options);
      else new win.Notification(title, options);
    } catch { report('System notification could not be shown. Check browser settings; in-app alerts still work.'); }
  }
  async function enable() {
    if (!win.Notification) return report('System notifications are not supported here. In-app and tab-title alerts still work.');
    if (!win.isSecureContext) return report('System notifications require HTTPS. In-app alerts still work.');
    try {
      const permission = await win.Notification.requestPermission();
      report(permission === 'granted' ? 'Notifications enabled while this page can run. Try Test alert.' : permission === 'denied' ? 'Notifications are blocked. You can change this in browser settings.' : 'Notifications were not enabled. In-app alerts still work.');
    } catch { report('Notifications could not be enabled in this browser.'); }
  }
  return { unlock, notify, enable, stopSound, canSound: () => audio?.state === 'running', playSound: chime, test: async settings => { report('Testing available alert channels. System notifications need permission; sound must be enabled.'); await unlock(settings.sound); await notify('focus', { ...settings, id: 'test' }); } };
}
