import { discussionFormats } from "./data.js";

export const DISCUSSION_STORAGE_KEY = "reps.discussions.v1";
const VERSION = 1;

function emptyState() {
  return { version: VERSION, joinedIds: [], counts: {} };
}

export function filterDiscussions(items, category) {
  if (category === "All") return [...items];
  return items.filter((item) => item.category === category);
}

export function joinDiscussion(state, id, items = discussionFormats) {
  const item = items.find((candidate) => candidate.id === id);
  if (!item) return { ok: false, reason: "unknown", state };
  if (state.joinedIds.includes(id)) return { ok: false, reason: "already-joined", state };
  const count = Number.isInteger(state.counts[id]) ? state.counts[id] : 0;
  if (count >= item.capacity) return { ok: false, reason: "full", state };

  return {
    ok: true,
    reason: "joined",
    state: {
      version: VERSION,
      joinedIds: [...state.joinedIds, id],
      counts: { ...state.counts, [id]: count + 1 },
    },
  };
}

export function loadDiscussionState(storage) {
  try {
    const raw = storage.getItem(DISCUSSION_STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    if (parsed?.version !== VERSION || !Array.isArray(parsed.joinedIds) || typeof parsed.counts !== "object") return emptyState();
    const known = new Set(discussionFormats.map((item) => item.id));
    return {
      version: VERSION,
      joinedIds: [...new Set(parsed.joinedIds.filter((id) => known.has(id)))],
      counts: Object.fromEntries(Object.entries(parsed.counts).filter(([id, count]) => known.has(id) && Number.isInteger(count) && count >= 0 && count <= 15)),
    };
  } catch {
    return emptyState();
  }
}

export function saveDiscussionState(storage, state) {
  try {
    storage.setItem(DISCUSSION_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
