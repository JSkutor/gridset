// @ts-nocheck
import { test, describe, beforeEach } from "vitest";
import assert from "node:assert/strict";
import { MAX_SESSIONS_PER_ROUTINE } from "../../utils/sessionHelper.js";
import {
  MAX_GROUPS_PER_SESSION,
  GROUP_COLOR_PALETTE,
} from "../../utils/sessionExerciseGroups.js";

const { useWorkoutStore } = await import("../useWorkoutStore.js");
const { EXERCISE_CATALOG } = await import("../../data/dummyGenerator.js");

const guestUser = {
  id: "00000000-0000-0000-0000-000000000000",
  name: "게스트",
  isGuest: true,
};

function exerciseByLabel(label) {
  const normalized = label.toLowerCase();
  const compact = normalized.replace(/\s+/g, "");
  return useWorkoutStore
    .getState()
    .exercises.find(
      (exercise) =>
        exercise.name.toLowerCase() === normalized ||
        exercise.name.toLowerCase().replace(/\s+/g, "") === compact ||
        exercise.synonyms?.some(
          (synonym) =>
            synonym.toLowerCase() === normalized ||
            synonym.toLowerCase().replace(/\s+/g, "") === compact,
        ),
    );
}

beforeEach(() => {
  window.localStorage.clear();
  useWorkoutStore.setState({ exercises: [...EXERCISE_CATALOG] });
  useWorkoutStore.getState().clearAllData();
  useWorkoutStore.setState({ currentUser: guestUser });
});

// ──────────────────────────────────────────────
// Routine CRUD
// ──────────────────────────────────────────────
describe("routineSlice: Routine CRUD", () => {
  test("addRoutine creates a routine with trimmed name and default fallback", () => {
    const r1 = useWorkoutStore.getState().addRoutine("  내 루틴  ");
    assert.equal(r1.name, "내 루틴");
    assert.ok(r1.id);
    assert.equal(r1.user_id, guestUser.id);

    const r2 = useWorkoutStore.getState().addRoutine("");
    assert.ok(r2.name.startsWith("새 루틴"));
  });

  test("updateRoutine changes routine name", () => {
    const r = useWorkoutStore.getState().addRoutine("Old Name");
    useWorkoutStore.getState().updateRoutine(r.id, "New Name");
    const updated = useWorkoutStore
      .getState()
      .routines.find((rt) => rt.id === r.id);
    assert.equal(updated.name, "New Name");
  });

  test("deleteRoutine removes routine, its sessions, exercises, and groups", () => {
    const r = useWorkoutStore.getState().addRoutine("Delete Me");
    const s = useWorkoutStore.getState().addSession(r.id, "Session");
    const bench = exerciseByLabel("벤치프레스");
    useWorkoutStore.getState().addSessionExercise(s.id, bench.id, 1, 3, "10");
    useWorkoutStore.getState().addSessionExerciseGroup(s.id, "그룹", 2);

    useWorkoutStore.getState().deleteRoutine(r.id);

    assert.equal(
      useWorkoutStore.getState().routines.some((rt) => rt.id === r.id),
      false,
    );
    assert.equal(
      useWorkoutStore.getState().sessions.some((sn) => sn.routine_id === r.id),
      false,
    );
    assert.equal(
      useWorkoutStore
        .getState()
        .sessionExercises.some((se) => se.session_id === s.id),
      false,
    );
    assert.equal(
      useWorkoutStore
        .getState()
        .sessionExerciseGroups.some((g) => g.session_id === s.id),
      false,
    );
  });

  test("duplicateRoutine deep copies sessions, exercises, and groups with new IDs", () => {
    const r = useWorkoutStore.getState().addRoutine("Original");
    const s = useWorkoutStore.getState().addSession(r.id, "Day A");
    const bench = exerciseByLabel("벤치프레스");
    const squat = exerciseByLabel("스쿼트");
    const link1 = useWorkoutStore
      .getState()
      .addSessionExercise(s.id, bench.id, 1, 4, "8");
    useWorkoutStore.getState().addSessionExercise(s.id, squat.id, 2, 3, "10");
    useWorkoutStore
      .getState()
      .updateSessionExercise(link1.id, {
        rest_between_sets: 60,
        rest_after_exercise: 180,
      });
    const group = useWorkoutStore
      .getState()
      .addSessionExerciseGroup(s.id, "슈퍼세트", 2);

    const copy = useWorkoutStore.getState().duplicateRoutine(r.id);
    assert.ok(copy);
    assert.notEqual(copy.id, r.id);
    assert.equal(copy.name, "Original 복사");

    const copiedSessions = useWorkoutStore
      .getState()
      .sessions.filter((sn) => sn.routine_id === copy.id);
    assert.equal(copiedSessions.length, 1);
    assert.notEqual(copiedSessions[0].id, s.id);
    assert.equal(copiedSessions[0].name, "Day A");

    const copiedLinks = useWorkoutStore
      .getState()
      .sessionExercises.filter((se) => se.session_id === copiedSessions[0].id);
    assert.equal(copiedLinks.length, 2);

    const copiedBenchLink = copiedLinks.find(
      (se) => se.exercise_id === bench.id,
    );
    assert.ok(copiedBenchLink);
    assert.equal(copiedBenchLink.target_sets, 4);
    assert.equal(copiedBenchLink.target_record, "8");
    assert.equal(copiedBenchLink.rest_between_sets, 60);
    assert.equal(copiedBenchLink.rest_after_exercise, 180);

    const copiedGroups = useWorkoutStore
      .getState()
      .sessionExerciseGroups.filter(
        (g) => g.session_id === copiedSessions[0].id,
      );
    assert.equal(copiedGroups.length, 1);
    assert.notEqual(copiedGroups[0].id, group.id);
    assert.equal(copiedGroups[0].name, "슈퍼세트");
  });

  test("duplicateRoutine returns null for non-existent source routine", () => {
    const result = useWorkoutStore
      .getState()
      .duplicateRoutine("non-existent-id");
    assert.equal(result, null);
  });
});

