import {
  getFormattedSessionName,
  getRegularRoutineSessions,
  getRoutineTemporarySession,
  getSessionColor,
} from "./sessionHelper";
import { getRecordMetric, toDate } from "./logFormatters";
import type {
  Exercise,
  Id,
  Routine,
  Session,
  SessionExercise,
  SetRecord,
  Timestamp,
  WorkoutLog,
} from "../types/workout";

// ─── Exported Types ──────────────────────────────────────────

export type LogSummary = WorkoutLog & {
  startDate: Date;
  records: SetRecord[];
};

export type ExerciseLogSummary = {
  key: string;
  workoutLogId: Id;
  session_id: Id;
  date: Date;
  startTime: Timestamp;
  value: number;
  records: SetRecord[];
};

export type ExerciseSummary = {
  exercise: Exercise;
  logs: ExerciseLogSummary[];
  points: Array<{ key: string; date: Date; value: number }>;
  setCount: number;
  totalMetric: number;
};

export type RoutineSessionSummary = {
  id: Id;
  name: string;
  exercises: Exercise[];
  color: string;
  logCount: number;
  firstDate: Date | null;
  lastDate: Date | null;
  activityRatio: number;
};

export type RoutineSummary = {
  id: Id;
  name: string;
  sessions: RoutineSessionSummary[];
  logCount: number;
  exerciseCount: number;
  firstDate: Date | null;
  lastDate: Date | null;
};

// ─── Internal Types ──────────────────────────────────────────

type DatedWorkoutLog = WorkoutLog & {
  startDate: Date | null;
  records: SetRecord[];
};

// ─── Comparators ─────────────────────────────────────────────

function compareSetRecords(a: SetRecord, b: SetRecord): number {
  if (a.exercise_id !== b.exercise_id)
    return a.exercise_id.localeCompare(b.exercise_id);
  if (a.set_number !== b.set_number) return a.set_number - b.set_number;
  return (a.side || "").localeCompare(b.side || "");
}

// ─── Type Guards ─────────────────────────────────────────────

function hasStartDate(log: DatedWorkoutLog): log is LogSummary {
  return log.startDate !== null;
}

// ─── Record Grouping Helpers ─────────────────────────────────

/** groups an array of SetRecords by exercise_id */
function groupRecordsByExercise(records: SetRecord[]): Map<Id, SetRecord[]> {
  return records.reduce<Map<Id, SetRecord[]>>((acc, record) => {
    const group = acc.get(record.exercise_id);
    if (group) {
      group.push(record);
    } else {
      acc.set(record.exercise_id, [record]);
    }
    return acc;
  }, new Map());
}

function createExerciseLogSummary(
  log: LogSummary,
  exerciseId: Id,
  records: SetRecord[],
  value: number,
): ExerciseLogSummary {
  return {
    key: `${log.id}:${exerciseId}`,
    workoutLogId: log.id,
    session_id: log.session_id,
    date: log.startDate,
    startTime: log.start_time,
    value,
    records: records.slice().sort(compareSetRecords),
  };
}

function computeMetric(records: SetRecord[], exercise: Exercise): number {
  return records.reduce(
    (sum, record) => sum + getRecordMetric(record, exercise),
    0,
  );
}

function sortLogsByDateDesc<T extends { date: Date }>(logs: T[]): T[] {
  return logs.slice().sort((a, b) => b.date.getTime() - a.date.getTime());
}

function buildPointsFromLogs(
  logs: ExerciseLogSummary[],
): Array<{ key: string; date: Date; value: number }> {
  return logs
    .slice()
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map(({ key, date, value }) => ({ key, date, value }));
}

function compareExerciseSummaries(
  a: ExerciseSummary,
  b: ExerciseSummary,
): number {
  const latestA = a.logs[0]?.date?.getTime() || 0;
  const latestB = b.logs[0]?.date?.getTime() || 0;
  if (latestA !== latestB) return latestB - latestA;
  return a.exercise.name.localeCompare(b.exercise.name, "ko");
}

// ─── Main: Build Log Summaries ───────────────────────────────

export function buildLogSummaries(
  workoutLogs: WorkoutLog[],
  recordsByLogId: Map<Id, SetRecord[]>,
): LogSummary[] {
  return workoutLogs
    .map((log) => ({
      ...log,
      startDate: toDate(log.start_time),
      records: (recordsByLogId.get(log.id) || [])
        .slice()
        .sort(compareSetRecords),
    }))
    .filter(hasStartDate)
    .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
}

// ─── Main: Build Exercise Summaries ──────────────────────────

