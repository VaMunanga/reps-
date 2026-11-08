import { JSDOM } from 'jsdom';
import { describe, it, expect, vi } from 'vitest';
import { initMusic } from '../../js/focus/music.js';
describe('optional music', () => {
  function setup(loadAPI) {
    const dom = new JSDOM('<div id="focus-extras"></div>', { url: 'https://reps.test/focus.html' });
    const music = initMusic(dom.window.document, dom.window, { loadAPI });
    return { dom, music, root: dom.window.document };
  }
  it('does not contact YouTube until opened and pauses a player when collapsed', async () => {
    const pauseVideo = vi.fn(), playVideo = vi.fn(); let config;
    const loadAPI = vi.fn(async () => ({ Player: class { constructor(_, options) { config = options; } pauseVideo = pauseVideo; playVideo = playVideo; destroy() {} } }));
    const s = setup(loadAPI); expect(loadAPI).not.toHaveBeenCalled();
    const panel = s.root.querySelector('#music-panel'); panel.open = true; panel.dispatchEvent(new s.dom.window.Event('toggle'));
    await s.music.ready(); expect(loadAPI).toHaveBeenCalledOnce(); expect(playVideo).not.toHaveBeenCalled();
    config.events.onReady(); s.root.querySelector('#music-play').click(); expect(playVideo).toHaveBeenCalledOnce();
    panel.open = false; panel.dispatchEvent(new s.dom.window.Event('toggle')); expect(pauseVideo).toHaveBeenCalled();
    s.music.destroy();
  });
  it('shows an external fallback on API failure without throwing', async () => {
    const s = setup(async () => { throw Error('network'); });
    const panel = s.root.querySelector('#music-panel'); panel.open = true; panel.dispatchEvent(new s.dom.window.Event('toggle'));
    await s.music.ready(); expect(s.root.querySelector('#music-status').textContent).toMatch(/could not load/i);
    expect(s.root.querySelector('#music-link').href).toContain('youtube.com/watch'); s.music.destroy();
  });
  it('disables Play after an embedding error and preserves the failure when paused', async () => {
    let config;
    const s = setup(async () => ({ Player: class {
      constructor(_, options) { config = options; }
      pauseVideo() { config.events.onStateChange({ data: 2 }); }
      destroy() {}
    } }));
    const panel = s.root.querySelector('#music-panel'); panel.open = true; panel.dispatchEvent(new s.dom.window.Event('toggle'));
    await s.music.ready(); config.events.onReady(); config.events.onError({ data: 150 });
    expect(s.root.querySelector('#music-play').disabled).toBe(true);
    panel.open = false; panel.dispatchEvent(new s.dom.window.Event('toggle'));
    expect(s.root.querySelector('#music-status').textContent).toMatch(/unavailable|embedded/i);
    s.music.destroy();
  });
});
