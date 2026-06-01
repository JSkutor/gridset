import { describe, expect, test } from 'vitest';
import {
  toCSV,
  buildRoutinesExport,
  buildWorkoutHistoryExport,
  buildExercisesExport,
  buildExerciseGroupsExport,
  buildSummaryExport,
} from './exportData.js';

// ─────────────────────────────────────────────
// toCSV
// ─────────────────────────────────────────────

describe('toCSV', () => {
  test('빈 배열이면 빈 문자열 반환', () => {
    expect(toCSV([])).toBe('');
  });

  test('null/undefined 이면 빈 문자열 반환', () => {
    expect(toCSV(null)).toBe('');
    expect(toCSV(undefined)).toBe('');
  });

  test('헤더와 데이터 행을 올바르게 출력', () => {
    const rows = [{ 이름: '스쿼트', 세트: 3 }];
    const result = toCSV(rows);
    expect(result).toBe('이름,세트\n스쿼트,3');
  });

  test('여러 행을 줄바꿈으로 구분', () => {
    const rows = [
      { a: 1, b: 2 },
      { a: 3, b: 4 },
    ];
    expect(toCSV(rows)).toBe('a,b\n1,2\n3,4');
  });

  test('쉼표가 포함된 값은 큰따옴표로 감쌈', () => {
    const rows = [{ name: 'foo,bar' }];
    expect(toCSV(rows)).toBe('name\n"foo,bar"');
  });

  test('큰따옴표가 포함된 값은 이스케이프', () => {
    const rows = [{ name: 'say "hello"' }];
    expect(toCSV(rows)).toBe('name\n"say ""hello"""');
  });

  test('줄바꿈이 포함된 값은 큰따옴표로 감쌈', () => {
    const rows = [{ name: 'line1\nline2' }];
    expect(toCSV(rows)).toBe('name\n"line1\nline2"');
  });

  test('null/undefined 셀 값은 빈 문자열로', () => {
    const rows = [{ a: null, b: undefined, c: 0 }];
    expect(toCSV(rows)).toBe('a,b,c\n,,0');
  });
});

// ─────────────────────────────────────────────
// buildRoutinesExport
// ─────────────────────────────────────────────

describe('buildRoutinesExport', () => {
  const exercises = [{ id: 'ex-1', name: '스쿼트' }];
  const sessions = [
    { id: 'sess-1', routine_id: 'rt-1', name: 'A세션', session_order: 1 },
  ];
  const routines = [{ id: 'rt-1', name: '루틴A', created_at: '2024-01-01' }];

  test('운동이 있는 세션의 행 구조 확인', () => {
    const sessionExercises = [
      {
        id: 'se-1',
        session_id: 'sess-1',
        exercise_id: 'ex-1',
        order: 1,
        target_sets: 3,
        target_record: '10',
        rest_between_sets: 60,
        rest_after_exercise: 120,
      },
    ];
    const rows = buildRoutinesExport({ routines, sessions, sessionExercises, exercises });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      루틴명: '루틴A',
      세션명: 'A세션',
      세션순서: 1,
      운동명: '스쿼트',
      목표세트: 3,
      목표기록: '10',
    });
  });

  test('운동이 없는 세션도 (운동 없음) 행 추가', () => {
    const rows = buildRoutinesExport({ routines, sessions, sessionExercises: [], exercises });
    expect(rows).toHaveLength(1);
    expect(rows[0].운동명).toBe('(운동 없음)');
  });

  test('알 수 없는 exercise_id는 (알 수 없음) 표시', () => {
    const sessionExercises = [
      { id: 'se-1', session_id: 'sess-1', exercise_id: 'UNKNOWN', order: 1 },
    ];
    const rows = buildRoutinesExport({ routines, sessions, sessionExercises, exercises });
    expect(rows[0].운동명).toBe('(알 수 없음)');
  });

  test('루틴이 없으면 빈 배열 반환', () => {
    const rows = buildRoutinesExport({ routines: [], sessions: [], sessionExercises: [], exercises: [] });
    expect(rows).toHaveLength(0);
  });

  test('세션 순서대로 정렬됨', () => {
    const multiSessions = [
      { id: 'sess-2', routine_id: 'rt-1', name: 'B세션', session_order: 2 },
      { id: 'sess-1', routine_id: 'rt-1', name: 'A세션', session_order: 1 },
    ];
    const rows = buildRoutinesExport({
      routines,
      sessions: multiSessions,
      sessionExercises: [],
      exercises: [],
    });
    expect(rows[0].세션명).toBe('A세션');
    expect(rows[1].세션명).toBe('B세션');
  });
});

// ─────────────────────────────────────────────
// buildWorkoutHistoryExport
// ─────────────────────────────────────────────

