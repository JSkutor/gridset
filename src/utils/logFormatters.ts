import { getSessionColor } from './sessionHelper';
import type { Exercise, Session, SetRecord, WorkoutLog } from '../types/workout';

type DateInput = Date | string | number | null | undefined;
type ExerciseMetric = Pick<Exercise, 'unit'> | null | undefined;
type ExerciseEquipment = Pick<Exercise, 'equipment'> | null | undefined;
type SetRecordMetric = Pick<SetRecord, 'record' | 'weight'>;
type CalendarLog = Pick<WorkoutLog, 'session_id'>;
type CalendarSession = Pick<Session, 'id' | 'session_order'>;

// ─── Date Utilities ──────────────────────────────────────────

export function toDate(value: DateInput): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getDateKey(date: Date | null | undefined): string {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function formatDate(value: DateInput, options: Intl.DateTimeFormatOptions = {}): string {
  const date = value instanceof Date ? value : toDate(value);
  if (!date) return '날짜 없음';
  return date.toLocaleDateString('ko-KR', options);
}

export function formatTime(value: DateInput): string {
  const date = toDate(value);
  if (!date) return '--:--';
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatDateTime(value: DateInput): string {
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

export function formatDuration(startValue: DateInput, endValue: DateInput): string {
  const start = toDate(startValue);
  const end = toDate(endValue);
  if (!start || !end) return endValue ? '시간 없음' : '진행 중';

  const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  if (minutes < 60) return `${minutes}분`;

  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  return restMinutes === 0 ? `${hours}시간` : `${hours}시간 ${restMinutes}분`;
}

// ─── Exercise Metric Utilities ───────────────────────────────

export function getExerciseUnit(exercise: ExerciseMetric): Exercise['unit'] {
  return exercise?.unit || 'kg';
}

export function getExerciseDisplayUnit(exercise: ExerciseMetric): string {
  const unit = getExerciseUnit(exercise);
  if (unit === 'sec') return '초';
  if (unit === 'reps') return '회';
  return 'kg';
}

export function getMetricLabel(exercise: ExerciseMetric): string {
  const unit = getExerciseUnit(exercise);
  if (unit === 'sec') return '총 시간';
  if (unit === 'reps') return '총 반복';
  return '볼륨';
}

export function isBodyweightMetric(exercise: ExerciseMetric): boolean {
  const unit = getExerciseUnit(exercise);
  return unit === 'reps' || unit === 'sec';
}

export function isBodyweightEquipment(exercise: ExerciseEquipment): boolean {
  return exercise?.equipment === '맨몸';
}

export function getRecordMetric(record: SetRecordMetric, exercise: ExerciseMetric): number {
  const recordValue = Number(record.record) || 0;
  if (isBodyweightMetric(exercise)) return recordValue;
  return (Number(record.weight) || 0) * recordValue;
}

export function formatMetric(value: number, exercise: ExerciseMetric): string {
  const rounded = Number.isInteger(value) ? value : Math.round(value * 10) / 10;
  if (isBodyweightMetric(exercise)) return `${rounded.toLocaleString()} ${getExerciseDisplayUnit(exercise)}`;
  return `${rounded.toLocaleString()} kg`;
}

export function formatSetCellValue(value: unknown): unknown {
  return value === null || value === undefined || value === '' ? '0' : value;
}

// ─── Calendar & Grouping Utilities ───────────────────────────

export function buildCalendarCells(monthDate: Date): Array<{ date: Date; key: string; isCurrentMonth: boolean }> {
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

export function groupByDate<T>(items: T[], getDate: (item: T) => Date | null | undefined): Map<string, T[]> {
  return items.reduce((acc, item) => {
    const date = getDate(item);
    const key = getDateKey(date);
    if (!key) return acc;
    if (!acc.has(key)) acc.set(key, []);
    acc.get(key).push(item);
    return acc;
  }, new Map());
}

export function getCalendarMarkerColors(
  dayItems: CalendarLog[],
  sessionsById: Map<string, CalendarSession>,
): string[] {
  const seen = new Set<string>();
  const colors: string[] = [];

  dayItems.forEach((log) => {
    const session = sessionsById.get(log.session_id);
    const key = session?.id || 'free-workout';
    if (seen.has(key)) return;

    seen.add(key);
    colors.push(session ? getSessionColor(session) : '#6B7394');
  });

  return colors;
}
