import JSZip from "jszip";

type CSVCell = string | number | boolean | null | undefined;
export type CSVRow = Record<string, CSVCell>;

type ExportRoutine = {
  id: string;
  name: string;
};

type ExportSession = {
  id: string;
  routine_id: string;
  name: string;
  session_order?: number | null;
};

type ExportSessionExercise = {
  id?: string;
  session_id: string;
  exercise_id: string;
  order?: number | null;
  target_sets?: number | string | null;
  target_record?: number | string | null;
  rest_between_sets?: number | string | null;
  rest_after_exercise?: number | string | null;
};

type ExportExercise = {
  id: string;
  name: string;
  englishName?: string | null;
  english_name?: string | null;
  primary_muscle?: string | null;
  primaryMuscle?: string | null;
  secondaryMuscles?: string[] | null;
  secondary_muscles?: string[] | null;
  equipment?: string | null;
  category?: string | null;
  unit?: string | null;
  is_unilateral?: boolean | null;
  synonyms?: string[] | null;
};

type ExportSessionExerciseGroup = {
  id?: string;
  session_id?: string | null;
  name?: string | null;
  start_order?: number | null;
  size?: number | null;
  color?: string | null;
};

type ExportWorkoutLog = {
  id: string;
  session_id?: string | null;
  start_time?: string | null;
};

type ExportSetRecord = {
  id?: string;
  workout_log_id: string;
  exercise_id?: string | null;
  set_number?: number | null;
  weight?: number | string | null;
  record?: number | string | null;
  side?: "L" | "R" | "both" | string | null;
  memo?: string | null;
};

export type ExportStoreData = {
  routines: ExportRoutine[];
  sessions: ExportSession[];
  sessionExercises: ExportSessionExercise[];
  sessionExerciseGroups?: ExportSessionExerciseGroup[];
  exercises: ExportExercise[];
  workoutLogs: ExportWorkoutLog[];
  setRecords: ExportSetRecord[];
};

/**
 * 객체 배열을 CSV 문자열로 변환
 */