export function buildExerciseSummaries(
  logSummaries: LogSummary[],
  exercisesById: Map<Id, Exercise>,
): ExerciseSummary[] {
  const byExercise = new Map<Id, Omit<ExerciseSummary, "points">>();

  logSummaries.forEach((log) => {
    const recordsByExercise = groupRecordsByExercise(log.records);

    recordsByExercise.forEach((records, exerciseId) => {
      const exercise = exercisesById.get(exerciseId);
      if (!exercise) return;

      const value = computeMetric(records, exercise);
      const existing = byExercise.get(exerciseId);

      if (existing) {
        existing.logs.push(
          createExerciseLogSummary(log, exerciseId, records, value),
        );
        existing.setCount += records.length;
        existing.totalMetric += value;
      } else {
        byExercise.set(exerciseId, {
          exercise,
          logs: [createExerciseLogSummary(log, exerciseId, records, value)],
          setCount: records.length,
          totalMetric: value,
        });
      }
    });
  });

  return [...byExercise.values()]
    .map((summary) => ({
      ...summary,
      logs: sortLogsByDateDesc(summary.logs),
      points: buildPointsFromLogs(summary.logs),
    }))
    .sort(compareExerciseSummaries);
}

// ─── Routine Summaries Helpers ───────────────────────────────

/** groups LogSummaries by session_id */
function groupLogsBySessionId(
  logSummaries: LogSummary[],
): Map<Id, LogSummary[]> {
  return logSummaries.reduce<Map<Id, LogSummary[]>>((acc, log) => {
    if (!log.session_id) return acc;
    const group = acc.get(log.session_id);
    if (group) {
      group.push(log);
    } else {
      acc.set(log.session_id, [log]);
    }
    return acc;
  }, new Map());
}

function computeActivityRatio(
  sessionLogCount: number,
  maxSessionLogCount: number,
): number {
  return Math.max(8, (sessionLogCount / Math.max(1, maxSessionLogCount)) * 100);
}

function getLinkedExercises(
  sessionId: Id,
  sessionExercises: SessionExercise[],
  exercisesById: Map<Id, Exercise>,
): Exercise[] {
  return sessionExercises
    .filter((item) => item.session_id === sessionId)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((item) => exercisesById.get(item.exercise_id))
    .filter((ex): ex is Exercise => Boolean(ex));
}

function buildRoutineSessionSummary(
  session: Session,
  allSessions: Session[],
  sessionExercises: SessionExercise[],
  exercisesById: Map<Id, Exercise>,
  sessionLogs: LogSummary[],
  maxSessionLogCount: number,
): RoutineSessionSummary {
  const sortedLogs = sessionLogs
    .slice()
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  return {
    id: session.id,
    name: getFormattedSessionName(session, allSessions),
    exercises: getLinkedExercises(session.id, sessionExercises, exercisesById),
    color: getSessionColor(session),
    logCount: sessionLogs.length,
    firstDate: sortedLogs[0]?.startDate || toDate(session.created_at),
    lastDate: sortedLogs[sortedLogs.length - 1]?.startDate || null,
    activityRatio: computeActivityRatio(sessionLogs.length, maxSessionLogCount),
  };
}

// ─── Main: Build Routine Summaries ───────────────────────────

export function buildRoutineSummaries(
  routines: Routine[],
  sessions: Session[],
  sessionExercises: SessionExercise[],
  exercisesById: Map<Id, Exercise>,
  logSummaries: LogSummary[],
): RoutineSummary[] {
  const logsBySession = groupLogsBySessionId(logSummaries);
  const maxSessionLogCount = Math.max(
    1,
    ...[...logsBySession.values()].map((logs) => logs.length),
  );

  return routines
    .map((routine) => {
      const regularSessions = getRegularRoutineSessions(sessions, routine.id);
      const temporarySession = getRoutineTemporarySession(sessions, routine.id);
      const routineSessions = temporarySession
        ? [...regularSessions, temporarySession]
        : regularSessions;

      const sessionSummaries = routineSessions.map((session) =>
        buildRoutineSessionSummary(
          session,
          sessions,
          sessionExercises,
          exercisesById,
          logsBySession.get(session.id) || [],
          maxSessionLogCount,
        ),
      );

      const routineLogs = sessionSummaries.flatMap(
        (summary) => logsBySession.get(summary.id) || [],
      );
      const sortedRoutineLogs = routineLogs
        .slice()
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
      const uniqueExerciseIds = new Set(
        sessionSummaries.flatMap((summary) =>
          summary.exercises.map((ex) => ex.id),
        ),
      );

      return {
        id: routine.id,
        name: routine.name,
        sessions: sessionSummaries,
        logCount: routineLogs.length,
        exerciseCount: uniqueExerciseIds.size,
        firstDate:
          sortedRoutineLogs[0]?.startDate || toDate(routine.created_at),
        lastDate:
          sortedRoutineLogs[sortedRoutineLogs.length - 1]?.startDate || null,
      };
    })
    .sort((a, b) => {
      const dateA = a.firstDate?.getTime() || 0;
      const dateB = b.firstDate?.getTime() || 0;
      return dateB - dateA;
    });
}
