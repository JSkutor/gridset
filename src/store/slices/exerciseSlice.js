import { EXERCISE_DICTIONARY } from "../../data/exerciseDictionary.js";
import { normalizeMuscleLabel } from "../../data/muscleGroups.js";
import { generateUUID } from "../../data/dummyGenerator.js";
import * as workoutRepository from "../../api/supabaseWorkoutRepository.js";
import { initialSeed, GUEST_USER } from "./authSlice.js";

export const createExerciseSlice = (set, get) => ({
  // --- State ---
  exercises: initialSeed.exercises,

  // --- Actions ---
  addExercise: (
    name,
    primary_muscle = null,
    equipment = null,
    unit = "kg",
    is_unilateral = false,
  ) => {
    const { currentUser, exercises } = get();
    const cleanName = (name || "").trim().slice(0, 100) || "이름 없는 운동";

    // 중복 방지 (정제된 이름 기준)
    const existing = exercises.find(
      (ex) => ex.name.toLowerCase() === cleanName.toLowerCase(),
    );
    if (existing) return existing;

    // 로컬 사전에 주동근/장비가 정의되어 있다면 가져옴
    let muscle = primary_muscle;
    let equip = equipment;
    let isUnilateral = is_unilateral;
    if (!muscle || !equip || !is_unilateral) {
      const dictEntry = EXERCISE_DICTIONARY.find(
        (ex) =>
          ex.name.toLowerCase() === cleanName.toLowerCase() ||
          (ex.synonyms && ex.synonyms.includes(cleanName.toLowerCase())),
      );
      if (dictEntry) {
        muscle = muscle || dictEntry.primaryMuscle;
        equip = equip || dictEntry.equipment;
        isUnilateral = is_unilateral || dictEntry.is_unilateral || false;
      }
    }

    const newExercise = {
      id: generateUUID(),
      name: cleanName,
      primary_muscle: normalizeMuscleLabel(muscle) || "기타",
      equipment: equip || "기타",
      unit,
      is_unilateral: isUnilateral,
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

  deleteExercise: (id) => {
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

  updateExercise: (id, updates) => {
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

  syncExercisesForReferences: async (exerciseIds, userId) => {
    if (!userId || userId === GUEST_USER.id) return;
    await workoutRepository.syncExercisesForReferences({
      exercises: get().exercises,
      exerciseIds,
      userId,
    });
  },
});
