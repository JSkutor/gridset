import { useMemo } from 'react';
import { Activity, Dumbbell, History } from 'lucide-react';
import {
  formatDate,
  formatDateTime,
  formatMetric,
  getMetricLabel,
  getMonthStart,
  groupByDate,
} from '../../utils/logFormatters';
import { EmptyState, StatPill } from './LogShared';
import LogCalendar from './LogCalendar';
import ExerciseProgressChart from './ExerciseProgressChart';
import SetRecordTable from './SetRecordTable';

export default function ExerciseView({ exerciseSummaries, selectedExerciseId, setSelectedExerciseId, exerciseMonthDate, setExerciseMonthDate, sessionsById }) {
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