describe('buildWorkoutHistoryExport', () => {
  const exercises = [{ id: 'ex-1', name: '벤치프레스' }];
  const sessions = [{ id: 'sess-1', routine_id: 'rt-1', name: 'A세션' }];
  const routines = [{ id: 'rt-1', name: '루틴A' }];

  test('세트 기록이 있는 로그 → 각 행 구조 확인', () => {
    const workoutLogs = [
      { id: 'log-1', session_id: 'sess-1', start_time: '2024-06-01T10:00:00Z' },
    ];
    const setRecords = [
      {
        id: 'sr-1',
        workout_log_id: 'log-1',
        exercise_id: 'ex-1',
        set_number: 1,
        weight: 80,
        record: 10,
        side: 'both',
        memo: '메모',
      },
    ];
    const rows = buildWorkoutHistoryExport({ workoutLogs, setRecords, sessions, routines, exercises });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      루틴명: '루틴A',
      세션명: 'A세션',
      운동명: '벤치프레스',
      세트번호: 1,
      무게_kg: 80,
      방향: '양측',
      메모: '메모',
    });
  });

  test('방향 변환 — L → 좌, R → 우', () => {
    const workoutLogs = [{ id: 'log-1', session_id: 'sess-1', start_time: '2024-01-01T00:00:00Z' }];
    const setRecords = [
      { id: 'sr-1', workout_log_id: 'log-1', exercise_id: 'ex-1', set_number: 1, side: 'L' },
      { id: 'sr-2', workout_log_id: 'log-1', exercise_id: 'ex-1', set_number: 2, side: 'R' },
    ];
    const rows = buildWorkoutHistoryExport({ workoutLogs, setRecords, sessions, routines, exercises });
    expect(rows[0].방향).toBe('좌');
    expect(rows[1].방향).toBe('우');
  });

  test('세트 기록 없는 로그 → (기록 없음) 행 추가', () => {
    const workoutLogs = [{ id: 'log-1', session_id: 'sess-1', start_time: '2024-01-01T00:00:00Z' }];
    const rows = buildWorkoutHistoryExport({ workoutLogs, setRecords: [], sessions, routines, exercises });
    expect(rows).toHaveLength(1);
    expect(rows[0].운동명).toBe('(기록 없음)');
  });

  test('빈 데이터면 빈 배열', () => {
    const rows = buildWorkoutHistoryExport({
      workoutLogs: [],
      setRecords: [],
      sessions: [],
      routines: [],
      exercises: [],
    });
    expect(rows).toHaveLength(0);
  });

  test('start_time 없는 로그 → 날짜 빈 문자열', () => {
    const workoutLogs = [{ id: 'log-1', session_id: 'sess-1', start_time: null }];
    const rows = buildWorkoutHistoryExport({ workoutLogs, setRecords: [], sessions, routines, exercises });
    expect(rows[0].날짜).toBe('');
  });
});

// ─────────────────────────────────────────────
// buildExercisesExport
// ─────────────────────────────────────────────

