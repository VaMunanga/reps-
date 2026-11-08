// Recorded mix avoids depending on a livestream that can end without an archive.
// Availability/embedding can still change; errors retain an external link.
export const LOFI_VIDEO_ID = '7ccH8u8fj8Y';
let apiPromise;
export function loadYouTubeAPI(win) {
  if (win.YT?.Player) return Promise.resolve(win.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    const script = win.document.createElement('script');
    const previous = win.onYouTubeIframeAPIReady;
    const timeout = win.setTimeout(() => reject(Error('YouTube timed out')), 15000);
    win.onYouTubeIframeAPIReady = () => { win.clearTimeout(timeout); previous?.(); resolve(win.YT); };
    script.src = 'https://www.youtube.com/iframe_api'; script.async = true;
    script.onerror = () => { win.clearTimeout(timeout); reject(Error('YouTube unavailable')); };
    win.document.head.append(script);
  });
  return apiPromise;
}
export function initMusic(root, win, { loadAPI = loadYouTubeAPI } = {}) {
  const host = root.querySelector('#focus-extras'); if (!host) return;
  const panel = root.createElement('details'); panel.id = 'music-panel'; panel.className = 'focus-options';
  panel.innerHTML = `<summary>Music</summary><p class="focus-note">Optional lo-fi from YouTube. Opening this panel connects to YouTube.</p><div class="music-viewport"><div id="music-player"></div></div><button id="music-play" class="quiet-button" type="button" disabled>Play</button><p id="music-status" class="focus-note" role="status">Open to load the player. Music stays off until you press Play.</p><a id="music-link" href="https://www.youtube.com/watch?v=${LOFI_VIDEO_ID}" target="_blank" rel="noopener noreferrer">Open on YouTube</a><p class="focus-note">YouTube may show ads. Background playback depends on your device.</p>`;
  host.append(panel);
  const status = panel.querySelector('#music-status'), play = panel.querySelector('#music-play');
  let player, loading, ready = false, failed = false, timeout, playTimeout;
  function fail(message) { status.textContent = message; }
  function pause() { try { player?.pauseVideo(); } catch { /* not ready */ } win.clearTimeout(playTimeout); }
  async function load() {
    if (loading) return loading;
    status.textContent = 'Loading YouTube…';
    loading = (async () => {
      try {
        const YT = await loadAPI(win);
        player = new YT.Player(panel.querySelector('#music-player'), {
          width: '100%', height: '240', videoId: LOFI_VIDEO_ID,
          playerVars: { autoplay: 0, controls: 1, playsinline: 1, origin: win.location.origin },
          events: {
            onReady: () => { win.clearTimeout(timeout); ready = true; play.disabled = false; status.textContent = 'Ready. Press Play when you want music.'; if (!panel.open) pause(); },
            onError: () => { failed = true; ready = false; play.disabled = true; win.clearTimeout(timeout); pause(); fail('This video is unavailable or cannot be embedded here. Try Open on YouTube.'); },
            onAutoplayBlocked: () => { win.clearTimeout(playTimeout); fail('Playback was blocked. Use the visible YouTube Play control, or Open on YouTube.'); },
            onStateChange: event => {
              if (failed) return;
              if (event.data === 1) { win.clearTimeout(playTimeout); if (!panel.open) pause(); else status.textContent = 'Playing. Collapsing Music pauses playback.'; }
              if (event.data === 2) { win.clearTimeout(playTimeout); status.textContent = 'Music paused.'; }
            },
          },
        });
        timeout = win.setTimeout(() => { if (!ready) fail('The player could not connect. Check your connection or Open on YouTube.'); }, 15000);
      } catch { fail('YouTube could not load. Check your connection or Open on YouTube. Your timer is unaffected.'); }
    })();
    return loading;
  }
  panel.addEventListener('toggle', () => { if (panel.open) load(); else pause(); });
  play.addEventListener('click', () => {
    if (!ready || !panel.open) return;
    try { player.playVideo(); playTimeout = win.setTimeout(() => fail('If playback has not started, use the YouTube Play control or Open on YouTube.'), 6000); }
    catch { fail('Playback could not start. Try the YouTube control or Open on YouTube.'); }
  });
  return { ready: () => loading, destroy: () => { pause(); win.clearTimeout(timeout); player?.destroy?.(); panel.remove(); } };
}