// ──────────────────────────────────────────────
// Session CRUD
// ──────────────────────────────────────────────
describe("routineSlice: Session CRUD", () => {
  test("addSession creates a session with correct order and name fallback", () => {
    const r = useWorkoutStore.getState().addRoutine("Routine");
    const s1 = useWorkoutStore.getState().addSession(r.id, "첫 세션");
    assert.equal(s1.session_order, 1);
    assert.equal(s1.name, "첫 세션");

    const s2 = useWorkoutStore.getState().addSession(r.id, "");
    assert.ok(s2.name.startsWith("새 세션"));
    assert.equal(s2.session_order, 2);
  });

  test("addSession returns null when capped at MAX_SESSIONS_PER_ROUTINE", () => {
    const r = useWorkoutStore.getState().addRoutine("Capped");
    const created = Array.from({ length: MAX_SESSIONS_PER_ROUTINE }, (_, i) =>
      useWorkoutStore.getState().addSession(r.id, `Day ${i + 1}`),
    );
    assert.equal(created.every(Boolean), true);
    assert.equal(created.length, MAX_SESSIONS_PER_ROUTINE);

    const overflow = useWorkoutStore.getState().addSession(r.id, "Overflow");
    assert.equal(overflow, null);
  });

  test("updateSession changes session name", () => {
    const r = useWorkoutStore.getState().addRoutine("R");
    const s = useWorkoutStore.getState().addSession(r.id, "Old");
    useWorkoutStore.getState().updateSession(s.id, "Updated");
    const updated = useWorkoutStore
      .getState()
      .sessions.find((sn) => sn.id === s.id);
    assert.equal(updated.name, "Updated");
  });

  test("deleteSession cascades links, groups, and compacts remaining session orders", () => {
    const r = useWorkoutStore.getState().addRoutine("Upper/Lower");
    const s1 = useWorkoutStore.getState().addSession(r.id, "Upper");
    const s2 = useWorkoutStore.getState().addSession(r.id, "Lower");
    const s3 = useWorkoutStore.getState().addSession(r.id, "Extra");
    const bench = exerciseByLabel("벤치프레스");
    useWorkoutStore.getState().addSessionExercise(s2.id, bench.id, 1, 3, "10");

    useWorkoutStore.getState().deleteSession(s2.id);

    const remainingSessions = useWorkoutStore
      .getState()
      .sessions.filter((sn) => sn.routine_id === r.id)
      .sort((a, b) => a.session_order - b.session_order);

    // s2(두번째)가 지워졌으므로 s1(1), s3(2) → s3의 order가 2로 컴팩트
    assert.deepEqual(
      remainingSessions.map((sn) => ({
        id: sn.id,
        session_order: sn.session_order,
      })),
      [
        { id: s1.id, session_order: 1 },
        { id: s3.id, session_order: 2 },
      ],
    );
    // 삭제된 세션의 exercise도 제거
    assert.equal(
      useWorkoutStore
        .getState()
        .sessionExercises.some((se) => se.session_id === s2.id),
      false,
    );
  });

  test("deleteSession handles no session found gracefully", () => {
    // 존재하지 않는 ID로 deleteSession 호출 — 에러 없이 통과
    useWorkoutStore.getState().deleteSession("non-existent");
    assert.ok(true);
  });

  test("createTemporarySession creates session with TEMPORARY_SESSION_ORDER", () => {
    const r = useWorkoutStore.getState().addRoutine("Temp Test");
    const ts = useWorkoutStore.getState().createTemporarySession(r.id, "임시");
    assert.equal(ts.session_order, 0);
    assert.equal(ts.name, "임시");
    assert.ok(ts.routine_id, r.id);
  });

  test("createTemporarySession returns existing temporary session if already present", () => {
    const r = useWorkoutStore.getState().addRoutine("Temp Dup");
    const ts1 = useWorkoutStore
      .getState()
      .createTemporarySession(r.id, "첫 임시");
    const ts2 = useWorkoutStore
      .getState()
      .createTemporarySession(r.id, "두번째 임시");
    assert.equal(ts2.id, ts1.id);
    assert.equal(ts2.name, "첫 임시");
  });

  test("createTemporarySession returns null when routine_id is missing", () => {
    const result = useWorkoutStore.getState().createTemporarySession(null);
    assert.equal(result, null);
  });

  test("reorderSessions updates session_order based on provided ID array", () => {
    const r = useWorkoutStore.getState().addRoutine("Reorder");
    const s1 = useWorkoutStore.getState().addSession(r.id, "A");
    const s2 = useWorkoutStore.getState().addSession(r.id, "B");
    const s3 = useWorkoutStore.getState().addSession(r.id, "C");

    useWorkoutStore.getState().reorderSessions(r.id, [s3.id, s1.id, s2.id]);

    const sessions = useWorkoutStore
      .getState()
      .sessions.filter((sn) => sn.routine_id === r.id)
      .sort((a, b) => a.session_order - b.session_order);
    assert.deepEqual(
      sessions.map((sn) => sn.id),
      [s3.id, s1.id, s2.id],
    );
    assert.deepEqual(
      sessions.map((sn) => sn.session_order),
      [1, 2, 3],
    );
  });
});

