import { discussionFormats } from "./data.js";
import { filterDiscussions, joinDiscussion, loadDiscussionState, saveDiscussionState } from "./model.js";

function discussionCard(root, item, joined, onJoin) {
  const article = root.createElement("article");
  article.className = "discussion-card";
  article.dataset.discussionId = item.id;

  const category = root.createElement("p");
  category.className = "discussion-category";
  category.textContent = item.category;
  const title = root.createElement("h3");
  title.textContent = item.title;
  const purpose = root.createElement("p");
  purpose.textContent = item.purpose;
  const status = root.createElement("p");
  status.className = "discussion-note";
  status.textContent = `${item.status} Maximum group size: ${item.capacity}.`;
  const button = root.createElement("button");
  button.type = "button";
  button.dataset.joinDiscussion = item.id;
  button.disabled = joined;
  button.textContent = joined ? "Interest saved" : "Save my interest";
  button.addEventListener("click", () => onJoin(item.id));

  article.append(category, title, purpose, status, button);
  return article;
}

export function initDiscussionsPage(root = document, storage = globalThis.localStorage) {
  const filter = root.querySelector("#discussion-category");
  const list = root.querySelector("#discussion-list");
  const resultCount = root.querySelector("#discussion-result-count");
  const status = root.querySelector("#discussion-status");
  if (!filter || !list || !resultCount || !status) return;

  let state = loadDiscussionState(storage);

  function join(id) {
    const result = joinDiscussion(state, id);
    if (result.ok) {
      state = result.state;
      saveDiscussionState(storage, state);
      status.textContent = "Your interest is saved on this device. This is not a confirmed reservation.";
      render();
    }
  }

  function render() {
    const items = filterDiscussions(discussionFormats, filter.value);
    list.replaceChildren(...items.map((item) => discussionCard(root, item, state.joinedIds.includes(item.id), join)));
    resultCount.textContent = `${items.length} proposed ${items.length === 1 ? "format" : "formats"}`;
  }

  filter.disabled = false;
  filter.addEventListener("change", render);
  render();
}

if (typeof document !== "undefined") initDiscussionsPage(document);
