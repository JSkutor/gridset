import {
  getFormattedSessionName,
  getRegularRoutineSessions,
  getRoutineTemporarySession,
  getSessionColor,
} from './sessionHelper';
import { getRecordMetric, toDate } from './logFormatters';
import type { Exercise, Id, Routine, Session, SessionExercise, SetRecord, Timestamp, WorkoutLog } from '../types/workout';

type DatedWorkoutLog = WorkoutLog & {
  startDate: Date | null;
  records: SetRecord[];
};

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

function hasStartDate(log: DatedWorkoutLog): log is LogSummary {
  return log.startDate !== null;
}

function compareSetRecords(a: SetRecord, b: SetRecord): number {
  if (a.exercise_id === b.exercise_id) {
    if (a.set_number !== b.set_number) return a.set_number - b.set_number;
    return (a.side || '').localeCompare(b.side || '');
  }
  return a.exercise_id.localeCompare(b.exercise_id);
}

function getOrCreateExerciseSummary(
  summaries: Map<Id, Omit<ExerciseSummary, 'points'>>,
  exerciseId: Id,
  exercise: Exercise,
): Omit<ExerciseSummary, 'points'> {
  const existing = summaries.get(exerciseId);
  if (existing) return existing;

  const created = { exercise, logs: [], setCount: 0, totalMetric: 0 };
  summaries.set(exerciseId, created);
  return created;
}

export function buildLogSummaries(
  workoutLogs: WorkoutLog[],
  recordsByLogId: Map<Id, SetRecord[]>,
): LogSummary[] {
  return workoutLogs
    .map((log) => ({
      ...log,
      startDate: toDate(log.start_time),
      records: (recordsByLogId.get(log.id) || []).slice().sort(compareSetRecords),
    }))
    .filter(hasStartDate)
    .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
}

export function buildExerciseSummaries(
  logSummaries: LogSummary[],
  exercisesById: Map<Id, Exercise>,
): ExerciseSummary[] {
  const byExercise = new Map<Id, Omit<ExerciseSummary, 'points'>>();

  logSummaries.forEach((log) => {
    const recordsByExercise = log.records.reduce<Map<Id, SetRecord[]>>((acc, record) => {
      if (!acc.has(record.exercise_id)) acc.set(record.exercise_id, []);
      acc.get(record.exercise_id)?.push(record);
      return acc;
    }, new Map());

    recordsByExercise.forEach((records, exerciseId) => {
      const exercise = exercisesById.get(exerciseId);
      if (!exercise) return;

      const value = records.reduce((sum, record) => sum + getRecordMetric(record, exercise), 0);
      const summary = getOrCreateExerciseSummary(byExercise, exerciseId, exercise);

      summary.logs.push({
        key: `${log.id}:${exerciseId}`,
        workoutLogId: log.id,
        session_id: log.session_id,
        date: log.startDate,
        startTime: log.start_time,
        value,
        records: records.slice().sort(compareSetRecords),
      });
      summary.setCount += records.length;
      summary.totalMetric += value;
    });
  });

  return [...byExercise.values()]
    .map((summary) => ({
      ...summary,
      logs: summary.logs.sort((a, b) => b.date.getTime() - a.date.getTime()),
      points: summary.logs
        .slice()
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map((log) => ({ key: log.key, date: log.date, value: log.value })),
    }))
    .sort((a, b) => {
      const latestA = a.logs[0]?.date?.getTime() || 0;
      const latestB = b.logs[0]?.date?.getTime() || 0;
      if (latestA !== latestB) return latestB - latestA;
      return a.exercise.name.localeCompare(b.exercise.name, 'ko');
    });
}

function isExercise(exercise: Exercise | undefined): exercise is Exercise {
  return Boolean(exercise);
}

export function buildRoutineSummaries(
  routines: Routine[],
  sessions: Session[],
  sessionExercises: SessionExercise[],
  exercisesById: Map<Id, Exercise>,
  logSummaries: LogSummary[],
): RoutineSummary[] {
  const logCountBySession = logSummaries.reduce<Map<Id, LogSummary[]>>((acc, log) => {
    if (!log.session_id) return acc;
    if (!acc.has(log.session_id)) acc.set(log.session_id, []);
    acc.get(log.session_id)?.push(log);
    return acc;
  }, new Map());

  const maxSessionLogCount = Math.max(1, ...[...logCountBySession.values()].map((logs) => logs.length));

  return routines.map((routine) => {
    const regularSessions = getRegularRoutineSessions(sessions, routine.id);
    const temporarySession = getRoutineTemporarySession(sessions, routine.id);
    const routineSessions = temporarySession ? [...regularSessions, temporarySession] : regularSessions;

    const sessionSummaries = routineSessions.map((session) => {
      const linkedExercises = sessionExercises
        .filter((item) => item.session_id === session.id)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((item) => exercisesById.get(item.exercise_id))
        .filter(isExercise);

      const sessionLogs = logCountBySession.get(session.id) || [];
      const sortedLogs = sessionLogs.slice().sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

      return {
        id: session.id,
        name: getFormattedSessionName(session, sessions),
        exercises: linkedExercises,
        color: getSessionColor(session),
        logCount: sessionLogs.length,
        firstDate: sortedLogs[0]?.startDate || toDate(session.created_at),
        lastDate: sortedLogs[sortedLogs.length - 1]?.startDate || null,
        activityRatio: Math.max(8, (sessionLogs.length / maxSessionLogCount) * 100),
      };
    });

    const routineLogs = sessionSummaries.flatMap((session) => logCountBySession.get(session.id) || []);
    const sortedRoutineLogs = routineLogs.slice().sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    const uniqueExerciseIds = new Set(sessionSummaries.flatMap((session) => session.exercises.map((exercise) => exercise.id)));

    return {
      id: routine.id,
      name: routine.name,
      sessions: sessionSummaries,
      logCount: routineLogs.length,
      exerciseCount: uniqueExerciseIds.size,
      firstDate: sortedRoutineLogs[0]?.startDate || toDate(routine.created_at),
      lastDate: sortedRoutineLogs[sortedRoutineLogs.length - 1]?.startDate || null,
    };
  }).sort((a, b) => {
    const dateA = a.firstDate?.getTime() || 0;
    const dateB = b.firstDate?.getTime() || 0;
    return dateB - dateA;
  });
}
