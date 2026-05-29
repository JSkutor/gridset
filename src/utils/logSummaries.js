import { getFormattedSessionName, getSessionColor } from './sessionHelper';
import { getRecordMetric, toDate } from './logFormatters';

export function buildLogSummaries(workoutLogs, recordsByLogId) {
  return workoutLogs
    .map((log) => ({
      ...log,
      startDate: toDate(log.start_time),
      records: (recordsByLogId.get(log.id) || []).slice().sort((a, b) => {
        if (a.exercise_id === b.exercise_id) {
          if (a.set_number !== b.set_number) return a.set_number - b.set_number;
          return (a.side || '').localeCompare(b.side || '');
        }
        return a.exercise_id.localeCompare(b.exercise_id);
      }),
    }))
    .filter((log) => log.startDate)
    .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
}

export function buildExerciseSummaries(logSummaries, exercisesById) {
  const byExercise = new Map();

  logSummaries.forEach((log) => {
    const recordsByExercise = log.records.reduce((acc, record) => {
      if (!acc.has(record.exercise_id)) acc.set(record.exercise_id, []);
      acc.get(record.exercise_id).push(record);
      return acc;
    }, new Map());

    recordsByExercise.forEach((records, exerciseId) => {
      const exercise = exercisesById.get(exerciseId);
      if (!exercise) return;

      if (!byExercise.has(exerciseId)) {
        byExercise.set(exerciseId, { exercise, logs: [], setCount: 0, totalMetric: 0 });
      }

      const value = records.reduce((sum, record) => sum + getRecordMetric(record, exercise), 0);
      const summary = byExercise.get(exerciseId);

      summary.logs.push({
        key: `${log.id}:${exerciseId}`,
        workoutLogId: log.id,
        session_id: log.session_id,
        date: log.startDate,
        startTime: log.start_time,
        value,
        records: records.slice().sort((a, b) => {
          if (a.set_number !== b.set_number) return a.set_number - b.set_number;
          return (a.side || '').localeCompare(b.side || '');
        }),
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

export function buildRoutineSummaries(routines, sessions, sessionExercises, exercisesById, logSummaries) {
  const logCountBySession = logSummaries.reduce((acc, log) => {
    if (!log.session_id) return acc;
    if (!acc.has(log.session_id)) acc.set(log.session_id, []);
    acc.get(log.session_id).push(log);
    return acc;
  }, new Map());

  const maxSessionLogCount = Math.max(1, ...[...logCountBySession.values()].map((logs) => logs.length));

  return routines.map((routine) => {
    const routineSessions = sessions
      .filter((session) => session.routine_id === routine.id)
      .sort((a, b) => (a.session_order || 0) - (b.session_order || 0));

    const sessionSummaries = routineSessions.map((session) => {
      const linkedExercises = sessionExercises
        .filter((item) => item.session_id === session.id)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((item) => exercisesById.get(item.exercise_id))
        .filter(Boolean);

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

export function buildFreeWorkoutSummary(logSummaries, exercisesById) {
  const freeLogs = logSummaries.filter((log) => !log.session_id);
  if (freeLogs.length === 0) return null;

  const sortedLogs = freeLogs.slice().sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  const exerciseMap = new Map();
  freeLogs.forEach((log) => {
    log.records.forEach((record) => {
      const exercise = exercisesById.get(record.exercise_id);
      if (exercise) exerciseMap.set(exercise.id, exercise);
    });
  });

  return {
    firstDate: sortedLogs[0].startDate,
    lastDate: sortedLogs[sortedLogs.length - 1].startDate,
    logCount: freeLogs.length,
    exercises: [...exerciseMap.values()].sort((a, b) => a.name.localeCompare(b.name, 'ko')),
  };
}
