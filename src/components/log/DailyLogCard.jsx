import { useMemo } from 'react';
import { Clock, Timer, Dumbbell } from 'lucide-react';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { getFormattedSessionName } from '../../utils/sessionHelper';
import { formatTime, formatDuration } from '../../utils/logFormatters';
import SetRecordTable from './SetRecordTable';

export default function DailyLogCard({ log, records, exercisesById, session, routine }) {
  const sessionExercises = useWorkoutStore((state) => state.sessionExercises);
  const sessionExerciseGroups = useWorkoutStore((state) => state.sessionExerciseGroups);

  const displayBlocks = useMemo(() => {
    if (!session) {
      const byExercise = records.reduce((acc, record) => {
        if (!acc.has(record.exercise_id)) acc.set(record.exercise_id, []);
        acc.get(record.exercise_id).push(record);
        return acc;
      }, new Map());

      return [...byExercise.entries()].map(([exerciseId, exerciseRecords]) => {
        const exercise = exercisesById.get(exerciseId);
        return {
          is_group: false,
          exercise,
          records: [...exerciseRecords].sort((a, b) => {
            if (a.set_number !== b.set_number) return a.set_number - b.set_number;
            return (a.side || '').localeCompare(b.side || '');
          }),
        };
      });
    }

    const sessionLinks = sessionExercises
      .filter((se) => se.session_id === session.id)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const sessionGroups = (sessionExerciseGroups || [])
      .filter((group) => group.session_id === session.id)
      .sort((a, b) => (a.start_order || 0) - (b.start_order || 0));

    const blocks = [];
    const processedExerciseIds = new Set();
    const processedGroupIds = new Set();

    let index = 0;
    while (index < sessionLinks.length) {
      const se = sessionLinks[index];
      const order = se.order;

      const group = sessionGroups.find((g) => {
        const start = Number(g.start_order) || 1;
        const end = start + (Number(g.size) || 2) - 1;
        return order >= start && order <= end;
      });

      if (group) {
        if (!processedGroupIds.has(group.id)) {
          processedGroupIds.add(group.id);

          const start = Number(group.start_order) || 1;
          const end = start + (Number(group.size) || 2) - 1;
          const groupLinks = sessionLinks.filter((link) => {
            const o = link.order;
            return o >= start && o <= end;
          });

          const groupExercisesData = [];
          groupLinks.forEach((link) => {
            processedExerciseIds.add(link.exercise_id);
            const exercise = exercisesById.get(link.exercise_id);
            const exerciseRecords = records
              .filter((r) => r.exercise_id === link.exercise_id)
              .sort((a, b) => {
                if (a.set_number !== b.set_number) return a.set_number - b.set_number;
                return (a.side || '').localeCompare(b.side || '');
              });

            if (exerciseRecords.length > 0) {
              groupExercisesData.push({
                exercise,
                records: exerciseRecords,
              });
            }
          });

          if (groupExercisesData.length > 0) {
            const palette = ['#7aa2f7', '#9ece6a', '#e0af68', '#f7768e'];
            const groupIdx = sessionGroups.findIndex((g) => g.id === group.id);
            const resolvedColor = group.color || palette[groupIdx % palette.length] || '#7aa2f7';

            blocks.push({
              is_group: true,
              group_id: group.id,
              group_name: group.name,
              group_color: resolvedColor,
              exercises: groupExercisesData,
            });
          }
        }
        index++;
      } else {
        processedExerciseIds.add(se.exercise_id);
        const exercise = exercisesById.get(se.exercise_id);
        const exerciseRecords = records
          .filter((r) => r.exercise_id === se.exercise_id)
          .sort((a, b) => {
            if (a.set_number !== b.set_number) return a.set_number - b.set_number;
            return (a.side || '').localeCompare(b.side || '');
          });

        if (exerciseRecords.length > 0) {
          blocks.push({
            is_group: false,
            exercise,
            records: exerciseRecords,
          });
        }
        index++;
      }
    }

    const leftoverExerciseIds = new Set(records.map((r) => r.exercise_id));
    processedExerciseIds.forEach((id) => leftoverExerciseIds.delete(id));

    if (leftoverExerciseIds.size > 0) {
      leftoverExerciseIds.forEach((exerciseId) => {
        const exercise = exercisesById.get(exerciseId);
        const exerciseRecords = records
          .filter((r) => r.exercise_id === exerciseId)
          .sort((a, b) => {
            if (a.set_number !== b.set_number) return a.set_number - b.set_number;
            return (a.side || '').localeCompare(b.side || '');
          });

        if (exerciseRecords.length > 0) {
          blocks.push({
            is_group: false,
            exercise,
            records: exerciseRecords,
          });
        }
      });
    }

    return blocks;
  }, [records, exercisesById, session, sessionExercises, sessionExerciseGroups]);

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
        {displayBlocks.map((block, idx) => {
          if (block.is_group) {
            return (
              <div 
                key={block.group_id || idx}
                className="log-group-record-card-box"
                style={{ '--group-color': block.group_color }}
              >
                <div className="log-group-record-header">
                  <span className="log-group-record-badge">
                    {block.group_name}
                  </span>
                  <span className="log-group-record-exercises-label">
                    {block.exercises.map(e => e.exercise?.name || '알 수 없는 운동').join(' + ')}
                  </span>
                </div>
                <div className="log-group-exercises-container">
                  {block.exercises.map(({ exercise, records: exerciseRecords }) => (
                    <div className="log-exercise-record-row inside-group" key={exercise?.id || exerciseRecords[0]?.exercise_id}>
                      <div className="log-exercise-record-meta">
                        <strong>{exercise?.name || '알 수 없는 운동'}</strong>
                        <span>{exerciseRecords.length}세트</span>
                      </div>
                      <SetRecordTable records={exerciseRecords} exercise={exercise} />
                    </div>
                  ))}
                </div>
              </div>
            );
          } else {
            const { exercise, records: exerciseRecords } = block;
            return (
              <div className="log-exercise-record-row" key={exercise?.id || exerciseRecords[0]?.exercise_id}>
                <div className="log-exercise-record-meta">
                  <strong>{exercise?.name || '알 수 없는 운동'}</strong>
                  <span>{exerciseRecords.length}세트</span>
                </div>
                <SetRecordTable records={exerciseRecords} exercise={exercise} />
              </div>
            );
          }
        })}
      </div>
    </article>
  );
}
