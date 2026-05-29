// @vitest-environment node
import { test, describe } from 'vitest';
import assert from 'node:assert/strict';
import {
  toDate,
  getDateKey,
  getMonthStart,
  formatDate,
  formatTime,
  formatDateTime,
  formatDuration,
  getExerciseUnit,
  getExerciseDisplayUnit,
  getMetricLabel,
  isBodyweightMetric,
  getRecordMetric,
  formatMetric,
  formatSetCellValue,
  buildCalendarCells,
  groupByDate,
  getCalendarMarkerColors,
} from './logFormatters.js';

describe('logFormatters Date & Time Utilities', () => {
  test('toDate converts various inputs into Date objects or null', () => {
    assert.equal(toDate(null), null);
    assert.equal(toDate(''), null);
    assert.equal(toDate('invalid-date'), null);

    const validString = '2026-05-29T12:00:00.000Z';
    const dateObj = toDate(validString);
    assert.ok(dateObj instanceof Date);
    assert.equal(dateObj.toISOString(), validString);
  });

  test('getDateKey formats a Date object into YYYY-MM-DD', () => {
    assert.equal(getDateKey(null), '');
    const date = new Date('2026-05-29T12:00:00');
    assert.equal(getDateKey(date), '2026-05-29');
  });

  test('getMonthStart returns a Date object set to the 1st day of the month', () => {
    const date = new Date('2026-05-29T12:00:00');
    const start = getMonthStart(date);
    assert.equal(start.getFullYear(), 2026);
    assert.equal(start.getMonth(), 4); // 0-indexed May
    assert.equal(start.getDate(), 1);
  });

  test('formatDate translates values into Korean date string', () => {
    assert.equal(formatDate(null), '날짜 없음');
    const date = new Date('2026-05-29T12:00:00');
    assert.ok(formatDate(date).includes('2026'));
  });

  test('formatTime outputs formatted time string in HH:MM', () => {
    assert.equal(formatTime(null), '--:--');
    const date = new Date('2026-05-29T13:45:00');
    assert.equal(formatTime(date), '13:45');
  });

  test('formatDateTime outputs short localized date and time', () => {
    assert.equal(formatDateTime(null), '시간 없음');
    const date = new Date('2026-05-29T13:45:00');
    assert.ok(formatDateTime(date).includes('13:45'));
  });

  test('formatDuration calculates time differences in Korean representation', () => {
    assert.equal(formatDuration(null, null), '진행 중');
    assert.equal(formatDuration('2026-05-29T12:00:00', null), '진행 중');
    assert.equal(formatDuration(null, '2026-05-29T12:00:00'), '시간 없음');

    const start = '2026-05-29T12:00:00';
    const end35min = '2026-05-29T12:35:00';
    const end2hrs = '2026-05-29T14:00:00';
    const end2hrs10min = '2026-05-29T14:10:00';

    assert.equal(formatDuration(start, end35min), '35분');
    assert.equal(formatDuration(start, end2hrs), '2시간');
    assert.equal(formatDuration(start, end2hrs10min), '2시간 10분');
  });
});

describe('logFormatters Exercise Metric Utilities', () => {
  test('getExerciseUnit resolves unit falling back to kg', () => {
    assert.equal(getExerciseUnit(null), 'kg');
    assert.equal(getExerciseUnit({}), 'kg');
    assert.equal(getExerciseUnit({ unit: 'reps' }), 'reps');
  });

  test('getExerciseDisplayUnit returns Korean display mapping', () => {
    assert.equal(getExerciseDisplayUnit({ unit: 'sec' }), '초');
    assert.equal(getExerciseDisplayUnit({ unit: 'reps' }), '회');
    assert.equal(getExerciseDisplayUnit({ unit: 'kg' }), 'kg');
    assert.equal(getExerciseDisplayUnit(null), 'kg');
  });

  test('getMetricLabel maps unit to chart/display label', () => {
    assert.equal(getMetricLabel({ unit: 'sec' }), '총 시간');
    assert.equal(getMetricLabel({ unit: 'reps' }), '총 반복');
    assert.equal(getMetricLabel({ unit: 'kg' }), '볼륨');
  });

  test('isBodyweightMetric identifies non-weight exercises', () => {
    assert.equal(isBodyweightMetric({ unit: 'reps' }), true);
    assert.equal(isBodyweightMetric({ unit: 'sec' }), true);
    assert.equal(isBodyweightMetric({ unit: 'kg' }), false);
  });

  test('getRecordMetric computes volume or raw record', () => {
    const repsExercise = { unit: 'reps' };
    const secExercise = { unit: 'sec' };
    const kgExercise = { unit: 'kg' };

    // Reps: returns record directly
    assert.equal(getRecordMetric({ record: 12, weight: 80 }, repsExercise), 12);
    // Sec: returns record directly
    assert.equal(getRecordMetric({ record: 45, weight: 0 }, secExercise), 45);
    // Kg: returns weight * record
    assert.equal(getRecordMetric({ record: 8, weight: 100 }, kgExercise), 800);
    // Handles invalid values safely
    assert.equal(getRecordMetric({ record: '', weight: '' }, kgExercise), 0);
  });

  test('formatMetric structures values with units', () => {
    const repsExercise = { unit: 'reps' };
    const kgExercise = { unit: 'kg' };

    assert.equal(formatMetric(12, repsExercise), '12 회');
    assert.equal(formatMetric(82.5, kgExercise), '82.5 kg');
    assert.equal(formatMetric(80.0, kgExercise), '80 kg');
  });

  test('formatSetCellValue default value handler', () => {
    assert.equal(formatSetCellValue(null), '0');
    assert.equal(formatSetCellValue(undefined), '0');
    assert.equal(formatSetCellValue(''), '0');
    assert.equal(formatSetCellValue('80'), '80');
  });
});

describe('logFormatters Calendar & Grouping Utilities', () => {
  test('buildCalendarCells constructs 42 entries matching current month offset', () => {
    // May 2026 starts on Friday (Sunday offset = 5 days)
    const monthDate = new Date('2026-05-15');
    const cells = buildCalendarCells(monthDate);

    assert.equal(cells.length, 42);
    // May 1st is in the list
    assert.ok(cells.some(cell => cell.key === '2026-05-01' && cell.isCurrentMonth));
    // Offset week days are present but marked false
    assert.ok(cells.some(cell => cell.key === '2026-04-29' && !cell.isCurrentMonth));
  });

  test('groupByDate splits items by derived date keys', () => {
    const items = [
      { id: 1, date: new Date('2026-05-29T10:00:00') },
      { id: 2, date: new Date('2026-05-29T15:00:00') },
      { id: 3, date: new Date('2026-05-30T10:00:00') },
    ];
    const grouped = groupByDate(items, (item) => item.date);

    assert.equal(grouped.size, 2);
    assert.equal(grouped.get('2026-05-29').length, 2);
    assert.equal(grouped.get('2026-05-30').length, 1);
  });

  test('getCalendarMarkerColors collects unique color codes per session', () => {
    const sessionsById = new Map([
      ['session-1', { id: 'session-1', session_order: 1 }],
      ['session-2', { id: 'session-2', session_order: 2 }],
    ]);
    const dayItems = [
      { session_id: 'session-1' },
      { session_id: 'session-1' }, // Duplicate, should filter out
      { session_id: 'session-2' },
      { session_id: 'free' },      // Fallback gray color
    ];

    const colors = getCalendarMarkerColors(dayItems, sessionsById);
    assert.equal(colors.length, 3);
    assert.equal(colors[2], '#6B7394'); // Fallback gray
  });
});
