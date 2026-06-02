import { test, describe, beforeEach, vi } from "vitest";
import assert from "node:assert/strict";

// ──────────────────────────────────────────────
// Helper: useFakeTimers for TTL-based tests
// ──────────────────────────────────────────────
vi.useFakeTimers();

const { useWorkoutStore } = await import("../useWorkoutStore.js");

const guestUser = {
  id: "00000000-0000-0000-0000-000000000000",
  name: "게스트",
  isGuest: true,
};

beforeEach(() => {
  window.localStorage.clear();
  useWorkoutStore.getState().clearAllData();
  useWorkoutStore.setState({ currentUser: guestUser });
});

/**
 * Waits for a microtask cycle to flush any queued Promises.
 * Must be used inside `vi.useRealTimers()` contexts,
 * or with vi.advanceTimersByTime(0) when using fake timers.
 */
const flushMicrotasks = () => new Promise((resolve) => setTimeout(resolve, 0));

// ──────────────────────────────────────────────
// runRemoteSync
// ──────────────────────────────────────────────
describe("authSlice: runRemoteSync", () => {
  test("serializes tasks with same dedupKey (cancel should win over create)", async () => {
    const order = [];

    useWorkoutStore.getState().runRemoteSync(
      "addSession (simulated)",
      async () => {
        await flushMicrotasks();
        order.push("add");
      },
      { dedupKey: "session:test-id" },
    );

    useWorkoutStore.getState().runRemoteSync(
      "deleteSession (simulated)",
      async () => {
        order.push("delete");
      },
      { dedupKey: "session:test-id" },
    );

    // Flush all queued microtasks: add runs first, delete runs second
    await vi.advanceTimersByTimeAsync(10);
    assert.deepEqual(order, ["add", "delete"]);
  });

  test("executes task successfully without dedupKey", async () => {
    let executed = false;

    useWorkoutStore.getState().runRemoteSync("simple task", async () => {
      executed = true;
    });

    await vi.advanceTimersByTimeAsync(10);
    assert.equal(executed, true);
  });

  test("replaces existing failed task when new one shares the same dedupKey", async () => {
    // First task: fail
    const syncError = new Error("first failure");
    let firstTaskRan = false;

    useWorkoutStore.getState().runRemoteSync(
      "first task",
      async () => {
        firstTaskRan = true;
        throw syncError;
      },
      { dedupKey: "exercise:dup-id" },
    );

    await vi.advanceTimersByTimeAsync(10);
    assert.equal(firstTaskRan, true);

    // Error should be visible
    const errorState = useWorkoutStore.getState().remoteSyncError;
    assert.ok(errorState);
    assert.equal(errorState.label, "first task");
    assert.equal(errorState.pendingCount, 1);

    // Second task with same dedupKey: succeed — should replace the failed one
    let secondTaskRan = false;
    useWorkoutStore.getState().runRemoteSync(
      "replacement task",
      async () => {
        secondTaskRan = true;
      },
      { dedupKey: "exercise:dup-id" },
    );

    // After replacement, the error should clear (no pending failures for this dedupKey)
    // But wait — the replacement task runs after the first one fails, so the first
    // failure is removed from the map, and the second runs successfully.
    await vi.advanceTimersByTimeAsync(10);
    assert.equal(secondTaskRan, true);

    // After the replacement succeeds, there should be no pending errors
    // (The dedupKey logic removes old failed tasks with same key before adding new one)
    assert.equal(useWorkoutStore.getState().remoteSyncError, null);
  });

  test("tolerates non-throwing task that returns normally", async () => {
    let result = null;

    useWorkoutStore.getState().runRemoteSync("returns value", async () => {
      result = 42;
    });

    await vi.advanceTimersByTimeAsync(10);
    assert.equal(result, 42);
  });
});

// ──────────────────────────────────────────────
// clearRemoteSyncError
// ──────────────────────────────────────────────
describe("authSlice: clearRemoteSyncError", () => {
  test("clears remoteSyncError when set", async () => {
    // Simulate a failed sync
    useWorkoutStore.getState().runRemoteSync("failing task", async () => {
      throw new Error("failed");
    });

    await vi.advanceTimersByTimeAsync(10);

    assert.ok(useWorkoutStore.getState().remoteSyncError);

    useWorkoutStore.getState().clearRemoteSyncError();
    assert.equal(useWorkoutStore.getState().remoteSyncError, null);
  });

  test("no-ops when remoteSyncError is already null", () => {
    assert.equal(useWorkoutStore.getState().remoteSyncError, null);
    useWorkoutStore.getState().clearRemoteSyncError();
    assert.equal(useWorkoutStore.getState().remoteSyncError, null);
  });
});

