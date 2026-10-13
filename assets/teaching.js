document.querySelectorAll('[data-quiz]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const selected = form.querySelector('input:checked');
    const feedback = form.querySelector('.feedback');
    feedback.textContent = !selected ? 'Choose an answer first.' : selected.value === form.dataset.answer ? form.dataset.correct : form.dataset.retry;
  });
});
const editor = document.querySelector('#css-editor');
const preview = document.querySelector('#preview');
if (editor && preview) {
  document.querySelector('#apply-css').addEventListener('click', () => {
    const doc = preview.contentDocument;
    if (!doc) return;
    doc.querySelector('#practice-style').textContent = editor.value;
    const heading = doc.querySelector('h1');
    const colour = doc.defaultView.getComputedStyle(heading).color;
    document.querySelector('#practice-feedback').textContent = colour === 'rgb(0, 0, 255)' ? 'Correct: the h1 is blue. Now explain which part chooses the element and which part changes its appearance.' : 'The heading is not blue yet. Use h1 as the selector, color as the property and blue as the value. Check your braces and colon.';
  });
}
