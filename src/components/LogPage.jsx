import { useMemo, useState } from 'react';
import { BarChart3, Calendar, ListChecks } from 'lucide-react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { useTabNavigation } from '../hooks/useTabNavigation';
import { getMonthStart, groupByDate } from '../utils/logFormatters';
import {
  buildExerciseSummaries,
  buildLogSummaries,
  buildRoutineSummaries,
} from '../utils/logSummaries';
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
    activeTab: activeView,
    setActiveTab: setActiveView,
    isActive,
    focusScopeSelector: LOG_FOCUS_SCOPE_SELECTOR,
    focusTargetSelector: getLogFocusTargetSelector,
    disableTransition: true,
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