// ──────────────────────────────────────────────
// Session Exercise CRUD
// ──────────────────────────────────────────────
describe("routineSlice: Session Exercise CRUD", () => {
  test("addSessionExercise creates an exercise link with default rest times", () => {
    const r = useWorkoutStore.getState().addRoutine("R");
    const s = useWorkoutStore.getState().addSession(r.id, "S");
    const bench = exerciseByLabel("벤치프레스");
    const link = useWorkoutStore
      .getState()
      .addSessionExercise(s.id, bench.id, 1, 4, "8");

    assert.equal(link.session_id, s.id);
    assert.equal(link.exercise_id, bench.id);
    assert.equal(link.order, 1);
    assert.equal(link.target_sets, 4);
    assert.equal(link.target_record, "8");
    assert.equal(link.rest_between_sets, 90);
    assert.equal(link.rest_after_exercise, 120);
  });

  test("deleteSessionExercise compacts remaining exercise orders inside the session", () => {
    const r = useWorkoutStore.getState().addRoutine("R");
    const s = useWorkoutStore.getState().addSession(r.id, "S");
    const [bench, squat, deadlift] = ["벤치프레스", "스쿼트", "데드리프트"].map(
      exerciseByLabel,
    );
    const first = useWorkoutStore
      .getState()
      .addSessionExercise(s.id, bench.id, 1, 3, "10");
    const second = useWorkoutStore
      .getState()
      .addSessionExercise(s.id, squat.id, 2, 3, "10");
    const third = useWorkoutStore
      .getState()
      .addSessionExercise(s.id, deadlift.id, 3, 3, "10");

    useWorkoutStore.getState().deleteSessionExercise(first.id);

    assert.deepEqual(
      useWorkoutStore
        .getState()
        .sessionExercises.filter((se) => se.session_id === s.id)
        .sort((a, b) => a.order - b.order)
        .map((se) => ({ id: se.id, order: se.order })),
      [
        { id: second.id, order: 1 },
        { id: third.id, order: 2 },
      ],
    );
  });

  test("deleteSessionExercise handles non-existent exercise gracefully", () => {
    useWorkoutStore.getState().deleteSessionExercise("non-existent");
    assert.ok(true);
  });

  test("updateSessionExercise modifies individual exercise link properties", () => {
    const r = useWorkoutStore.getState().addRoutine("R");
    const s = useWorkoutStore.getState().addSession(r.id, "S");
    const bench = exerciseByLabel("벤치프레스");
    const link = useWorkoutStore
      .getState()
      .addSessionExercise(s.id, bench.id, 1, 3, "10");

    useWorkoutStore.getState().updateSessionExercise(link.id, {
      target_sets: 5,
      rest_between_sets: 45,
      target_record: "12",
    });

    const updated = useWorkoutStore
      .getState()
      .sessionExercises.find((se) => se.id === link.id);
    assert.equal(updated.target_sets, 5);
    assert.equal(updated.rest_between_sets, 45);
    assert.equal(updated.target_record, "12");
    assert.equal(updated.rest_after_exercise, 120); // unchanged
  });

  test("reorderSessionExercises updates orders and re-applies group target sets", () => {
    const r = useWorkoutStore.getState().addRoutine("R");
    const s = useWorkoutStore.getState().addSession(r.id, "S");
    const [bench, squat, deadlift] = ["벤치프레스", "스쿼트", "데드리프트"].map(
      exerciseByLabel,
    );
    const first = useWorkoutStore
      .getState()
      .addSessionExercise(s.id, bench.id, 1, 4, "8");
    const second = useWorkoutStore
      .getState()
      .addSessionExercise(s.id, squat.id, 2, 3, "10");
    const third = useWorkoutStore
      .getState()
      .addSessionExercise(s.id, deadlift.id, 3, 2, "5");

    // Create a group covering positions 2-3 (squat, deadlift)
    useWorkoutStore.getState().addSessionExerciseGroup(s.id, "그룹", 2);

    // Reorder: move bench to position 3
    useWorkoutStore
      .getState()
      .reorderSessionExercises(s.id, [second.id, third.id, first.id]);

    const exercises = useWorkoutStore
      .getState()
      .sessionExercises.filter((se) => se.session_id === s.id)
      .sort((a, b) => a.order - b.order);

    assert.equal(exercises[0].id, second.id);
    assert.equal(exercises[0].order, 1);
    assert.equal(exercises[1].id, third.id);
    assert.equal(exercises[1].order, 2);
    assert.equal(exercises[2].id, first.id);
    assert.equal(exercises[2].order, 3);
  });
});

