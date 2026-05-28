import { useMemo } from 'react';
import { Clock, Timer, Dumbbell } from 'lucide-react';
import { getFormattedSessionName } from '../../utils/sessionHelper';
import { formatTime, formatDuration } from '../../utils/logFormatters';
import SetRecordTable from './SetRecordTable';

export default function DailyLogCard({ log, records, exercisesById, session, routine }) {
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
        records: [...exerciseRecords].sort((a, b) => {
          if (a.set_number !== b.set_number) {
            return a.set_number - b.set_number;
          }
          return (a.side || '').localeCompare(b.side || '');
        }),
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
