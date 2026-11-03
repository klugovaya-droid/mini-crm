import { describe, expect, it } from "vitest";
import { availableActions, canTransition } from "@/features/tasks/permissions";
import type { Profile, Task, TaskStatus } from "@/types/domain";

const manager: Pick<Profile, "id" | "role"> = { id: "manager-id", role: "manager" };
const worker: Pick<Profile, "id" | "role"> = { id: "worker-id", role: "worker" };
const otherWorker: Pick<Profile, "id" | "role"> = { id: "other-id", role: "worker" };

function task(status: TaskStatus, assigneeId = worker.id): Pick<Task, "status" | "assignee_id" | "deleted_at"> {
  return { status, assignee_id: assigneeId, deleted_at: null };
}

describe("canTransition", () => {
  it("allows a worker to move their task forward", () => {
    expect(canTransition(worker, task("new"), "in_progress")).toBe(true);
    expect(canTransition(worker, task("in_progress"), "on_review")).toBe(true);
    expect(canTransition(worker, task("rework"), "in_progress")).toBe(true);
  });

  it("does not allow a worker to skip steps or accept", () => {
    expect(canTransition(worker, task("new"), "on_review")).toBe(false);
    expect(canTransition(worker, task("in_progress"), "accepted")).toBe(false);
    expect(canTransition(worker, task("on_review"), "accepted")).toBe(false);
  });

  it("does not allow a worker to touch someone else's task", () => {
    expect(canTransition(otherWorker, task("new"), "in_progress")).toBe(false);
    expect(canTransition(otherWorker, task("in_progress"), "on_review")).toBe(false);
  });

  it("allows a manager only to accept or return from review", () => {
    expect(canTransition(manager, task("on_review"), "accepted")).toBe(true);
    expect(canTransition(manager, task("on_review"), "rework")).toBe(true);
    expect(canTransition(manager, task("new"), "in_progress")).toBe(false);
    expect(canTransition(manager, task("in_progress"), "on_review")).toBe(false);
  });

  it("does not allow a manager to accept a rework task directly", () => {
    expect(canTransition(manager, task("rework"), "accepted")).toBe(false);
  });

  it("ignores archived tasks", () => {
    expect(
      canTransition(worker, { ...task("new"), deleted_at: new Date().toISOString() }, "in_progress"),
    ).toBe(false);
  });
});

describe("availableActions", () => {
  it("returns worker actions by status", () => {
    expect(availableActions(worker, task("new")).map((action) => action.to)).toEqual([
      "in_progress",
    ]);
    expect(availableActions(worker, task("in_progress")).map((action) => action.to)).toEqual([
      "on_review",
    ]);
    expect(availableActions(worker, task("rework")).map((action) => action.to)).toEqual([
      "in_progress",
    ]);
    expect(availableActions(worker, task("accepted"))).toEqual([]);
  });

  it("returns manager actions and marks the required comment", () => {
    const actions = availableActions(manager, task("on_review"));
    expect(actions.map((action) => action.to)).toEqual(["accepted", "rework"]);
    expect(actions.find((action) => action.to === "rework")?.commentRequired).toBe(true);
  });
});
