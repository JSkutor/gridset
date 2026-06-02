import { test, describe, beforeEach } from "vitest";
import assert from "node:assert/strict";

const { useWorkoutStore } = await import("../useWorkoutStore.js");
const { EXERCISE_CATALOG } = await import("../../data/dummyGenerator.js");

const guestUser = {
  id: "00000000-0000-0000-0000-000000000000",
  name: "게스트",
  isGuest: true,
};

beforeEach(() => {
  window.localStorage.clear();
  useWorkoutStore.setState({ exercises: [...EXERCISE_CATALOG] });
  useWorkoutStore.getState().clearAllData();
  useWorkoutStore.setState({ currentUser: guestUser });
});

// ──────────────────────────────────────────────
// addExercise
// ──────────────────────────────────────────────
describe("exerciseSlice: addExercise", () => {
  test("creates a new exercise with trimmed name and defaults", () => {
    const ex = useWorkoutStore
      .getState()
      .addExercise("  나만의 운동  ", "가슴", "덤벨", "kg", false);
    assert.equal(ex.name, "나만의 운동");
    assert.equal(ex.primary_muscle, "대흉근"); // '가슴' → normalizeMuscleLabel → '대흉근'
    assert.equal(ex.equipment, "덤벨");
    assert.equal(ex.unit, "kg");
    assert.equal(ex.is_unilateral, false);
    assert.equal(ex.category, "strength");
    assert.ok(ex.id);
  });

  test("uses fallback name for empty input", () => {
    const ex = useWorkoutStore.getState().addExercise("");
    assert.equal(ex.name, "이름 없는 운동");
  });

  test("uses fallback name for whitespace-only input", () => {
    const ex = useWorkoutStore.getState().addExercise("   ");
    assert.equal(ex.name, "이름 없는 운동");
  });

  test("prevents case-insensitive duplicates and returns existing exercise", () => {
    const first = useWorkoutStore
      .getState()
      .addExercise("테스트 컬", "이두", "덤벨");
    const second = useWorkoutStore
      .getState()
      .addExercise("테스트 컬", "어깨", "바벨");

    assert.equal(second.id, first.id);
    assert.equal(second.primary_muscle, first.primary_muscle); // 첫 번째 값 유지
    assert.equal(
      useWorkoutStore
        .getState()
        .exercises.filter((ex) => ex.name === "테스트 컬").length,
      1,
    );
  });

  test("catalog lookup fills missing primary_muscle and equipment from existing catalog entry", () => {
    // '덤벨 플로어 프레스': primaryMuscle='상완삼두근', equipment='덤벨'
    const ex = useWorkoutStore
      .getState()
      .addExercise("덤벨 플로어 프레스", null, null, "kg", false);
    assert.equal(ex.primary_muscle, "상완삼두근");
    assert.equal(ex.equipment, "덤벨");
  });

  test("truncates extremely long exercise name to 100 characters", () => {
    const longName = "X".repeat(150);
    const ex = useWorkoutStore.getState().addExercise(longName, "기타", "기타");
    assert.equal(ex.name.length, 100);
    assert.equal(ex.name, "X".repeat(100));
  });

  test("sets default muscle/equipment when no catalog match and no args provided", () => {
    const ex = useWorkoutStore.getState().addExercise("완전히 새로운 운동명");
    assert.equal(ex.primary_muscle, "기타");
    assert.equal(ex.equipment, "기타");
  });

  test("recognizes exercises by synonym in catalog", () => {
    // '덤벤프'는 '덤벨 벤치프레스'의 synonyms에 등록
    const ex = useWorkoutStore
      .getState()
      .addExercise("덤벤프", null, null, "kg", false);
    assert.equal(ex.name, "덤벤프"); // addExercise는 입력 이름을 그대로 사용
    assert.equal(ex.primary_muscle, "대흉근"); // synonym 매칭을 통해 catalog에서 '덤벨 벤치프레스'의 정보 사용
    assert.equal(ex.equipment, "덤벨");
  });

  test("assigns correct unit, defaulting to kg", () => {
    const exKg = useWorkoutStore
      .getState()
      .addExercise("Kg 운동", "가슴", "덤벨", "kg");
    assert.equal(exKg.unit, "kg");

    const exLb = useWorkoutStore
      .getState()
      .addExercise("Lb 운동", "가슴", "덤벨", "lb");
    assert.equal(exLb.unit, "lb");

    const exBody = useWorkoutStore
      .getState()
      .addExercise("Body 운동", "가슴", "맨몸", "bodyweight");
    assert.equal(exBody.unit, "bodyweight");
  });
});

