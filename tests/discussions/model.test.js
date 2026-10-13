import { describe, expect, it } from "vitest";
import { discussionFormats } from "../../js/discussions/data.js";
import {
  DISCUSSION_STORAGE_KEY,
  filterDiscussions,
  joinDiscussion,
  loadDiscussionState,
  saveDiscussionState,
} from "../../js/discussions/model.js";

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), value: (key) => values.get(key) };
}

describe("discussion model", () => {
  it("filters known categories and treats All as the full set", () => {
    expect(filterDiscussions(discussionFormats, "All")).toHaveLength(4);
    expect(filterDiscussions(discussionFormats, "Coding").map((item) => item.id)).toEqual(["code-review-circle"]);
    expect(filterDiscussions(discussionFormats, "Unknown")).toEqual([]);
  });

  it("records one local expression of interest without mutating the input", () => {
    const state = { version: 1, joinedIds: [], counts: {} };
    const result = joinDiscussion(state, "study-sprint");
    expect(result).toMatchObject({ ok: true, reason: "joined" });
    expect(result.state.joinedIds).toEqual(["study-sprint"]);
    expect(result.state.counts["study-sprint"]).toBe(1);
    expect(state.joinedIds).toEqual([]);

    expect(joinDiscussion(result.state, "study-sprint")).toMatchObject({ ok: false, reason: "already-joined" });
  });

  it("rejects unknown and full formats", () => {
    const full = { version: 1, joinedIds: [], counts: { "project-clinic": 15 } };
    expect(joinDiscussion(full, "missing")).toMatchObject({ ok: false, reason: "unknown" });
    expect(joinDiscussion(full, "project-clinic")).toMatchObject({ ok: false, reason: "full" });
  });

  it("recovers from corrupt storage and round trips valid state", () => {
    const corrupt = memoryStorage({ [DISCUSSION_STORAGE_KEY]: "{" });
    expect(loadDiscussionState(corrupt)).toEqual({ version: 1, joinedIds: [], counts: {} });

    const storage = memoryStorage();
    const state = joinDiscussion(loadDiscussionState(storage), "challenge-lab").state;
    saveDiscussionState(storage, state);
    expect(loadDiscussionState(storage)).toEqual(state);
  });

  it("labels every item as proposed and unscheduled", () => {
    for (const item of discussionFormats) {
      expect(item.status).toBe("Proposed format. Date and venue not confirmed.");
      expect(item.capacity).toBe(15);
    }
  });
});
