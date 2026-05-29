import { useMemo, useState } from 'react';
import { BarChart3, Calendar, ListChecks } from 'lucide-react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { useTabNavigation } from '../hooks/useTabNavigation';
import { getFormattedSessionName, getSessionColor } from '../utils/sessionHelper';
import { toDate, getMonthStart, groupByDate, getRecordMetric } from '../utils/logFormatters';
import DailyLogView from './log/DailyLogView';
import ExerciseView from './log/ExerciseView';
import RoutineTimeline from './log/RoutineTimeline';

// ─── Log View Definitions ───────────────────────────────────────────────────

const LOG_VIEWS = [
  {
    id: 'daily',
    label: '일일',
    shortcut: 'A',
    description: '달력과 하루 기록',
    icon: Calendar,
  },
  {
    id: 'exercise',
    label: '운동별',
    shortcut: 'S',
    description: '종목별 추이와 전체 기록',
    icon: BarChart3,
  },
  {
    id: 'routine',
    label: '루틴 로그',
    shortcut: 'D',
    description: '루틴 시작과 구성 변화',
    icon: ListChecks,
  },
];

// Shortcut map: KeyA → daily, KeyS → exercise, KeyD → routine
const LOG_VIEW_SHORTCUTS = { KeyA: 'daily', KeyS: 'exercise', KeyD: 'routine' };
const LOG_VIEW_IDS = LOG_VIEWS.map((v) => v.id);
const LOG_FOCUS_SCOPE_SELECTOR = '[data-tab-navigation="log"]';
const getLogFocusTargetSelector = (viewId) =>
  `${LOG_FOCUS_SCOPE_SELECTOR} [data-tab-id="${viewId}"]`;

// ─── Data Preparation ────────────────────────────────────────

function buildLogSummaries(workoutLogs, recordsByLogId) {
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

function buildExerciseSummaries(logSummaries, exercisesById) {
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

function buildRoutineSummaries(routines, sessions, sessionExercises, exercisesById, logSummaries) {
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
      const label = getFormattedSessionName(session, sessions);

      return {
        id: session.id,
        name: label,
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

function buildFreeWorkoutSummary(logSummaries, exercisesById) {
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

// ─── LogPage Component ───────────────────────────────────────

export default function LogPage({ isActive = true }) {
  // ── Store Selectors ──
  const workoutLogs = useWorkoutStore((state) => state.workoutLogs);
  const setRecords = useWorkoutStore((state) => state.setRecords);
  const exercises = useWorkoutStore((state) => state.exercises);
  const sessions = useWorkoutStore((state) => state.sessions);
  const routines = useWorkoutStore((state) => state.routines);
  const sessionExercises = useWorkoutStore((state) => state.sessionExercises);

  // ── Tab State ──
  const [activeView, setActiveView] = useState('daily');

  // ── A / S / D: switch log sub-tabs (only while Log page is visible) ──
  useTabNavigation({
    tabIds: LOG_VIEW_IDS,
    shortcuts: LOG_VIEW_SHORTCUTS,
    setActiveTab: setActiveView,
    isActive,
    focusScopeSelector: LOG_FOCUS_SCOPE_SELECTOR,
    focusTargetSelector: getLogFocusTargetSelector,
  });

  // ── Lookup Maps ──
  const exercisesById = useMemo(() => new Map(exercises.map((ex) => [ex.id, ex])), [exercises]);
  const sessionsById = useMemo(() => new Map(sessions.map((s) => [s.id, s])), [sessions]);
  const routinesById = useMemo(() => new Map(routines.map((r) => [r.id, r])), [routines]);

  const recordsByLogId = useMemo(() => {
    return setRecords.reduce((acc, record) => {
      if (!acc.has(record.workout_log_id)) acc.set(record.workout_log_id, []);
      acc.get(record.workout_log_id).push(record);
      return acc;
    }, new Map());
  }, [setRecords]);

  // ── Derived Data ──
  const logSummaries = useMemo(() => buildLogSummaries(workoutLogs, recordsByLogId), [workoutLogs, recordsByLogId]);
  const logsByDate = useMemo(() => groupByDate(logSummaries, (log) => log.startDate), [logSummaries]);
  const exerciseSummaries = useMemo(() => buildExerciseSummaries(logSummaries, exercisesById), [logSummaries, exercisesById]);
  const routineSummaries = useMemo(() => buildRoutineSummaries(routines, sessions, sessionExercises, exercisesById, logSummaries), [routines, sessions, sessionExercises, exercisesById, logSummaries]);
  const freeWorkoutSummary = useMemo(() => buildFreeWorkoutSummary(logSummaries, exercisesById), [logSummaries, exercisesById]);

  // ── Date Navigation State ──
  const initialDate = logSummaries[0]?.startDate || new Date();
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [monthDate, setMonthDate] = useState(getMonthStart(initialDate));
  const [exerciseMonthDate, setExerciseMonthDate] = useState(getMonthStart(initialDate));
  const [selectedExerciseId, setSelectedExerciseId] = useState(exerciseSummaries[0]?.exercise.id || null);

  return (
    <div className="log-page">
      <div className="log-content">
        {activeView === 'daily' && (
          <DailyLogView
            logSummaries={logSummaries}
            logsByDate={logsByDate}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            monthDate={monthDate}
            setMonthDate={setMonthDate}
            exercisesById={exercisesById}
            sessionsById={sessionsById}
            routinesById={routinesById}
          />
        )}

        {activeView === 'exercise' && (
          <ExerciseView
            exerciseSummaries={exerciseSummaries}
            selectedExerciseId={selectedExerciseId}
            setSelectedExerciseId={setSelectedExerciseId}
            exerciseMonthDate={exerciseMonthDate}
            setExerciseMonthDate={setExerciseMonthDate}
            sessionsById={sessionsById}
          />
        )}

        {activeView === 'routine' && (
          <RoutineTimeline
            routineSummaries={routineSummaries}
            freeWorkoutSummary={freeWorkoutSummary}
          />
        )}
      </div>

      <aside className="log-sidebar" aria-label="로그 보기" data-tab-navigation="log">
        {LOG_VIEWS.map((view) => {
          const Icon = view.icon;
          const isActiveView = activeView === view.id;
          return (
            <button
              key={view.id}
              type="button"
              data-tab-id={view.id}
              className={`log-sidebar-button ${isActiveView ? 'is-active' : ''}`}
              onClick={() => setActiveView(view.id)}
              title={`${view.label} (${view.shortcut})`}
              aria-keyshortcuts={view.shortcut}
            >
              <Icon size={17} />
              <span>
                <strong>{view.label}</strong>
                <i>{view.description}</i>
              </span>
              <kbd className="log-sidebar-shortcut">{view.shortcut}</kbd>
            </button>
          );
        })}
      </aside>
    </div>
  );
}