// ──────────────────────────────────────────────
// updateExercise
// ──────────────────────────────────────────────
describe("exerciseSlice: updateExercise", () => {
  test("updates exercise properties", () => {
    const ex = useWorkoutStore
      .getState()
      .addExercise("나만의 런지", "대퇴사두", "덤벨", "kg", false);
    assert.equal(ex.is_unilateral, false);

    useWorkoutStore.getState().updateExercise(ex.id, { is_unilateral: true });
    const updated = useWorkoutStore
      .getState()
      .exercises.find((e) => e.id === ex.id);
    assert.equal(updated.is_unilateral, true);
  });

  test("updates name with trimming", () => {
    const ex = useWorkoutStore
      .getState()
      .addExercise("Old Name", "가슴", "바벨");
    useWorkoutStore.getState().updateExercise(ex.id, { name: "  New Name  " });
    const updated = useWorkoutStore
      .getState()
      .exercises.find((e) => e.id === ex.id);
    assert.equal(updated.name, "New Name");
  });

  test("uses fallback for empty name update", () => {
    const ex = useWorkoutStore
      .getState()
      .addExercise("Original", "가슴", "바벨");
    useWorkoutStore.getState().updateExercise(ex.id, { name: "" });
    const updated = useWorkoutStore
      .getState()
      .exercises.find((e) => e.id === ex.id);
    assert.equal(updated.name, "이름 없는 운동");
  });

  test("updates multiple fields at once", () => {
    const ex = useWorkoutStore.getState().addExercise("Ex", "가슴", "바벨");
    useWorkoutStore.getState().updateExercise(ex.id, {
      name: "Updated Ex",
      primary_muscle: "등",
      equipment: "덤벨",
    });
    const updated = useWorkoutStore
      .getState()
      .exercises.find((e) => e.id === ex.id);
    assert.equal(updated.name, "Updated Ex");
    assert.equal(updated.primary_muscle, "등");
    assert.equal(updated.equipment, "덤벨");
  });
});

// ──────────────────────────────────────────────
// deleteExercise
// ──────────────────────────────────────────────
describe("exerciseSlice: deleteExercise", () => {
  test("removes exercise from the store", () => {
    const ex = useWorkoutStore
      .getState()
      .addExercise("삭제할 운동", "가슴", "덤벨");
    assert.equal(
      useWorkoutStore.getState().exercises.some((e) => e.id === ex.id),
      true,
    );

    useWorkoutStore.getState().deleteExercise(ex.id);
    assert.equal(
      useWorkoutStore.getState().exercises.some((e) => e.id === ex.id),
      false,
    );
  });

  test("handles deleting non-existent exercise gracefully", () => {
    const initialCount = useWorkoutStore.getState().exercises.length;
    useWorkoutStore.getState().deleteExercise("non-existent");
    assert.equal(useWorkoutStore.getState().exercises.length, initialCount);
  });
});

// ──────────────────────────────────────────────
// Edge Cases & State Integrity
// ──────────────────────────────────────────────
describe("exerciseSlice: Edge Cases", () => {
  test("exercise catalog remains intact after clearAllData", async () => {
    const catalogCount = EXERCISE_CATALOG.length;
    const initialCount = useWorkoutStore.getState().exercises.length;
    assert.ok(initialCount >= catalogCount);

    useWorkoutStore.getState().clearAllData();
    // clearAllData preserves exercises (catalog)
    assert.ok(useWorkoutStore.getState().exercises.length >= catalogCount);
  });

  test("new exercise has synonyms as empty array", () => {
    const ex = useWorkoutStore
      .getState()
      .addExercise("신규 운동", "가슴", "덤벨");
    assert.deepEqual(ex.synonyms, []);
  });

  test("new exercise gets secondaryMuscles and secondary_muscles as empty arrays", () => {
    const ex = useWorkoutStore.getState().addExercise("신규2", "가슴", "덤벨");
    assert.deepEqual(ex.secondaryMuscles, []);
    assert.deepEqual(ex.secondary_muscles, []);
  });
});
