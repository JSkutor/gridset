import type { ExerciseUnit, Id, SetRecord, WorkoutLog } from '../types/workout';

type ExerciseHistoryParams = {
  exerciseId: Id | null | undefined;
  setRecords: SetRecord[];
  workoutLogs: WorkoutLog[];
  unit: ExerciseUnit | string | null | undefined;
};

type DailyRecord = {
  dateObj: Date;
  dateStr: string;
  formattedDate: string;
  value: number;
  weight: number;
  reps: number;
};

export type ExerciseHistoryStats = {
  totalVolume: number;
  chartData: DailyRecord[];
  heatmapData: number[];
};

export function isBodyweightUnit(unit: ExerciseUnit | string | null | undefined): boolean {
  return unit === 'reps' || unit === 'sec';
}

export function getExerciseDisplayUnitByUnit(unit: ExerciseUnit | string | null | undefined): string {
  if (unit === 'sec') return '초';
  if (unit === 'reps') return '개';
  return 'kg';
}

export function getExerciseTotalLabelByUnit(unit: ExerciseUnit | string | null | undefined): string {
  if (unit === 'sec') return 'Total Time (All Time)';
  if (unit === 'reps') return 'Total Count (All Time)';
  return 'Total Volume (All Time)';
}

function getLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function buildExerciseHistoryStats({
  exerciseId,
  setRecords,
  workoutLogs,
  unit,
}: ExerciseHistoryParams): ExerciseHistoryStats {
  const emptyHeatmap = Array.from({ length: 70 }).map(() => 0);
  if (!exerciseId) {
    return {
      totalVolume: 0,
      chartData: [],
      heatmapData: emptyHeatmap,
    };
  }

  const logsById = new Map(workoutLogs.map((log) => [log.id, log]));
  const exerciseSets = setRecords.filter((record) => record.exercise_id === exerciseId);
  const isBodyweight = isBodyweightUnit(unit);

  const totalVolume = exerciseSets.reduce((acc, record) => {
    const weight = Number(record.weight) || 0;
    const reps = Number(record.record) || 0;
    return acc + (isBodyweight ? reps : weight * reps);
  }, 0);

  const dailyRecords: Record<string, DailyRecord> = {};
  const volumeByDate: Record<string, number> = {};

  exerciseSets.forEach((record) => {
    const log = logsById.get(record.workout_log_id);
    if (!log?.start_time) return;

    const date = new Date(log.start_time);
    const dateStr = getLocalDateKey(date);
    const weight = Number(record.weight) || 0;
    const reps = Number(record.record) || 0;
    const chartValue = unit === 'kg' ? weight : reps;
    const volumeValue = isBodyweight ? reps : weight * reps;

    if (!dailyRecords[dateStr] || chartValue > dailyRecords[dateStr].value) {
      dailyRecords[dateStr] = {
        dateObj: date,
        dateStr,
        formattedDate: `${date.getMonth() + 1}/${date.getDate()}`,
        value: chartValue,
        weight,
        reps,
      };
    }

    volumeByDate[dateStr] = (volumeByDate[dateStr] || 0) + volumeValue;
  });

  const chartData = Object.values(dailyRecords).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  const maxVolume = Math.max(0, ...Object.values(volumeByDate));
  const heatmapData: number[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 69; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const volume = volumeByDate[getLocalDateKey(date)] || 0;

    let intensity = 0;
    if (volume > 0) {
      if (volume >= maxVolume * 0.75) intensity = 4;
      else if (volume >= maxVolume * 0.5) intensity = 3;
      else if (volume >= maxVolume * 0.25) intensity = 2;
      else intensity = 1;
    }
    heatmapData.push(intensity);
  }

  return {
    totalVolume,
    chartData,
    heatmapData,
  };
}
