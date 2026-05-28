import { useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dumbbell,
  History,
  ListChecks,
  Timer,
} from 'lucide-react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { getFormattedSessionName, getSessionColor } from '../utils/sessionHelper';

const LOG_VIEWS = [
  {
    id: 'daily',
    label: '일일',
    description: '달력과 하루 기록',
    icon: Calendar,
  },
  {
    id: 'exercise',
    label: '운동별',
    description: '종목별 추이와 전체 기록',
    icon: BarChart3,
  },
  {
    id: 'routine',
    label: '루틴 로그',
    description: '루틴 시작과 구성 변화',
    icon: ListChecks,
  },
];

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getDateKey(date) {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMonthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatDate(value, options = {}) {
  const date = value instanceof Date ? value : toDate(value);
  if (!date) return '날짜 없음';
  return date.toLocaleDateString('ko-KR', options);
}

function formatTime(value) {
  const date = toDate(value);
  if (!date) return '--:--';
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatDateTime(value) {
  const date = toDate(value);
  if (!date) return '시간 없음';
  return date.toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatDuration(startValue, endValue) {
  const start = toDate(startValue);
  const end = toDate(endValue);
  if (!start || !end) return endValue ? '시간 없음' : '진행 중';

  const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  if (minutes < 60) return `${minutes}분`;

  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  return restMinutes === 0 ? `${hours}시간` : `${hours}시간 ${restMinutes}분`;
}

function getExerciseUnit(exercise) {
  return exercise?.unit || 'kg';
}

function getExerciseDisplayUnit(exercise) {
  const unit = getExerciseUnit(exercise);
  if (unit === 'sec') return '초';
  if (unit === 'reps') return '회';
  return 'kg';
}

function getMetricLabel(exercise) {
  const unit = getExerciseUnit(exercise);
  if (unit === 'sec') return '총 시간';
  if (unit === 'reps') return '총 반복';
  return '볼륨';
}

function isBodyweightMetric(exercise) {
  const unit = getExerciseUnit(exercise);
  return unit === 'reps' || unit === 'sec';
}

function getRecordMetric(record, exercise) {
  const recordValue = Number(record.record) || 0;
  if (isBodyweightMetric(exercise)) return recordValue;
  return (Number(record.weight) || 0) * recordValue;
}

function formatMetric(value, exercise) {
  const rounded = Number.isInteger(value) ? value : Math.round(value * 10) / 10;
  if (isBodyweightMetric(exercise)) return `${rounded.toLocaleString()} ${getExerciseDisplayUnit(exercise)}`;
  return `${rounded.toLocaleString()} kg`;
}

function formatSetCellValue(value) {
  return value === null || value === undefined || value === '' ? '0' : value;
}

function buildCalendarCells(monthDate) {
  const firstDay = getMonthStart(monthDate);
  const sundayOffset = firstDay.getDay();
  const cursor = new Date(firstDay);
  cursor.setDate(cursor.getDate() - sundayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(cursor);
    date.setDate(cursor.getDate() + index);
    return {
      date,
      key: getDateKey(date),
      isCurrentMonth: date.getMonth() === monthDate.getMonth(),
    };
  });
}

function groupByDate(items, getDate) {
  return items.reduce((acc, item) => {
    const date = getDate(item);
    const key = getDateKey(date);
    if (!key) return acc;
    if (!acc.has(key)) acc.set(key, []);
    acc.get(key).push(item);
    return acc;
  }, new Map());
}

function getCalendarMarkerColors(dayItems, sessionsById) {
  const seen = new Set();
  const colors = [];

  dayItems.forEach((log) => {
    const session = sessionsById.get(log.session_id);
    const key = session?.id || 'free-workout';
    if (seen.has(key)) return;

    seen.add(key);
    colors.push(session ? getSessionColor(session) : '#6B7394');
  });

  return colors;
}

function EmptyState({ title, body }) {
  return (
    <div className="log-empty-state">
      <History size={22} />
      <strong>{title}</strong>
      <span>{body}</span>
    </div>
  );
}

function StatPill({ label, value, icon: Icon }) {
  return (
    <div className="log-stat-pill">
      <Icon size={14} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SetRecordTable({ records, exercise, compact = false }) {
  const hasMemo = records.some((record) => record.memo && record.memo.trim());

  return (
    <div className={`log-set-grid-wrap ${compact ? 'log-set-grid-wrap--compact' : ''}`}>
      <table className={`log-set-grid ${hasMemo ? 'has-memo' : ''}`} aria-label={`${exercise?.name || '운동'} 세트 기록`}>
        <colgroup>
          <col className="log-set-col" />
          <col className="log-value-col" />
          <col className="log-value-col" />
          {hasMemo && <col className="log-memo-col" />}
        </colgroup>
        <thead>
          <tr>
            <th>
              <span className="log-grid-header-badge">Set</span>
            </th>
            <th>
              <span className="log-grid-header-badge log-grid-header-badge--accent">kg</span>
            </th>
            <th>
              <span className="log-grid-header-badge log-grid-header-badge--accent">reps</span>
            </th>
            {hasMemo && (
              <th>
                <span className="log-grid-header-badge log-grid-header-badge--memo">memo</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              <td className="cell-set">{record.set_number}</td>
              <td className="cell-value">{formatSetCellValue(record.weight)}</td>
              <td className="cell-value">{formatSetCellValue(record.record)}</td>
              {hasMemo && (
                <td className="cell-memo">
                  {record.memo && record.memo.trim() ? (
                    <span className="log-set-memo-chip">{record.memo.trim()}</span>
                  ) : (
                    <span className="log-set-memo-empty">-</span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LogCalendar({ monthDate, selectedDateKey, activityByDate, sessionsById, onSelectDate, onMonthChange }) {
  const cells = useMemo(() => buildCalendarCells(monthDate), [monthDate]);

  return (
    <section className="log-panel log-calendar-panel">
      <div className="log-panel-header">
        <div>
          <span className="log-kicker">Calendar</span>
          <h2>{formatDate(monthDate, { year: 'numeric', month: 'long' })}</h2>
        </div>
        <div className="log-icon-button-group">
          <button type="button" className="log-icon-button" onClick={() => onMonthChange(-1)} title="이전 달">
            <ChevronLeft size={16} />
          </button>
          <button type="button" className="log-icon-button" onClick={() => onMonthChange(1)} title="다음 달">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="log-calendar-weekdays">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="log-calendar-grid" aria-label="운동 기록 달력">
        {cells.map((cell) => {
          const dayItems = activityByDate.get(cell.key) || [];
          const count = dayItems.length;
          const markerColors = getCalendarMarkerColors(dayItems, sessionsById);
          const primaryMarkerColor = markerColors[0] || '#6B7394';
          const isSelected = selectedDateKey === cell.key;

          return (
            <button
              key={cell.key}
              type="button"
              className={[
                'log-calendar-cell',
                !cell.isCurrentMonth ? 'is-outside-month' : '',
                count > 0 ? 'has-activity' : '',
                isSelected ? 'is-selected' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => onSelectDate(cell.date)}
              title={`${formatDate(cell.date, { month: 'long', day: 'numeric' })} 기록 ${count}개`}
              style={{
                '--activity-border': `${primaryMarkerColor}4D`,
              }}
            >
              <span>{cell.date.getDate()}</span>
              {count > 0 && (
                <span className="log-calendar-activity-marks" aria-hidden="true">
                  {markerColors.slice(0, 3).map((color, markerIndex) => (
                    <span
                      key={`${color}-${markerIndex}`}
                      className="log-calendar-check-mark"
                      style={{ '--session-color': color }}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function DailyLogCard({ log, records, exercisesById, session, routine }) {
  const groupedRecords = useMemo(() => {
    const byExercise = records.reduce((acc, record) => {
      if (!acc.has(record.exercise_id)) acc.set(record.exercise_id, []);
      acc.get(record.exercise_id).push(record);
      return acc;
    }, new Map());

    return [...byExercise.entries()].map(([exerciseId, exerciseRecords]) => {
      const exercise = exercisesById.get(exerciseId);
      return {
        exercise,
        records: [...exerciseRecords].sort((a, b) => a.set_number - b.set_number),
      };
    });
  }, [records, exercisesById]);

  return (
    <article className="log-record-card">
      <div className="log-record-card-header">
        <div>
          <h3>{session ? getFormattedSessionName(session, []) : '자유 운동'}</h3>
          <span>{routine?.name || '루틴 없음'}</span>
        </div>
        <div className="log-time-chip">
          <Clock size={13} />
          {formatTime(log.start_time)} - {log.end_time ? formatTime(log.end_time) : '진행 중'}
        </div>
      </div>

      <div className="log-record-meta">
        <span><Timer size={13} />{formatDuration(log.start_time, log.end_time)}</span>
        <span><Dumbbell size={13} />{records.length}세트</span>
      </div>

      <div className="log-exercise-stack">
        {groupedRecords.map(({ exercise, records: exerciseRecords }) => (
          <div className="log-exercise-record-row" key={exercise?.id || exerciseRecords[0]?.exercise_id}>
            <div className="log-exercise-record-meta">
              <strong>{exercise?.name || '알 수 없는 운동'}</strong>
              <span>{exerciseRecords.length}세트</span>
            </div>
            <SetRecordTable records={exerciseRecords} exercise={exercise} />
          </div>
        ))}
      </div>
    </article>
  );
}

function DailyLogView({ logSummaries, logsByDate, selectedDate, setSelectedDate, monthDate, setMonthDate, exercisesById, sessionsById, routinesById }) {
  const selectedDateKey = getDateKey(selectedDate);
  const selectedLogs = (logsByDate.get(selectedDateKey) || [])
    .slice()
    .sort((a, b) => toDate(a.start_time)?.getTime() - toDate(b.start_time)?.getTime());

  const selectedRecords = selectedLogs.flatMap((log) => log.records);
  const totalMinutes = selectedLogs.reduce((sum, log) => {
    const start = toDate(log.start_time);
    const end = toDate(log.end_time);
    if (!start || !end) return sum;
    return sum + Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  }, 0);

  const handleSelectDate = (date) => {
    setSelectedDate(date);
    setMonthDate(getMonthStart(date));
  };

  return (
    <div className="log-view-grid log-view-grid--daily">
      <LogCalendar
        monthDate={monthDate}
        selectedDateKey={selectedDateKey}
        activityByDate={logsByDate}
        sessionsById={sessionsById}
        onSelectDate={handleSelectDate}
        onMonthChange={(delta) => {
          const next = new Date(monthDate);
          next.setMonth(next.getMonth() + delta);
          setMonthDate(getMonthStart(next));
        }}
      />

      <section className="log-panel log-day-panel">
        <div className="log-panel-header">
          <div>
            <span className="log-kicker">Daily Log</span>
            <h2>{formatDate(selectedDate, { month: 'long', day: 'numeric', weekday: 'long' })}</h2>
          </div>
        </div>

        <div className="log-stat-row">
          <StatPill label="운동" value={`${selectedLogs.length}회`} icon={Activity} />
          <StatPill label="세트" value={`${selectedRecords.length}세트`} icon={Dumbbell} />
          <StatPill label="시간" value={totalMinutes > 0 ? formatDuration(new Date(0), new Date(totalMinutes * 60000)) : '0분'} icon={Timer} />
        </div>

        <div className="log-scroll-area">
          {logSummaries.length === 0 ? (
            <EmptyState title="아직 기록이 없습니다" body="더미 데이터를 만들거나 운동 기록을 저장하면 이곳에 표시됩니다." />
          ) : selectedLogs.length === 0 ? (
            <EmptyState title="선택한 날짜의 기록이 없습니다" body="달력에서 표시된 날짜를 눌러 하루 기록을 확인하세요." />
          ) : (
            selectedLogs.map((log) => {
              const session = sessionsById.get(log.session_id);
              const routine = session ? routinesById.get(session.routine_id) : null;
              return (
                <DailyLogCard
                  key={log.id}
                  log={log}
                  records={log.records}
                  exercisesById={exercisesById}
                  session={session}
                  routine={routine}
                />
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

function ExerciseProgressChart({ points, exercise }) {
  const width = 640;
  const height = 240;
  const padding = { top: 22, right: 22, bottom: 38, left: 48 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  if (points.length === 0) {
    return (
      <div className="log-chart-empty">
        <BarChart3 size={22} />
        기록할 데이터가 없습니다
      </div>
    );
  }

  const times = points.map((point) => point.date.getTime());
  const values = points.map((point) => point.value);
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const minValue = Math.min(0, ...values);
  const maxValue = Math.max(1, ...values);
  const timeRange = Math.max(1, maxTime - minTime);
  const valueRange = Math.max(1, maxValue - minValue);

  const coords = points.map((point) => {
    const x = padding.left + ((point.date.getTime() - minTime) / timeRange) * chartWidth;
    const y = padding.top + chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
    return { x, y, point };
  });

  const linePath = coords.map((coord) => `${coord.x},${coord.y}`).join(' ');
  const areaPath = [
    `${padding.left},${padding.top + chartHeight}`,
    ...coords.map((coord) => `${coord.x},${coord.y}`),
    `${padding.left + chartWidth},${padding.top + chartHeight}`,
  ].join(' ');

  return (
    <div className="log-chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${exercise?.name || '운동'} 기록 그래프`}>
        <defs>
          <linearGradient id="logChartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(122, 162, 247, 0.28)" />
            <stop offset="100%" stopColor="rgba(122, 162, 247, 0)" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding.top + chartHeight * ratio;
          return <line key={ratio} x1={padding.left} x2={padding.left + chartWidth} y1={y} y2={y} className="log-chart-grid-line" />;
        })}
        <polygon points={areaPath} fill="url(#logChartFill)" />
        <polyline points={linePath} fill="none" className="log-chart-line" />
        {coords.map(({ x, y, point }) => (
          <g key={point.key}>
            <circle cx={x} cy={y} r="4.5" className="log-chart-dot" />
            <title>{`${formatDate(point.date, { month: 'short', day: 'numeric' })}: ${formatMetric(point.value, exercise)}`}</title>
          </g>
        ))}
        <text x={padding.left} y={height - 10} className="log-chart-axis-label">
          {formatDate(points[0].date, { month: 'short', day: 'numeric' })}
        </text>
        <text x={padding.left + chartWidth} y={height - 10} textAnchor="end" className="log-chart-axis-label">
          {formatDate(points[points.length - 1].date, { month: 'short', day: 'numeric' })}
        </text>
        <text x={padding.left - 8} y={padding.top + 6} textAnchor="end" className="log-chart-axis-label">
          {formatMetric(maxValue, exercise)}
        </text>
      </svg>
    </div>
  );
}

function ExerciseView({ exerciseSummaries, selectedExerciseId, setSelectedExerciseId, exerciseMonthDate, setExerciseMonthDate, sessionsById }) {
  const selectedSummary = exerciseSummaries.find((summary) => summary.exercise.id === selectedExerciseId) || exerciseSummaries[0] || null;
  const selectedExercise = selectedSummary?.exercise || null;
  const activityByDate = useMemo(() => {
    if (!selectedSummary) return new Map();
    return groupByDate(selectedSummary.logs, (log) => log.date);
  }, [selectedSummary]);

  const bestPoint = selectedSummary?.points.reduce((best, point) => (!best || point.value > best.value ? point : best), null);

  return (
    <div className="log-view-grid log-view-grid--exercise">
      <section className="log-panel log-exercise-picker-panel">
        <div className="log-panel-header">
          <div>
            <span className="log-kicker">Exercises</span>
            <h2>운동별 기록</h2>
          </div>
        </div>

        <div className="log-exercise-picker-list">
          {exerciseSummaries.length === 0 ? (
            <EmptyState title="운동 기록이 없습니다" body="완료된 세트가 생기면 종목별 로그가 쌓입니다." />
          ) : (
            exerciseSummaries.map((summary) => {
              const isActive = summary.exercise.id === selectedExercise?.id;
              return (
                <button
                  key={summary.exercise.id}
                  type="button"
                  className={`log-exercise-picker ${isActive ? 'is-active' : ''}`}
                  onClick={() => setSelectedExerciseId(summary.exercise.id)}
                >
                  <span>
                    <strong>{summary.exercise.name}</strong>
                    <i>{summary.exercise.primary_muscle || '기타'} · {summary.logs.length}회</i>
                  </span>
                  <b>{formatMetric(summary.totalMetric, summary.exercise)}</b>
                </button>
              );
            })
          )}
        </div>
      </section>

      <div className="log-exercise-main">
        {selectedSummary ? (
          <>
            <LogCalendar
              monthDate={exerciseMonthDate}
              selectedDateKey=""
              activityByDate={activityByDate}
              sessionsById={sessionsById}
              onSelectDate={(date) => setExerciseMonthDate(getMonthStart(date))}
              onMonthChange={(delta) => {
                const next = new Date(exerciseMonthDate);
                next.setMonth(next.getMonth() + delta);
                setExerciseMonthDate(getMonthStart(next));
              }}
            />

            <section className="log-panel log-chart-panel">
              <div className="log-panel-header">
                <div>
                  <span className="log-kicker">Progress</span>
                  <h2>{selectedExercise.name}</h2>
                </div>
                <span className="log-subtle-chip">{getMetricLabel(selectedExercise)}</span>
              </div>

              <div className="log-stat-row">
                <StatPill label="전체" value={`${selectedSummary.logs.length}회`} icon={History} />
                <StatPill label="세트" value={`${selectedSummary.setCount}세트`} icon={Dumbbell} />
                <StatPill label="최고" value={bestPoint ? formatMetric(bestPoint.value, selectedExercise) : '-'} icon={Activity} />
              </div>

              <ExerciseProgressChart points={selectedSummary.points} exercise={selectedExercise} />
            </section>

            <section className="log-panel log-full-record-panel">
              <div className="log-panel-header">
                <div>
                  <span className="log-kicker">All Records</span>
                  <h2>전체 기록</h2>
                </div>
              </div>

              <div className="log-scroll-area">
                {selectedSummary.logs.map((log) => (
                  <article key={log.key} className="log-exercise-history-row">
                    <div className="log-exercise-history-date">
                      <strong>{formatDate(log.date, { month: 'short', day: 'numeric' })}</strong>
                      <span>{formatDate(log.date, { weekday: 'short' })}</span>
                    </div>
                    <div className="log-exercise-history-body">
                      <div className="log-exercise-history-summary">
                        <strong>{formatMetric(log.value, selectedExercise)}</strong>
                        <span>{log.records.length}세트 · {formatDateTime(log.startTime)}</span>
                      </div>
                      <SetRecordTable records={log.records} exercise={selectedExercise} compact />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : (
          <section className="log-panel">
            <EmptyState title="운동 기록이 없습니다" body="완료된 세트가 생기면 달력, 그래프, 전체 기록을 볼 수 있습니다." />
          </section>
        )}
      </div>
    </div>
  );
}

function RoutineTimeline({ routineSummaries, freeWorkoutSummary }) {
  return (
    <section className="log-panel log-routine-panel">
      <div className="log-panel-header">
        <div>
          <span className="log-kicker">Routine Timeline</span>
          <h2>루틴 로그</h2>
        </div>
      </div>

      <div className="log-scroll-area log-routine-scroll">
        {routineSummaries.length === 0 && !freeWorkoutSummary ? (
          <EmptyState title="루틴 로그가 없습니다" body="루틴을 만들고 운동을 기록하면 시작 시점과 구성 운동이 정리됩니다." />
        ) : (
          <>
            {routineSummaries.map((routine) => (
              <article key={routine.id} className="log-routine-timeline-item">
                <div className="log-timeline-marker" />
                <div className="log-routine-body">
                  <div className="log-routine-heading">
                    <div>
                      <span>{routine.firstDate ? `${formatDate(routine.firstDate, { year: 'numeric', month: 'short', day: 'numeric' })}부터` : '기록 전'}</span>
                      <h3>{routine.name}</h3>
                    </div>
                    <div className="log-routine-range">
                      {routine.lastDate ? `${formatDate(routine.lastDate, { month: 'short', day: 'numeric' })} 최근` : '수행 기록 없음'}
                    </div>
                  </div>

                  <div className="log-routine-metrics">
                    <StatPill label="세션" value={`${routine.sessions.length}개`} icon={ListChecks} />
                    <StatPill label="기록" value={`${routine.logCount}회`} icon={History} />
                    <StatPill label="운동" value={`${routine.exerciseCount}개`} icon={Dumbbell} />
                  </div>

                  <div className="log-session-timeline-list">
                    {routine.sessions.map((session) => (
                      <div key={session.id} className="log-session-timeline-card">
                        <div className="log-session-card-header">
                          <div>
                            <strong>{session.name}</strong>
                            <span>
                              {session.firstDate
                                ? `${formatDate(session.firstDate, { month: 'short', day: 'numeric' })} 시작`
                                : '수행 기록 없음'}
                            </span>
                          </div>
                          <b>{session.logCount}회</b>
                        </div>

                        <div className="log-routine-bar">
                          <span style={{ width: `${session.activityRatio}%` }} />
                        </div>

                        <div className="log-routine-exercise-chips">
                          {session.exercises.length === 0 ? (
                            <span className="log-muted-chip">운동 없음</span>
                          ) : (
                            session.exercises.map((exercise) => (
                              <span key={exercise.id}>{exercise.name}</span>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            ))}

            {freeWorkoutSummary && (
              <article className="log-routine-timeline-item">
                <div className="log-timeline-marker log-timeline-marker--muted" />
                <div className="log-routine-body">
                  <div className="log-routine-heading">
                    <div>
                      <span>{formatDate(freeWorkoutSummary.firstDate, { year: 'numeric', month: 'short', day: 'numeric' })}부터</span>
                      <h3>자유 운동</h3>
                    </div>
                    <div className="log-routine-range">{freeWorkoutSummary.logCount}회</div>
                  </div>
                  <div className="log-routine-exercise-chips">
                    {freeWorkoutSummary.exercises.map((exercise) => (
                      <span key={exercise.id}>{exercise.name}</span>
                    ))}
                  </div>
                </div>
              </article>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default function LogPage() {
  const workoutLogs = useWorkoutStore((state) => state.workoutLogs);
  const setRecords = useWorkoutStore((state) => state.setRecords);
  const exercises = useWorkoutStore((state) => state.exercises);
  const sessions = useWorkoutStore((state) => state.sessions);
  const routines = useWorkoutStore((state) => state.routines);
  const sessionExercises = useWorkoutStore((state) => state.sessionExercises);

  const [activeView, setActiveView] = useState('daily');

  const exercisesById = useMemo(() => new Map(exercises.map((exercise) => [exercise.id, exercise])), [exercises]);
  const sessionsById = useMemo(() => new Map(sessions.map((session) => [session.id, session])), [sessions]);
  const routinesById = useMemo(() => new Map(routines.map((routine) => [routine.id, routine])), [routines]);

  const recordsByLogId = useMemo(() => {
    return setRecords
      .filter((record) => record.is_completed)
      .reduce((acc, record) => {
        if (!acc.has(record.workout_log_id)) acc.set(record.workout_log_id, []);
        acc.get(record.workout_log_id).push(record);
        return acc;
      }, new Map());
  }, [setRecords]);

  const logSummaries = useMemo(() => {
    return workoutLogs
      .map((log) => ({
        ...log,
        startDate: toDate(log.start_time),
        records: (recordsByLogId.get(log.id) || []).slice().sort((a, b) => {
          if (a.exercise_id === b.exercise_id) return a.set_number - b.set_number;
          return a.exercise_id.localeCompare(b.exercise_id);
        }),
      }))
      .filter((log) => log.startDate)
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  }, [workoutLogs, recordsByLogId]);

  const logsByDate = useMemo(() => groupByDate(logSummaries, (log) => log.startDate), [logSummaries]);

  const initialDate = logSummaries[0]?.startDate || new Date();
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [monthDate, setMonthDate] = useState(getMonthStart(initialDate));
  const [exerciseMonthDate, setExerciseMonthDate] = useState(getMonthStart(initialDate));

  const exerciseSummaries = useMemo(() => {
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
          byExercise.set(exerciseId, {
            exercise,
            logs: [],
            setCount: 0,
            totalMetric: 0,
          });
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
          records: records.slice().sort((a, b) => a.set_number - b.set_number),
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
          .map((log) => ({
            key: log.key,
            date: log.date,
            value: log.value,
          })),
      }))
      .sort((a, b) => {
        const latestA = a.logs[0]?.date?.getTime() || 0;
        const latestB = b.logs[0]?.date?.getTime() || 0;
        if (latestA !== latestB) return latestB - latestA;
        return a.exercise.name.localeCompare(b.exercise.name, 'ko');
      });
  }, [logSummaries, exercisesById]);

  const [selectedExerciseId, setSelectedExerciseId] = useState(exerciseSummaries[0]?.exercise.id || null);

  const routineSummaries = useMemo(() => {
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
  }, [routines, sessions, sessionExercises, exercisesById, logSummaries]);

  const freeWorkoutSummary = useMemo(() => {
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
  }, [logSummaries, exercisesById]);

  const activeMeta = LOG_VIEWS.find((view) => view.id === activeView) || LOG_VIEWS[0];

  return (
    <div className="log-page">
      <div className="log-content">
        <header className="log-page-header">
          <div>
            <span className="log-kicker">Log</span>
            <h1>{activeMeta.label}</h1>
          </div>
          <p>{activeMeta.description}</p>
        </header>

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

      <aside className="log-sidebar" aria-label="로그 보기">
        {LOG_VIEWS.map((view) => {
          const Icon = view.icon;
          const isActive = activeView === view.id;
          return (
            <button
              key={view.id}
              type="button"
              className={`log-sidebar-button ${isActive ? 'is-active' : ''}`}
              onClick={() => setActiveView(view.id)}
            >
              <Icon size={17} />
              <span>
                <strong>{view.label}</strong>
                <i>{view.description}</i>
              </span>
            </button>
          );
        })}
      </aside>
    </div>
  );
}
