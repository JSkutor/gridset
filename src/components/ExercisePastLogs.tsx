// @ts-nocheck
import { useMemo } from 'react'
import { useWorkoutStore } from '../store/useWorkoutStore'

export default function ExercisePastLogs({ activeExerciseId }) {
  const workoutLogs = useWorkoutStore(state => state.workoutLogs);
  const setRecords = useWorkoutStore(state => state.setRecords);
  const exercises = useWorkoutStore(state => state.exercises);

  const activeExercise = exercises.find(ex => ex.id === activeExerciseId);

  const unit = useMemo(() => {
    if (!activeExercise) return 'kg';
    return activeExercise.unit || 'kg';
  }, [activeExercise]);

  const isBodyweight = useMemo(() => {
    return unit === 'reps' || unit === 'sec';
  }, [unit]);

  const displayUnit = useMemo(() => {
    if (unit === 'sec') return '초';
    if (unit === 'reps') return '개';
    return 'kg';
  }, [unit]);

  const pastLogs = useMemo(() => {
    if (!activeExerciseId) return [];
    
    const exerciseSets = setRecords.filter(sr => sr.exercise_id === activeExerciseId);
    
    const groupedByLogId = exerciseSets.reduce((acc, sr) => {
      if (!acc[sr.workout_log_id]) acc[sr.workout_log_id] = [];
      acc[sr.workout_log_id].push(sr);
      return acc;
    }, {});

    const logIds = Object.keys(groupedByLogId);
    
    const logs = logIds.map(logId => {
      const logInfo = workoutLogs.find(wl => wl.id === logId);
      const sets = groupedByLogId[logId];
      sets.sort((a, b) => {
        if (a.set_number !== b.set_number) {
          return a.set_number - b.set_number;
        }
        return (a.side || '').localeCompare(b.side || '');
      });
      
      const totalVolume = sets.reduce((sum, s) => {
        const weight = Number(s.weight) || 0;
        const reps = Number(s.record) || 0;
        const val = isBodyweight ? reps : (weight * reps);
        return sum + val;
      }, 0);
      
      const dateStr = logInfo 
        ? new Date(logInfo.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
        : 'Unknown';
        
      return {
        id: logId,
        date: dateStr,
        rawDate: logInfo ? new Date(logInfo.start_time).getTime() : 0,
        totalVolume,
        sets
      };
    });

    logs.sort((a, b) => b.rawDate - a.rawDate);
    return logs;
  }, [activeExerciseId, workoutLogs, setRecords, isBodyweight]);

  return (
    <div className="past-logs-container">
      <div className="past-logs-scroll-area">
        <div className="past-logs-list">
          {!activeExerciseId ? (
            <div className="past-logs-empty-message">기록 없음</div>
          ) : pastLogs.length === 0 ? (
            <div className="past-logs-empty-message">기록 없음</div>
          ) : pastLogs.map((log) => (
            <div key={log.id} className="glass-card past-logs-card">
              <div className="past-logs-card-header">
                <span className="past-logs-card-date">{log.date}</span>
                <span className="past-logs-card-volume">{log.totalVolume.toLocaleString()} {displayUnit}</span>
              </div>

              <table className="spreadsheet spreadsheet--readonly">
                <thead>
                  <tr style={{ height: 0 }}>
                    <th className="col-set" style={{ height: 0, padding: 0, border: 'none' }}></th>
                    <th style={{ height: 0, padding: 0, border: 'none' }}></th>
                    <th style={{ height: 0, padding: 0, border: 'none' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {log.sets.map((set) => (
                    <tr key={set.id}>
                      <td className="cell-set">
                        {set.set_number}
                        {set.side && set.side !== 'both' && (
                          <span className={`side-badge side-badge--${set.side.toLowerCase()}`}>
                            {set.side}
                          </span>
                        )}
                      </td>
                      <td className="cell-value">{set.weight || '—'}</td>
                      <td className="cell-value">{set.record}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Memo Section */}
              {(() => {
                const setsWithMemo = log.sets.filter(s => s.memo && s.memo.trim() !== '');
                if (setsWithMemo.length === 0) return null;
                return (
                  <div className="past-logs-memos-wrapper">
                    {setsWithMemo.map((set) => (
                      <div key={set.id} className="past-logs-memo-row">
                        <span className="past-logs-memo-badge">
                          {set.set_number}세트
                          {set.side && set.side !== 'both' && (
                            <span className={`side-badge side-badge--${set.side.toLowerCase()}`}>
                              {set.side}
                            </span>
                          )}
                        </span>
                        <span className="past-logs-memo-text">
                          "{set.memo}"
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
