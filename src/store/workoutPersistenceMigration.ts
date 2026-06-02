import type { WorkoutStore } from "./types.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Persist is version 1 only; no legacy schema upgrades. */
export function migrateWorkoutPersistState(
  persistedState: unknown,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _version: number,
): Partial<WorkoutStore> {
  return isRecord(persistedState)
    ? ({ ...persistedState } as Partial<WorkoutStore>)
    : {};
}
