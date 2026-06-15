 
import React from 'react';
import { Pause, Play, X } from 'lucide-react';

function formatRestTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.ceil(Number(seconds) || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const restSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(restSeconds).padStart(2, '0')}`;
}

export interface RestTimerState {
  remainingSeconds: number;
  durationSeconds: number;
  isPaused: boolean;
  mode?: string;
  exerciseName?: string;
  nextExerciseName?: string;
  setNumber?: number | string;
}

export default function RestTimer({ timer, isVisible, onTogglePause, onDismiss }: { timer: RestTimerState | null; isVisible: boolean; onTogglePause: () => void; onDismiss: () => void }) {
  const shouldRender = isVisible && timer;
  const isComplete = shouldRender && timer.remainingSeconds <= 0;
  const progress = shouldRender && timer.durationSeconds > 0
    ? 1 - Math.max(0, timer.remainingSeconds) / timer.durationSeconds
    : 0;
  const title = timer?.mode === 'exercise'
    ? `${timer.exerciseName || '운동'} 완료, ${timer.nextExerciseName || '다음 운동'} 전 휴식`
    : `${timer?.exerciseName || '운동'} ${timer?.setNumber || ''}세트 후 휴식`;

  return (
    <div className={`rest-timer-stage ${shouldRender ? 'has-timer' : ''}`}>
      {shouldRender && (
        <section
          className={`rest-timer ${isComplete ? 'is-complete' : ''} ${timer.isPaused ? 'is-paused' : ''}`}
          aria-live="polite"
          title={title}
        >
          <div className="rest-timer__meter" aria-hidden="true">
            <span style={{ transform: `scaleX(${Math.min(1, Math.max(0, progress))})` }} />
          </div>

          <output className="rest-timer__time" aria-label="남은 휴식 시간">
            {formatRestTime(timer.remainingSeconds)}
          </output>

          <div className="rest-timer__actions">
            <button
              type="button"
              onClick={onTogglePause}
              className="rest-timer__button"
              aria-label={timer.isPaused ? '휴식 타이머 재개' : '휴식 타이머 일시정지'}
              title={timer.isPaused ? '재개' : '일시정지'}
              disabled={Boolean(isComplete)}
            >
              {timer.isPaused ? <Play size={15} /> : <Pause size={15} />}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="rest-timer__button"
              aria-label="휴식 타이머 닫기"
              title="닫기"
            >
              <X size={15} />
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