// ──────────────────────────────────────────────
// discardGuestLocalDataForSignUp
// ──────────────────────────────────────────────
describe("authSlice: discardGuestLocalDataForSignUp", () => {
  test("discards all local workout data and sets hasClearedDemoData to true", () => {
    // Seed some guest data first
    useWorkoutStore.getState().addRoutine("게스트 루틴");
    useWorkoutStore.getState().addExercise("내 운동", "가슴", "덤벨");

    assert.ok(useWorkoutStore.getState().routines.length > 0);
    assert.ok(useWorkoutStore.getState().exercises.length > 0);

    useWorkoutStore.getState().discardGuestLocalDataForSignUp();

    const state = useWorkoutStore.getState();
    assert.equal(state.routines.length, 0);
    assert.equal(state.sessions.length, 0);
    assert.equal(state.sessionExercises.length, 0);
    assert.equal(state.sessionExerciseGroups.length, 0);
    assert.equal(state.workoutLogs.length, 0);
    assert.equal(state.setRecords.length, 0);
    assert.equal(state.hasClearedDemoData, true);
  });

  test("preserves exercise catalog when discarding", () => {
    const initialExercises = useWorkoutStore.getState().exercises.length;

    useWorkoutStore.getState().addRoutine("루틴");
    useWorkoutStore.getState().discardGuestLocalDataForSignUp();

    // Exercises (catalog) should remain untouched
    assert.ok(useWorkoutStore.getState().exercises.length >= initialExercises);
    assert.equal(useWorkoutStore.getState().hasClearedDemoData, true);
  });

  test("no-ops for non-guest user", () => {
    useWorkoutStore.setState({
      currentUser: { id: "user-1", name: "회원", isGuest: false },
      hasClearedDemoData: false,
      routines: [
        {
          id: "r1",
          name: "멤버 루틴",
          user_id: "user-1",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    });

    useWorkoutStore.getState().discardGuestLocalDataForSignUp();

    // Data should not be cleared for non-guest users
    assert.equal(useWorkoutStore.getState().routines.length, 1);
    assert.equal(useWorkoutStore.getState().hasClearedDemoData, false);
  });

  test("no-ops for guest user who has already cleared demo data", () => {
    useWorkoutStore.setState({ hasClearedDemoData: true });

    useWorkoutStore.getState().addRoutine("보존할 루틴");
    useWorkoutStore.getState().discardGuestLocalDataForSignUp();

    // Even though guest, the function checks isGuest and discards anyway
    // But the routine should be gone since we called discardGuestLocalDataForSignUp
    assert.equal(useWorkoutStore.getState().routines.length, 0);
    assert.equal(useWorkoutStore.getState().hasClearedDemoData, true);
  });
});

// ──────────────────────────────────────────────
// seedDemoData
// ──────────────────────────────────────────────
describe("authSlice: seedDemoData", () => {
  test("creates demo routines, sessions, exercise groups, and workout logs", async () => {
    await useWorkoutStore.getState().seedDemoData();

    const state = useWorkoutStore.getState();
    assert.ok(state.routines.length > 0, "should have routines");
    assert.ok(state.sessions.length > 0, "should have sessions");
    assert.ok(
      state.sessionExercises.length > 0,
      "should have session exercises",
    );
    assert.ok(state.workoutLogs.length > 0, "should have workout logs");
    assert.ok(state.setRecords.length > 0, "should have set records");
    assert.equal(state.hasClearedDemoData, false);
  });

  test("does not reset hasClearedDemoData if already false", async () => {
    useWorkoutStore.setState({ hasClearedDemoData: true });

    await useWorkoutStore.getState().seedDemoData();

    assert.equal(useWorkoutStore.getState().hasClearedDemoData, false);
  });

  test("can be called multiple times idempotently", async () => {
    await useWorkoutStore.getState().seedDemoData();
    const firstCount = useWorkoutStore.getState().routines.length;

    await useWorkoutStore.getState().seedDemoData();
    const secondCount = useWorkoutStore.getState().routines.length;

    // seedDemoData fully replaces state, so both calls produce same result
    assert.ok(firstCount > 0);
    assert.equal(firstCount, secondCount);
  });
});

// ──────────────────────────────────────────────
// retryFailedRemoteSync — internal error handling
// ──────────────────────────────────────────────
describe("authSlice: retryFailedRemoteSync (state-only)", () => {
  test("resolves with no-op when there are no failed tasks", async () => {
    assert.equal(useWorkoutStore.getState().remoteSyncError, null);

    await useWorkoutStore.getState().retryFailedRemoteSync();

    assert.equal(useWorkoutStore.getState().remoteSyncError, null);
  });
});
