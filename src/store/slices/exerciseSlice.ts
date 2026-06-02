import { normalizeMuscleLabel } from "../../data/muscleGroups.js";
import * as workoutRepository from "../../api/supabaseWorkoutRepository.js";
import { initialSeed, GUEST_USER } from "./authSlice.js";
import type { Exercise, ExerciseUnit, Id } from "../../types/workout.js";
import type {
  ExerciseSlice,
  ExerciseUpdate,
  StoreSlice,
  WorkoutDataState,
} from "../types.js";

export const createExerciseSlice: StoreSlice<
  Pick<WorkoutDataState, "exercises"> & ExerciseSlice
> = (set, get) => ({
  // --- State ---
  exercises: initialSeed.exercises,

  // --- Actions ---
  addExercise: (
    name: string,
    primary_muscle: string | null = null,
    equipment: string | null = null,
    unit: ExerciseUnit = "kg",
    is_unilateral: boolean = false,
  ): Exercise => {
    const { currentUser, exercises } = get();
    const cleanName = (name || "").trim().slice(0, 100) || "이름 없는 운동";

    // 중복 방지 (정제된 이름 기준)
    const existing = exercises.find(
      (ex) => ex.name.toLowerCase() === cleanName.toLowerCase(),
    );
    if (existing) return existing;

    // 이미 로드된 exercises 카탈로그에서 주동근/장비 정보를 가져옴
    let muscle = primary_muscle;
    let equip = equipment;
    let isUnilateral = is_unilateral;
    if (!muscle || !equip || !is_unilateral) {
      const catalogEntry = exercises.find(
        (ex) =>
          ex.name.toLowerCase() === cleanName.toLowerCase() ||
          ex.synonyms?.some((syn) => syn.toLowerCase() === cleanName.toLowerCase()),
      );
      if (catalogEntry) {
        muscle = muscle || catalogEntry.primary_muscle;
        equip = equip || catalogEntry.equipment;
        isUnilateral = is_unilateral || catalogEntry.is_unilateral || false;
      }
    }

    const newExercise: Exercise = {
      id: crypto.randomUUID(),
      name: cleanName,
      secondaryMuscles: [],
      secondary_muscles: [],
      primary_muscle: normalizeMuscleLabel(muscle) || "기타",
      equipment: equip || "기타",
      category: "strength",
      unit,
      is_unilateral: isUnilateral,
      synonyms: [],
      user_id: currentUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    set((state) => ({ exercises: [...state.exercises, newExercise] }));

    if (!currentUser.isGuest) {
      get().runRemoteSync(
        "addExercise",
        () => workoutRepository.insertExercise(newExercise, currentUser.id),
        {
          dedupKey: "exercise:" + newExercise.id,
        },
      );
    }

    return newExercise;
  },

  deleteExercise: (id: Id) => {
    const { currentUser } = get();
    set((state) => ({
      exercises: state.exercises.filter((ex) => ex.id !== id),
    }));

    if (!currentUser.isGuest) {
      get().runRemoteSync(
        "deleteExercise",
        () => workoutRepository.deleteRow("exercises", id),
        {
          dedupKey: "exercise:" + id,
        },
      );
    }
  },

  updateExercise: (id: Id, updates: ExerciseUpdate) => {
    const { currentUser } = get();
    const updatedAt = new Date().toISOString();

    const cleanUpdates = { ...updates };
    if ("name" in cleanUpdates) {
      cleanUpdates.name =
        (cleanUpdates.name || "").trim().slice(0, 100) || "이름 없는 운동";
    }

    set((state) => ({
      exercises: state.exercises.map((ex) =>
        ex.id === id ? { ...ex, ...cleanUpdates, updated_at: updatedAt } : ex,
      ),
    }));

    if (!currentUser.isGuest) {
      get().runRemoteSync(
        "updateExercise",
        () => workoutRepository.updateExercise(id, cleanUpdates, updatedAt),
        {
          dedupKey: "exercise:" + id,
        },
      );
    }
  },

  fetchPublicExercises: async () => {
    try {
      const exercises = await workoutRepository.fetchPublicExerciseCatalog();
      set({ exercises });
    } catch (error) {
      console.error("Failed to fetch public exercises from Supabase:", error);
    }
  },

  syncExercisesForReferences: async (
    exerciseIds: Array<Id | null | undefined>,
    userId: Id | null | undefined,
  ) => {
    if (!userId || userId === GUEST_USER.id) return;
    await workoutRepository.syncExercisesForReferences({
      exercises: get().exercises,
      exerciseIds,
      userId,
    });
  },
});
