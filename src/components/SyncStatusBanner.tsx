import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useWorkoutStore } from '../store/useWorkoutStore';

const REMOTE_SYNC_LABELS: Record<string, string> = {
  addExercise: '운동 추가',
  deleteExercise: '운동 삭제',
  updateExercise: '운동 수정',
  addRoutine: '루틴 생성',
  deleteRoutine: '루틴 삭제',
  updateRoutine: '루틴 이름 수정',
  duplicateRoutine: '루틴 복제',
  addSession: '세션 생성',
  createTemporarySession: '임시 세션 생성',
  deleteSession: '세션 삭제',
  updateSession: '세션 이름 수정',
  reorderSessions: '세션 순서 변경',
  addSessionExercise: '운동 배치',
  deleteSessionExercise: '운동 제거',
  updateSessionExercise: '운동 설정 수정',
  reorderSessionExercises: '운동 순서 변경',
  startWorkoutLog: '운동 시작 기록',
  finishWorkoutLog: '운동 완료 기록',
  deleteWorkoutLog: '운동 로그 삭제',
  saveWorkoutLog: '운동 저장',
  addSetRecord: '세트 기록 추가',
  updateSetRecord: '세트 기록 수정',
  deleteSetRecord: '세트 기록 삭제',
  clearAllData: '데이터 초기화',
  generateDummyData: '더미 데이터 생성',
};

export default function SyncStatusBanner() {
  const currentUser = useWorkoutStore((state) => state.currentUser);
  const remoteSyncError = useWorkoutStore((state) => state.remoteSyncError);
  const retryFailedRemoteSync = useWorkoutStore((state) => state.retryFailedRemoteSync);

  if (!remoteSyncError || currentUser.isGuest) return null;

  const actionLabel = REMOTE_SYNC_LABELS[remoteSyncError.label] || '원격 저장';
  const pendingText = `${remoteSyncError.pendingCount || 1}개 작업 대기`;

  return (
    <div className="sync-status-banner" role="status" aria-live="polite">
      <AlertTriangle className="sync-status-banner__icon" size={17} />
      <div className="sync-status-banner__copy">
        <div className="sync-status-banner__title">클라우드 동기화 실패</div>
        <div className="sync-status-banner__detail" title={remoteSyncError.message}>
          로컬에는 저장됨 · {actionLabel} · {pendingText}
        </div>
      </div>
      <button
        className="sync-status-banner__retry"
        type="button"
        onClick={retryFailedRemoteSync}
        disabled={remoteSyncError.isRetrying}
      >
        <RefreshCw
          size={13}
          className={remoteSyncError.isRetrying ? 'sync-status-banner__retry-icon is-spinning' : 'sync-status-banner__retry-icon'}
        />
        {remoteSyncError.isRetrying ? '재시도 중' : '재시도'}
      </button>
    </div>
  );
}