// ──────────────────────────────────────────────
// Session Exercise Groups
// ──────────────────────────────────────────────
describe("routineSlice: Session Exercise Groups", () => {
  test("addSessionExerciseGroup creates a group that unifies target_sets and rest times", () => {
    const r = useWorkoutStore.getState().addRoutine("Superset");
    const s = useWorkoutStore.getState().addSession(r.id, "Day A");
    const [bench, squat] = ["벤치프레스", "스쿼트"].map(exerciseByLabel);
    const first = useWorkoutStore
      .getState()
      .addSessionExercise(s.id, bench.id, 1, 4, "8");
    const second = useWorkoutStore
      .getState()
      .addSessionExercise(s.id, squat.id, 2, 3, "10");
    useWorkoutStore
      .getState()
      .updateSessionExercise(first.id, {
        rest_between_sets: 60,
        rest_after_exercise: 150,
      });

    const group = useWorkoutStore
      .getState()
      .addSessionExerciseGroup(s.id, "슈퍼세트 A", 2);

    assert.ok(group);
    assert.equal(group.name, "슈퍼세트 A");
    assert.equal(group.start_order, 1);
    assert.equal(group.size, 2);

    // 두 exercise의 target_sets가 first 것을 따라감
    const groupedExercises = useWorkoutStore
      .getState()
      .sessionExercises.filter((se) => [first.id, second.id].includes(se.id));
    assert.deepEqual(
      groupedExercises.map((se) => se.target_sets),
      [4, 4],
    );
    assert.deepEqual(
      groupedExercises.map((se) => se.rest_between_sets),
      [60, 60],
    );
    assert.deepEqual(
      groupedExercises.map((se) => se.rest_after_exercise),
      [150, 150],
    );
  });

  test("addSessionExerciseGroup returns null when MAX_GROUPS_PER_SESSION is exceeded", () => {
    const r = useWorkoutStore.getState().addRoutine("Groups Cap");
    const s = useWorkoutStore.getState().addSession(r.id, "Day A");
    const exercises = useWorkoutStore.getState().exercises.slice(0, 10);
    exercises.forEach((ex, i) => {
      useWorkoutStore
        .getState()
        .addSessionExercise(s.id, ex.id, i + 1, 3, "10");
    });

    const groups = Array.from({ length: MAX_GROUPS_PER_SESSION }, (_, i) =>
      useWorkoutStore
        .getState()
        .addSessionExerciseGroup(s.id, `그룹 ${i + 1}`, 2),
    );
    assert.equal(groups.every(Boolean), true);
    assert.equal(groups.length, MAX_GROUPS_PER_SESSION);

    const overflow = useWorkoutStore
      .getState()
      .addSessionExerciseGroup(s.id, "그룹 5", 2);
    assert.equal(overflow, null);
  });

  test("addSessionExerciseGroup returns null when not enough exercises", () => {
    const r = useWorkoutStore.getState().addRoutine("R");
    const s = useWorkoutStore.getState().addSession(r.id, "S");
    const bench = exerciseByLabel("벤치프레스");
    useWorkoutStore.getState().addSessionExercise(s.id, bench.id, 1, 3, "10");

    // Only 1 exercise, MIN_GROUP_SIZE=2, so group should not be created
    const group = useWorkoutStore
      .getState()
      .addSessionExerciseGroup(s.id, "그룹", 2);
    assert.equal(group, null);
  });

  test("addSessionExerciseGroup assigns colors from palette sequentially", () => {
    const r = useWorkoutStore.getState().addRoutine("Colors");
    const s = useWorkoutStore.getState().addSession(r.id, "Day A");
    const exs = useWorkoutStore.getState().exercises.slice(0, 8);
    exs.forEach((ex, i) => {
      useWorkoutStore
        .getState()
        .addSessionExercise(s.id, ex.id, i + 1, 3, "10");
    });

    const groups = Array.from({ length: 4 }, (_, i) =>
      useWorkoutStore
        .getState()
        .addSessionExerciseGroup(s.id, `그룹 ${i + 1}`, 2),
    );

    assert.deepEqual(
      groups.map((g) => g.color),
      GROUP_COLOR_PALETTE,
    );
    assert.deepEqual(
      groups.map((g) => g.start_order),
      [1, 3, 5, 7],
    );
  });

  test("addSessionExerciseGroup places groups at first non-overlapping position", () => {
    const r = useWorkoutStore.getState().addRoutine("R");
    const s = useWorkoutStore.getState().addSession(r.id, "S");
    const exs = useWorkoutStore.getState().exercises.slice(0, 6);
    exs.forEach((ex, i) => {
      useWorkoutStore
        .getState()
        .addSessionExercise(s.id, ex.id, i + 1, 3, "10");
    });

    // Position 1-2, then next available is 3-4
    const g1 = useWorkoutStore
      .getState()
      .addSessionExerciseGroup(s.id, "G1", 2);
    assert.equal(g1.start_order, 1);

    const g2 = useWorkoutStore
      .getState()
      .addSessionExerciseGroup(s.id, "G2", 2);
    assert.equal(g2.start_order, 3);
  });

  test("updateSessionExerciseGroup moves group position avoiding overlaps", () => {
    const r = useWorkoutStore.getState().addRoutine("Skip Overlap");
    const s = useWorkoutStore.getState().addSession(r.id, "Day A");
    const exs = useWorkoutStore.getState().exercises.slice(0, 6);
    exs.forEach((ex, i) => {
      useWorkoutStore
        .getState()
        .addSessionExercise(s.id, ex.id, i + 1, 3, "10");
    });

    const g1 = useWorkoutStore
      .getState()
      .addSessionExerciseGroup(s.id, "첫 그룹", 2);
    const g2 = useWorkoutStore
      .getState()
      .addSessionExerciseGroup(s.id, "둘째 그룹", 2);

    // Move g1 to position 2 — it should jump to position 5 (after g2)
    const moved = useWorkoutStore
      .getState()
      .updateSessionExerciseGroup(g1.id, { start_order: 2 });
    assert.equal(moved.start_order, 5);
    assert.equal(g2.start_order, 3);
  });

  test("updateSessionExerciseGroup propagates target_sets/rest to all grouped exercises", () => {
    const r = useWorkoutStore.getState().addRoutine("R");
    const s = useWorkoutStore.getState().addSession(r.id, "S");
    const [bench, squat, deadlift] = ["벤치프레스", "스쿼트", "데드리프트"].map(
      exerciseByLabel,
    );
    useWorkoutStore.getState().addSessionExercise(s.id, bench.id, 1, 4, "8");
    useWorkoutStore.getState().addSessionExercise(s.id, squat.id, 2, 3, "10");
    useWorkoutStore.getState().addSessionExercise(s.id, deadlift.id, 3, 2, "5");

    const group = useWorkoutStore
      .getState()
      .addSessionExerciseGroup(s.id, "슈퍼세트", 2);
    assert.ok(group);

    // Update the group's size (or any property that triggers re-apply)
    // Then update one exercise within the group (propagates to all)
    const linkInGroup = useWorkoutStore
      .getState()
      .sessionExercises.filter((se) => se.session_id === s.id)
      .sort((a, b) => a.order - b.order)[0];
    useWorkoutStore
      .getState()
      .updateSessionExercise(linkInGroup.id, {
        target_sets: 6,
        rest_between_sets: 75,
      });

    const groupedLinks = useWorkoutStore
      .getState()
      .sessionExercises.filter((se) => se.session_id === s.id)
      .sort((a, b) => a.order - b.order);

    // First 2 links in the group get unified values, 3rd (outside group) stays
    assert.equal(groupedLinks[0].target_sets, 6);
    assert.equal(groupedLinks[1].target_sets, 6);
    assert.equal(groupedLinks[2].target_sets, 2); // outside group, unchanged
    assert.equal(groupedLinks[0].rest_between_sets, 75);
    assert.equal(groupedLinks[1].rest_between_sets, 75);
  });

  test("updateSessionExerciseGroup returns null for non-existent group", () => {
    const result = useWorkoutStore
      .getState()
      .updateSessionExerciseGroup("non-existent", { name: "Nope" });
    assert.equal(result, null);
  });

  test("deleteSessionExerciseGroup removes the group", () => {
    const r = useWorkoutStore.getState().addRoutine("R");
    const s = useWorkoutStore.getState().addSession(r.id, "S");
    const [bench, squat] = ["벤치프레스", "스쿼트"].map(exerciseByLabel);
    useWorkoutStore.getState().addSessionExercise(s.id, bench.id, 1, 3, "10");
    useWorkoutStore.getState().addSessionExercise(s.id, squat.id, 2, 3, "10");
    const group = useWorkoutStore
      .getState()
      .addSessionExerciseGroup(s.id, "그룹", 2);

    useWorkoutStore.getState().deleteSessionExerciseGroup(group.id);

    assert.equal(
      useWorkoutStore
        .getState()
        .sessionExerciseGroups.some((g) => g.id === group.id),
      false,
    );
  });

  test("deleteSessionExercise removes undersized groups", () => {
    const r = useWorkoutStore.getState().addRoutine("R");
    const s = useWorkoutStore.getState().addSession(r.id, "S");
    const [bench, squat] = ["벤치프레스", "스쿼트"].map(exerciseByLabel);
    const first = useWorkoutStore
      .getState()
      .addSessionExercise(s.id, bench.id, 1, 3, "8");
    useWorkoutStore.getState().addSessionExercise(s.id, squat.id, 2, 3, "10");
    const group = useWorkoutStore
      .getState()
      .addSessionExerciseGroup(s.id, "슈퍼세트", 2);

    // Delete one exercise in the group → group becomes size 1 (< MIN_GROUP_SIZE) → removed
    useWorkoutStore.getState().deleteSessionExercise(first.id);

    assert.equal(
      useWorkoutStore
        .getState()
        .sessionExerciseGroups.some((g) => g.id === group.id),
      false,
    );
  });

  test("exercises still exist after undersized group removal", () => {
    const r = useWorkoutStore.getState().addRoutine("R");
    const s = useWorkoutStore.getState().addSession(r.id, "S");
    const [bench, squat] = ["벤치프레스", "스쿼트"].map(exerciseByLabel);
    const first = useWorkoutStore
      .getState()
      .addSessionExercise(s.id, bench.id, 1, 3, "8");
    const second = useWorkoutStore
      .getState()
      .addSessionExercise(s.id, squat.id, 2, 3, "10");
    useWorkoutStore.getState().addSessionExerciseGroup(s.id, "슈퍼세트", 2);

    useWorkoutStore.getState().deleteSessionExercise(first.id);

    // The remaining exercise should still be there
    assert.equal(
      useWorkoutStore
        .getState()
        .sessionExercises.some((se) => se.id === second.id),
      true,
    );
    // And its order should be compacted to 1
    const remaining = useWorkoutStore
      .getState()
      .sessionExercises.find((se) => se.id === second.id);
    assert.equal(remaining.order, 1);
  });
});

// ──────────────────────────────────────────────
// Name Sanitization (shared across slices)
// ──────────────────────────────────────────────
describe("routineSlice: Name Sanitization", () => {
  test("truncates extremely long routine and session names", () => {
    const longName = "A".repeat(150);
    const r = useWorkoutStore.getState().addRoutine(longName);
    assert.equal(r.name.length, 100);
    assert.equal(r.name, "A".repeat(100));

    const s = useWorkoutStore.getState().addSession(r.id, longName);
    assert.equal(s.name.length, 100);
    assert.equal(s.name, "A".repeat(100));
  });

  test("resolves empty or whitespace-only inputs to safe defaults", () => {
    const r = useWorkoutStore.getState().addRoutine("   ");
    assert.ok(r.name.startsWith("새 루틴"));

    const s = useWorkoutStore.getState().addSession(r.id, "   ");
    assert.ok(s.name.startsWith("새 세션"));
  });
});