export function toCSV(rows?: CSVRow[] | null) {
  if (!rows || rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (val: CSVCell) => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return lines.join("\n");
}

// ─────────────────────────────────────────────
// 각 CSV 데이터셋 생성 함수
// ─────────────────────────────────────────────

export function buildRoutinesExport({
  routines,
  sessions,
  sessionExercises,
  exercises,
}: Pick<ExportStoreData, "routines" | "sessions" | "sessionExercises" | "exercises">): CSVRow[] {
  const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

  const rows = [];
  // routine_id 순으로 정렬
  const sortedRoutines = [...routines].sort((a, b) =>
    a.name.localeCompare(b.name, "ko"),
  );

  for (const routine of sortedRoutines) {
    const routineSessions = sessions
      .filter((s) => s.routine_id === routine.id)
      .sort((a, b) => (a.session_order || 0) - (b.session_order || 0));

    for (const session of routineSessions) {
      const exLinks = sessionExercises
        .filter((se) => se.session_id === session.id)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      for (const link of exLinks) {
        const exercise = exerciseMap.get(link.exercise_id);
        rows.push({
          루틴명: routine.name,
          세션명: session.name,
          세션순서: session.session_order,
          운동명: exercise?.name || "(알 수 없음)",
          목표세트: link.target_sets,
          목표기록: link.target_record,
          세트간휴식초: link.rest_between_sets,
          운동후휴식초: link.rest_after_exercise,
        });
      }

      // 운동이 없는 세션도 이름만 표시
      if (exLinks.length === 0) {
        rows.push({
          루틴명: routine.name,
          세션명: session.name,
          세션순서: session.session_order,
          운동명: "(운동 없음)",
          목표세트: "",
          목표기록: "",
          세트간휴식초: "",
          운동후휴식초: "",
        });
      }
    }
  }

  return rows;
}

export function buildWorkoutHistoryExport({
  workoutLogs,
  setRecords,
  sessions,
  routines,
  exercises,
}: Pick<ExportStoreData, "workoutLogs" | "setRecords" | "sessions" | "routines" | "exercises">): CSVRow[] {
  const exerciseMap = new Map(exercises.map((e) => [e.id, e]));
  const sessionMap = new Map(sessions.map((s) => [s.id, s]));
  const routineMap = new Map(routines.map((r) => [r.id, r]));

  const sortedLogs = [...workoutLogs].sort(
    (a, b) => new Date(b.start_time ?? 0).getTime() - new Date(a.start_time ?? 0).getTime(),
  );

  const rows: CSVRow[] = [];
  for (const log of sortedLogs) {
    const session = log.session_id ? sessionMap.get(log.session_id) : undefined;
    const routine = session ? routineMap.get(session.routine_id) : null;
    const date = log.start_time
      ? new Date(log.start_time).toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
      : "";

    const records = setRecords
      .filter((sr) => sr.workout_log_id === log.id)
      .sort((a, b) => (a.set_number || 0) - (b.set_number || 0));

    if (records.length === 0) {
      rows.push({
        날짜: date,
        루틴명: routine?.name || "",
        세션명: session?.name || "",
        운동명: "(기록 없음)",
        세트번호: "",
        무게_kg: "",
        횟수_또는_시간: "",
        방향: "",
        메모: "",
      });
    }

    for (const record of records) {
      const exercise = record.exercise_id ? exerciseMap.get(record.exercise_id) : undefined;
      rows.push({
        날짜: date,
        루틴명: routine?.name || "",
        세션명: session?.name || "",
        운동명: exercise?.name || "(알 수 없음)",
        세트번호: record.set_number,
        무게_kg: record.weight,
        횟수_또는_시간: record.record,
        방향:
          record.side === "both" ? "양측" : record.side === "L" ? "좌" : "우",
        메모: record.memo || "",
      });
    }
  }

  return rows;
}

export function buildExercisesExport({ exercises }: Pick<ExportStoreData, "exercises">): CSVRow[] {
  return exercises.map((ex) => ({
    운동명: ex.name,
    영문명: ex.englishName || ex.english_name || "",
    주동근: ex.primary_muscle || ex.primaryMuscle || "",
    보조근: Array.isArray(ex.secondaryMuscles ?? ex.secondary_muscles)
      ? (ex.secondaryMuscles ?? ex.secondary_muscles ?? []).join(" / ")
      : "",
    장비: ex.equipment || "",
    카테고리: ex.category || "",
    단위: ex.unit || "",
    편측성: ex.is_unilateral ? "예" : "아니오",
    동의어: Array.isArray(ex.synonyms) ? ex.synonyms.join(" / ") : "",
  }));
}

export function buildExerciseGroupsExport({
  sessions,
  sessionExerciseGroups,
}: Pick<ExportStoreData, "sessions" | "sessionExerciseGroups">): CSVRow[] {
  const sessionMap = new Map(sessions.map((s) => [s.id, s]));

  return (sessionExerciseGroups || [])
    .filter((g) => g.session_id)
    .sort((a, b) => {
      const sA = a.session_id || "";
      const sB = b.session_id || "";
      if (sA !== sB) return sA.localeCompare(sB);
      return (a.start_order || 0) - (b.start_order || 0);
    })
    .map((group) => ({
      세션명: group.session_id ? sessionMap.get(group.session_id)?.name || "" : "",
      그룹명: group.name || "",
      시작순서: group.start_order,
      크기: group.size,
      색상: group.color || "",
    }));
}

export function buildSummaryExport({
  workoutLogs,
  setRecords,
  exercises,
}: Pick<ExportStoreData, "workoutLogs" | "setRecords" | "exercises">): CSVRow[] {
  // 간단 통계: 운동별 총 수행 횟수
  const exerciseMap = new Map(exercises.map((e) => [e.id, e]));
  const exerciseCount = new Map<string | null | undefined, number>();

  for (const sr of setRecords) {
    const exId = sr.exercise_id;
    exerciseCount.set(exId, (exerciseCount.get(exId) || 0) + 1);
  }

  const rows: CSVRow[] = [];
  for (const [exId, count] of [...exerciseCount.entries()].sort(
    (a, b) => b[1] - a[1],
  )) {
    const exercise = exId ? exerciseMap.get(exId) : undefined;
    rows.push({
      운동명: exercise?.name || "(알 수 없음)",
      총수행세트수: count,
    });
  }

  rows.unshift({ 운동명: "--- 운동별 총 수행 세트 수 ---", 총수행세트수: "" });

  // 운동 횟수
  const totalWorkouts = workoutLogs.length;
  const totalSets = setRecords.length;

  return [
    { 항목: "총 운동 횟수", 값: totalWorkouts },
    { 항목: "총 세트 기록 수", 값: totalSets },
    { 항목: "사용 운동 종목 수", 값: exercises.length },
    { 항목: "", 값: "" },
    { 항목: "--- 운동별 수행 세트 수 (내림차순) ---", 값: "" },
    ...rows.map((r) => ({ 항목: r.운동명, 값: r.총수행세트수 })),
  ];
}

// ─────────────────────────────────────────────
// 메인 export 함수
// ─────────────────────────────────────────────

/**
 * Zustand store의 데이터를 받아 ZIP(CSV) 파일로 다운로드
 *
 * @param {Object} storeData - Zustand store state
 * @param {Array} storeData.routines
 * @param {Array} storeData.sessions
 * @param {Array} storeData.sessionExercises
 * @param {Array} storeData.sessionExerciseGroups
 * @param {Array} storeData.exercises
 * @param {Array} storeData.workoutLogs
 * @param {Array} storeData.setRecords
 */
export async function downloadDataAsCSV(storeData: ExportStoreData) {
  const zip = new JSZip();

  // 1. workout_history.csv — 가장 중요한 데이터
  const historyRows = buildWorkoutHistoryExport(storeData);
  zip.file("workout_history.csv", toCSV(historyRows));

  // 2. routines.csv — 루틴 구조
  const routineRows = buildRoutinesExport(storeData);
  zip.file("routines.csv", toCSV(routineRows));

  // 3. exercises.csv — 운동 사전
  const exerciseRows = buildExercisesExport(storeData);
  zip.file("exercises.csv", toCSV(exerciseRows));

  // 4. exercise_groups.csv — 슈퍼세트/서킷 그룹
  const groupRows = buildExerciseGroupsExport(storeData);
  if (groupRows.length > 0) {
    zip.file("exercise_groups.csv", toCSV(groupRows));
  }

  // 5. summary.csv — 간단 통계
  const summaryRows = buildSummaryExport(storeData);
  zip.file("summary.csv", toCSV(summaryRows));

  // ZIP 생성 및 다운로드
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  a.download = `gridset-data-${dateStr}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * CSV 문자열만 반환 (미리보기용 등)
 */
export function generateCSVText(storeData: ExportStoreData) {
  return {
    workoutHistory: toCSV(buildWorkoutHistoryExport(storeData)),
    routines: toCSV(buildRoutinesExport(storeData)),
    exercises: toCSV(buildExercisesExport(storeData)),
    exerciseGroups: toCSV(buildExerciseGroupsExport(storeData)),
    summary: toCSV(buildSummaryExport(storeData)),
  };
}
