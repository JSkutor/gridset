import React, { useEffect, useMemo, useRef } from 'react';
import { Flame, Dumbbell, Activity, TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { formatDate, formatDuration, getExerciseDisplayUnit, isBodyweightMetric } from '../utils/logFormatters';
import { getFormattedSessionName } from '../utils/sessionHelper';

// --- Pure Utility: Calculates the best set for a given exercise based on intensity or reps ---
function calculateBestSet(records, exercise) {
  let bestSet = null;
  let maxScore = -1;

  records.forEach((record) => {
    const reps = parseInt(record.record, 10) || 0;
    const weight = parseFloat(record.weight) || 0;

    if (exercise) {
      if (isBodyweightMetric(exercise)) {
        if (reps > maxScore) {
          maxScore = reps;
          bestSet = record;
        }
      } else {
        const score = weight * 1000 + reps;
        if (score > maxScore) {
          maxScore = score;
          bestSet = record;
        }
      }
    }
  });

  let bestSetText = '-';
  if (bestSet && exercise) {
    const displayUnit = getExerciseDisplayUnit(exercise);
    if (isBodyweightMetric(exercise)) {
      bestSetText = `${bestSet.record}${displayUnit}`;
    } else {
      bestSetText = `${bestSet.weight}kg × ${bestSet.record}회`;
    }
  }

  return { bestSet, bestSetText };
}

// --- Pure Utility: Analyzes progressive overload delta against historical set records ---
function calculateOverload(bestSet, exercise, setRecords, workoutLogId, exerciseId) {
  let isPR = false;
  let isFirstRecord = false;
  let overloadText = '';

  if (!bestSet || !exercise) {
    return { isPR, isFirstRecord, overloadText };
  }

  const pastRecords = setRecords.filter(
    (r) => r.exercise_id === exerciseId && r.workout_log_id !== workoutLogId
  );

  if (pastRecords.length === 0) {
    isFirstRecord = true;
    isPR = true;
    overloadText = '신규 등록';
  } else {
    const repsToday = parseInt(bestSet.record, 10) || 0;
    const weightToday = parseFloat(bestSet.weight) || 0;

    // Find the historical best set
    let pastBestSet = null;
    let maxPastScore = -1;
    pastRecords.forEach((r) => {
      const rReps = parseInt(r.record, 10) || 0;
      const rWeight = parseFloat(r.weight) || 0;
      if (isBodyweightMetric(exercise)) {
        if (rReps > maxPastScore) {
          maxPastScore = rReps;
          pastBestSet = r;
        }
      } else {
        const score = rWeight * 1000 + rReps;
        if (score > maxPastScore) {
          maxPastScore = score;
          pastBestSet = r;
        }
      }
    });

    if (pastBestSet) {
      const repsPast = parseInt(pastBestSet.record, 10) || 0;
      const weightPast = parseFloat(pastBestSet.weight) || 0;

      if (isBodyweightMetric(exercise)) {
        if (repsToday > repsPast) {
          isPR = true;
          overloadText = `점진적 과부하 +${repsToday - repsPast}회`;
        }
      } else {
        if (weightToday > weightPast) {
          isPR = true;
          overloadText = `점진적 과부하 +${(weightToday - weightPast).toFixed(1).replace(/\.0$/, '')}kg`;
        } else if (weightToday === weightPast && repsToday > repsPast) {
          isPR = true;
          overloadText = `점진적 과부하 +${repsToday - repsPast}회`;
        }
      }
    }
  }

  return { isPR, isFirstRecord, overloadText };
}

// --- Confetti Engine Particles Definition ---
class ConfettiParticle {
  constructor(canvasWidth, canvasHeight, side) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.opacity = 1;
    this.friction = 0.96;
    this.gravity = 0.45;
    
    if (side === 'left') {
      this.x = -10;
      this.y = canvasHeight - 20;
      this.vx = Math.random() * 12 + 6;
      this.vy = -(Math.random() * 16 + 14);
    } else {
      this.x = canvasWidth + 10;
      this.y = canvasHeight - 20;
      this.vx = -(Math.random() * 12 + 6);
      this.vy = -(Math.random() * 16 + 14);
    }
    
    this.width = Math.random() * 8 + 6;
    this.height = Math.random() * 12 + 8;
    
    const colors = [
      '#7aa2f7', // Tokyo Blue
      '#bb9af7', // Tokyo Purple
      '#ff007c', // Neon Pink
      '#9ece6a', // Neon Green
      '#e0af68', // Warm Amber
      '#0db9d7', // Neon Cyan
    ];
    this.color = colors[Math.floor(Math.random() * colors.length)];
    
    this.rotation = Math.random() * 360;
    this.rotationSpeed = Math.random() * 4 - 2;
    this.wobble = Math.random() * Math.PI;
    this.wobbleSpeed = Math.random() * 0.1 + 0.05;
  }

  update() {
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.vy += this.gravity;
    
    this.x += this.vx;
    this.y += this.vy;
    
    this.rotation += this.rotationSpeed;
    this.wobble += this.wobbleSpeed;
    
    if (this.vy > 2) {
      this.opacity -= 0.015;
    }
  }

  draw(ctx) {
    if (this.opacity <= 0) return;
    
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);
    
    const scaleX = Math.sin(this.wobble);
    ctx.scale(scaleX, 1);
    
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.opacity;
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    
    ctx.restore();
  }
}

