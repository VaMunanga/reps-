const glyphs = {
  '0': ['01110','11011','11011','11011','11011','11011','01110'],
  '1': ['00100','01100','00100','00100','00100','00100','01110'],
  '2': ['01110','10001','00001','00010','00100','01000','11111'],
  '3': ['11110','00001','00001','01110','00001','00001','11110'],
  '4': ['00010','00110','01010','10010','11111','00010','00010'],
  '5': ['11111','10000','10000','11110','00001','00001','11110'],
  '6': ['01110','10000','10000','11110','10001','10001','01110'],
  '7': ['11111','00001','00010','00100','01000','01000','01000'],
  '8': ['01110','10001','10001','01110','10001','10001','01110'],
  '9': ['01110','10001','10001','01111','00001','00001','01110'],
  ':': ['0','1','1','0','1','1','0'],
};
export function createClock(root) {
  const output = root.querySelector('#timer'), digits = root.querySelector('#clock-digits');
  let last = '', eventTimeout;
  function draw(seconds, ratio, session, event) {
    const text = `${String(Math.floor(seconds / 60)).padStart(2,'0')}:${String(seconds % 60).padStart(2,'0')}`;
    if (text !== last) {
      // Fixed glyph maps, not user-supplied markup.
      let x = 0;
      digits.innerHTML = [...text].map((character, index) => {
        const width = character === ':' ? 1 : 5;
        const circles = glyphs[character].map((row, y) => [...row].map((on, column) => `<circle cx="${x + column * 3}" cy="${y * 3}" r=".94" opacity="${on === '1' ? 1 : .075}"/>`).join('')).join('');
        x += (width + 2) * 3;
        return `<g class="${last && last[index] !== character ? 'digit-change' : ''}">${circles}</g>`;
      }).join('');
      digits.setAttribute('viewBox', `-2 -2 ${x - 2} 22`);
      output.setAttribute('aria-label', `${text} remaining`);
      last = text;
    }
    const clock = root.querySelector('#clock');
    clock.dataset.status = session?.status ?? 'idle'; clock.dataset.phase = session?.phase ?? 'focus';
    root.querySelector('#clock-ring').style.strokeDashoffset = String(session?.status === 'complete' ? 0 : 100 * (1 - ratio));
    if (session?.status === 'paused') { clearTimeout(eventTimeout); delete clock.dataset.event; }
    if (event) {
      clearTimeout(eventTimeout); clock.dataset.event = event;
      eventTimeout = setTimeout(() => { delete clock.dataset.event; }, event === 'start' ? 600 : 850);
    }
  }
  return { draw, destroy: () => clearTimeout(eventTimeout) };
}