describe('buildExercisesExport', () => {
  test('기본 필드 매핑', () => {
    const exercises = [
      {
        id: 'ex-1',
        name: '스쿼트',
        english_name: 'Squat',
        primary_muscle: '대퇴사두근',
        secondary_muscles: ['둔근', '햄스트링'],
        equipment: '바벨',
        category: '근력',
        unit: 'kg',
        is_unilateral: false,
        synonyms: ['스쿼트운동'],
      },
    ];
    const rows = buildExercisesExport({ exercises });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      운동명: '스쿼트',
      영문명: 'Squat',
      주동근: '대퇴사두근',
      보조근: '둔근 / 햄스트링',
      장비: '바벨',
      카테고리: '근력',
      단위: 'kg',
      편측성: '아니오',
      동의어: '스쿼트운동',
    });
  });

  test('편측성 운동은 예 표시', () => {
    const exercises = [{ id: 'ex-1', name: '런지', is_unilateral: true }];
    const rows = buildExercisesExport({ exercises });
    expect(rows[0].편측성).toBe('예');
  });

  test('camelCase 필드 대체 사용 (primaryMuscle, englishName)', () => {
    const exercises = [
      { id: 'ex-1', name: '런지', primaryMuscle: '대퇴사두근', englishName: 'Lunge' },
    ];
    const rows = buildExercisesExport({ exercises });
    expect(rows[0].주동근).toBe('대퇴사두근');
    expect(rows[0].영문명).toBe('Lunge');
  });

  test('secondaryMuscles 없으면 빈 문자열', () => {
    const exercises = [{ id: 'ex-1', name: '풀업' }];
    const rows = buildExercisesExport({ exercises });
    expect(rows[0].보조근).toBe('');
  });

  test('빈 exercises 배열 → 빈 배열', () => {
    expect(buildExercisesExport({ exercises: [] })).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────
// buildExerciseGroupsExport
// ─────────────────────────────────────────────

describe('buildExerciseGroupsExport', () => {
  const sessions = [{ id: 'sess-1', name: 'A세션' }];

  test('그룹 데이터를 올바르게 매핑', () => {
    const sessionExerciseGroups = [
      {
        id: 'grp-1',
        session_id: 'sess-1',
        name: '슈퍼세트',
        start_order: 1,
        size: 2,
        color: '#ff0000',
      },
    ];
    const rows = buildExerciseGroupsExport({ sessions, sessionExerciseGroups });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      세션명: 'A세션',
      그룹명: '슈퍼세트',
      시작순서: 1,
      크기: 2,
      색상: '#ff0000',
    });
  });

  test('session_id 없는 그룹은 제외', () => {
    const sessionExerciseGroups = [{ id: 'grp-1', name: '고아그룹' }];
    const rows = buildExerciseGroupsExport({ sessions, sessionExerciseGroups });
    expect(rows).toHaveLength(0);
  });

  test('sessionExerciseGroups가 undefined/null이면 빈 배열', () => {
    expect(buildExerciseGroupsExport({ sessions, sessionExerciseGroups: undefined })).toHaveLength(0);
    expect(buildExerciseGroupsExport({ sessions, sessionExerciseGroups: null })).toHaveLength(0);
  });

  test('start_order 기준으로 정렬됨', () => {
    const sessionExerciseGroups = [
      { id: 'grp-2', session_id: 'sess-1', name: 'B그룹', start_order: 3, size: 2 },
      { id: 'grp-1', session_id: 'sess-1', name: 'A그룹', start_order: 1, size: 2 },
    ];
    const rows = buildExerciseGroupsExport({ sessions, sessionExerciseGroups });
    expect(rows[0].그룹명).toBe('A그룹');
    expect(rows[1].그룹명).toBe('B그룹');
  });
});

// ─────────────────────────────────────────────
// buildSummaryExport
// ─────────────────────────────────────────────

describe('buildSummaryExport', () => {
  const exercises = [
    { id: 'ex-1', name: '스쿼트' },
    { id: 'ex-2', name: '벤치프레스' },
  ];

  test('총 운동 횟수, 총 세트 기록 수, 사용 종목 수 확인', () => {
    const workoutLogs = [{ id: 'log-1' }, { id: 'log-2' }];
    const setRecords = [
      { exercise_id: 'ex-1' },
      { exercise_id: 'ex-1' },
      { exercise_id: 'ex-2' },
    ];
    const rows = buildSummaryExport({ workoutLogs, setRecords, exercises });

    const totalWorkouts = rows.find((r) => r.항목 === '총 운동 횟수');
    const totalSets = rows.find((r) => r.항목 === '총 세트 기록 수');
    const totalExercises = rows.find((r) => r.항목 === '사용 운동 종목 수');

    expect(totalWorkouts.값).toBe(2);
    expect(totalSets.값).toBe(3);
    expect(totalExercises.값).toBe(2);
  });

  test('운동별 세트 수가 내림차순으로 포함됨', () => {
    const workoutLogs = [];
    const setRecords = [
      { exercise_id: 'ex-1' },
      { exercise_id: 'ex-1' },
      { exercise_id: 'ex-2' },
    ];
    const rows = buildSummaryExport({ workoutLogs, setRecords, exercises });
    const exerciseRows = rows.filter((r) => r.항목 === '스쿼트' || r.항목 === '벤치프레스');
    expect(exerciseRows[0].항목).toBe('스쿼트');
    expect(exerciseRows[0].값).toBe(2);
    expect(exerciseRows[1].항목).toBe('벤치프레스');
    expect(exerciseRows[1].값).toBe(1);
  });

  test('세트 기록 없으면 운동별 행 없음', () => {
    const rows = buildSummaryExport({ workoutLogs: [], setRecords: [], exercises });
    const exerciseRows = rows.filter((r) => r.항목 === '스쿼트' || r.항목 === '벤치프레스');
    expect(exerciseRows).toHaveLength(0);
  });

  test('알 수 없는 exercise_id는 (알 수 없음) 표시', () => {
    const setRecords = [{ exercise_id: 'UNKNOWN' }];
    const rows = buildSummaryExport({ workoutLogs: [], setRecords, exercises });
    const unknownRow = rows.find((r) => r.항목 === '(알 수 없음)');
    expect(unknownRow).toBeDefined();
    expect(unknownRow.값).toBe(1);
  });
});