export default function WorkoutCompletionModal({ isOpen, workoutLog, onClose }) {
  const canvasRef = useRef(null);

  // Store data selectors
  const setRecords = useWorkoutStore((state) => state.setRecords);
  const exercises = useWorkoutStore((state) => state.exercises);
  const sessions = useWorkoutStore((state) => state.sessions);

  // Filter set records for today's workout log
  const todayRecords = useMemo(() => {
    if (!workoutLog) return [];
    return setRecords.filter((r) => r.workout_log_id === workoutLog.id);
  }, [setRecords, workoutLog]);

  // Lookup helper maps
  const exercisesById = useMemo(() => new Map(exercises.map((ex) => [ex.id, ex])), [exercises]);
  const sessionsById = useMemo(() => new Map(sessions.map((s) => [s.id, s])), [sessions]);

  const activeSession = useMemo(() => {
    if (!workoutLog) return null;
    return sessionsById.get(workoutLog.session_id);
  }, [sessionsById, workoutLog]);

  // Compute dynamic stats (Volume, Sets, Reps, Max Weight)
  const stats = useMemo(() => {
    let totalVolume = 0;
    let totalReps = 0;
    let maxWeight = 0;
    const totalSets = todayRecords.length;

    todayRecords.forEach((record) => {
      const exercise = exercisesById.get(record.exercise_id);
      const reps = parseInt(record.record, 10) || 0;
      const weight = parseFloat(record.weight) || 0;

      if (exercise && !isBodyweightMetric(exercise)) {
        totalVolume += weight * reps;
      }
      totalReps += reps;
      if (weight > maxWeight) {
        maxWeight = weight;
      }
    });

    return { totalVolume, totalSets, totalReps, maxWeight };
  }, [todayRecords, exercisesById]);

  // Group records by exercise and calculate the "Best Set" and "PR" status
  const exerciseSummaries = useMemo(() => {
    const grouped = new Map();

    todayRecords.forEach((record) => {
      if (!grouped.has(record.exercise_id)) {
        grouped.set(record.exercise_id, []);
      }
      grouped.get(record.exercise_id).push(record);
    });

    return [...grouped.entries()].map(([exerciseId, records]) => {
      const exercise = exercisesById.get(exerciseId);
      
      const { bestSet, bestSetText } = calculateBestSet(records, exercise);
      const { isPR, isFirstRecord, overloadText } = calculateOverload(
        bestSet, 
        exercise, 
        setRecords, 
        workoutLog.id, 
        exerciseId
      );

      return {
        id: exerciseId,
        name: exercise?.name || '알 수 없는 운동',
        setsCount: records.length,
        bestSetText,
        isPR,
        isFirstRecord,
        overloadText,
      };
    }).sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }, [todayRecords, exercisesById, setRecords, workoutLog]);

  // Aggregate if there is any PR in today's session
  const hasAnyPR = useMemo(() => {
    return exerciseSummaries.some(item => item.isPR && !item.isFirstRecord);
  }, [exerciseSummaries]);

  // Confetti Animation Engine
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return undefined;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const particles = [];
    const scaleFactor = canvas.width / window.devicePixelRatio;
    const heightFactor = canvas.height / window.devicePixelRatio;

    for (let i = 0; i < 70; i++) {
      particles.push(new ConfettiParticle(scaleFactor, heightFactor, 'left'));
    }
    for (let i = 0; i < 70; i++) {
      particles.push(new ConfettiParticle(scaleFactor, heightFactor, 'right'));
    }

    let animationId = null;

    const renderLoop = () => {
      ctx.clearRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw(ctx);

        if (p.opacity <= 0 || p.x < -50 || p.x > scaleFactor + 50 || p.y > heightFactor + 50) {
          particles.splice(i, 1);
        }
      }

      if (particles.length > 0) {
        animationId = requestAnimationFrame(renderLoop);
      }
    };

    renderLoop();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isOpen]);

  if (!isOpen || !workoutLog) return null;

  const sessionColor = activeSession?.color || '#7aa2f7';
  
  // Style config passing custom variables for Session Glow and Borders
  const customVariables = {
    '--session-color': sessionColor,
    '--session-color-glow': `${sessionColor}2b`, // 17% opacity glow
    '--session-color-bright': sessionColor,
  };

  return (
    <div 
      className="completion-backdrop" 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="completion-title"
      style={customVariables}
    >
      <canvas ref={canvasRef} className="completion-confetti-canvas" />
      
      <div className="completion-card fade-in">
        
        {/* Confetti & Star Header */}
        <div className="completion-header">
          <div className="completion-icon-wrapper">
            <CheckCircle2 size={42} className="completion-check-icon" />
            <Sparkles size={20} className="completion-sparkles-icon animate-pulse-subtle" />
          </div>
          <h2 id="completion-title" className="completion-title">운동 완료! 수고하셨습니다</h2>
          <p className="completion-subtitle">
            {hasAnyPR 
              ? '지속적인 훈련을 통해 점진적 과부하를 성공적으로 달성했습니다.' 
              : '오늘의 훈련 일지가 저장되었습니다. 꾸준한 수행은 점진적 과부하의 기반이 됩니다.'
            }
          </p>
        </div>

        {/* Workout Log Information Banner */}
        <div className="completion-info-banner">
          <div className="info-banner-border" />
          <div className="info-banner-details">
            <h3>{activeSession ? getFormattedSessionName(activeSession, sessions) : '자유 훈련'}</h3>
            <span>{formatDate(workoutLog.start_time, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}</span>
          </div>
          <div className="info-banner-duration">
            <span className="duration-label">수행 시간</span>
            <span className="duration-value">{formatDuration(workoutLog.start_time, workoutLog.end_time)}</span>
          </div>
        </div>

        {/* 4 Premium Statistics Cards - Overload Focused */}
        <div className="completion-stats-grid">
          <div className="comp-stat-card volume-card">
            <div className="comp-stat-icon-wrap bg-orange">
              <Flame size={17} className="text-orange animate-bounce-subtle" />
            </div>
            <div className="comp-stat-content">
              <span className="comp-stat-label">총 훈련 볼륨</span>
              <strong className="comp-stat-value">
                {stats.totalVolume > 0 ? `${stats.totalVolume.toLocaleString()} kg` : '—'}
              </strong>
              <span className="comp-stat-desc">수행한 중량의 누적 볼륨</span>
            </div>
          </div>

          <div className="comp-stat-card sets-card">
            <div className="comp-stat-icon-wrap bg-purple">
              <Dumbbell size={17} className="text-purple" />
            </div>
            <div className="comp-stat-content">
              <span className="comp-stat-label">총 수행 세트수</span>
              <strong className="comp-stat-value">{stats.totalSets}세트</strong>
              <span className="comp-stat-desc">완료한 세트의 총합</span>
            </div>
          </div>

          <div className="comp-stat-card reps-card">
            <div className="comp-stat-icon-wrap bg-emerald">
              <Activity size={17} className="text-emerald" />
            </div>
            <div className="comp-stat-content">
              <span className="comp-stat-label">총 수행 횟수</span>
              <strong className="comp-stat-value">{stats.totalReps}회</strong>
              <span className="comp-stat-desc">전체 세트의 누적 동작 횟수</span>
            </div>
          </div>

          <div className="comp-stat-card intensity-card">
            <div className="comp-stat-icon-wrap bg-blue">
              <TrendingUp size={17} className="text-blue" />
            </div>
            <div className="comp-stat-content">
              <span className="comp-stat-label">최고 수행 중량</span>
              <strong className="comp-stat-value">
                {stats.maxWeight > 0 ? `${stats.maxWeight.toLocaleString()} kg` : '—'}
              </strong>
              <span className="comp-stat-desc">오늘 다룬 최고의 훈련 강도</span>
            </div>
          </div>
        </div>

        {/* Detailed Exercise Breakdown */}
        <div className="completion-breakdown-section">
          <h3>수행 종목별 부하 분석</h3>
          <div className="completion-breakdown-list scrollbar-none">
            {exerciseSummaries.map((item) => (
              <div 
                key={item.id} 
                className={`completion-breakdown-row ${item.isPR ? 'is-pr-row' : ''}`}
              >
                <div className="breakdown-row-name">
                  <div className="exercise-name-badge-wrap">
                    <strong>{item.name}</strong>
                    {item.isPR && (
                      <span className={`pr-gold-badge ${item.isFirstRecord ? 'first-badge' : ''}`}>
                        {item.overloadText}
                      </span>
                    )}
                  </div>
                  <span>{item.setsCount}세트 완료</span>
                </div>
                <div className="breakdown-row-badge">
                  <span className={`best-set-pill ${item.isPR ? 'pr-best-set' : ''}`}>
                    Best {item.bestSetText}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="completion-footer">
          <button 
            type="button" 
            className="completion-primary-btn" 
            onClick={onClose}
          >
            기록 페이지에서 확인하기
          </button>
        </div>
      </div>
    </div>
  );
}
