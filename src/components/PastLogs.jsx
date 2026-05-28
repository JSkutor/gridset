import { useMemo } from 'react'
import { useWorkoutStore } from '../store/useWorkoutStore'

export default function PastLogs({ activeExerciseId }) {
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
      sets.sort((a, b) => a.set_number - b.set_number);
      
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

  if (!activeExerciseId) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
        운동을 선택해주세요
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 100px 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {pastLogs.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '20px' }}>기록이 없습니다.</div>
          ) : pastLogs.map((log) => (
            <div key={log.id} className="glass-card" style={{ padding: '16px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px'
              }}>
                <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-bright)' }}>{log.date}</span>
                <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: '500' }}>{log.totalVolume.toLocaleString()} {displayUnit}</span>
              </div>

              <table className="spreadsheet spreadsheet--readonly">
                <tbody>
                  {log.sets.map((set) => (
                    <tr key={set.id}>
                      <td className="cell-set">{set.set_number}</td>
                      <td className="cell-value">{set.weight || '—'}</td>
                      <td className="cell-value">{set.record}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
