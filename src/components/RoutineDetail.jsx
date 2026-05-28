import React, { useState } from 'react';
import { Plus, Trash2, Dumbbell, ListPlus, ChevronDown, ChevronUp, Timer, Clock, RotateCcw } from 'lucide-react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import ExerciseAutocomplete from './ExerciseAutocomplete';

export default function RoutineDetail() {
  const sessions = useWorkoutStore(state => state.sessions);
  const sessionExercises = useWorkoutStore(state => state.sessionExercises);
  const exercises = useWorkoutStore(state => state.exercises);

  const addSession = useWorkoutStore(state => state.addSession);
  const deleteSession = useWorkoutStore(state => state.deleteSession);
  const addSessionExercise = useWorkoutStore(state => state.addSessionExercise);
  const deleteSessionExercise = useWorkoutStore(state => state.deleteSessionExercise);
  const updateSessionExercise = useWorkoutStore(state => state.updateSessionExercise);
  const addExercise = useWorkoutStore(state => state.addExercise);

  const [selectedSessionId, setSelectedSessionId] = useState(sessions[0]?.id || null);
  const [newSessionName, setNewSessionName] = useState('');
  const [isAddingSession, setIsAddingSession] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);

  // 현재 선택된 세션
  const activeSession = sessions.find(s => s.id === selectedSessionId) || sessions[0] || null;
  const activeSessionId = activeSession?.id || null;

  // 선택된 세션이 없으면 첫 번째로
  const effectiveSessionId = selectedSessionId || sessions[0]?.id || null;
  const effectiveSession = sessions.find(s => s.id === effectiveSessionId) || null;

  // 현재 세션의 운동들
  const activeSessionExercises = sessionExercises
    .filter(se => se.session_id === (effectiveSession?.id || null))
    .sort((a, b) => a.order - b.order);

  // 선택된 운동 상세
  const selectedExerciseLink = activeSessionExercises.find(se => se.id === selectedExerciseId);
  const selectedExercise = selectedExerciseLink
    ? exercises.find(e => e.id === selectedExerciseLink.exercise_id)
    : null;

  // 새 세션 생성
  const handleCreateSession = (e) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;
    const newSession = addSession(newSessionName.trim());
    setSelectedSessionId(newSession.id);
    setNewSessionName('');
    setIsAddingSession(false);
  };

  // 세션에 운동 추가
  const handleAddExerciseToSession = (dictExercise) => {
    if (!effectiveSession?.id) return;

    let storeExercise = exercises.find(ex => ex.name.toLowerCase() === dictExercise.name.toLowerCase());
    if (!storeExercise) {
      storeExercise = addExercise(
        dictExercise.name,
        dictExercise.primaryMuscle,
        dictExercise.equipment,
        dictExercise.category === 'cardio' ? 'reps' : 'kg'
      );
    }

    const alreadyExists = activeSessionExercises.some(se => se.exercise_id === storeExercise.id);
    if (alreadyExists) return;

    const nextOrder = activeSessionExercises.length + 1;
    const newSe = addSessionExercise(effectiveSession.id, storeExercise.id, nextOrder, 3, '10');
    setSelectedExerciseId(newSe.id);
  };

  const handleDeleteExercise = (id) => {
    deleteSessionExercise(id);
    if (selectedExerciseId === id) setSelectedExerciseId(null);
  };

  const handleUpdateTarget = (id, field, value) => {
    updateSessionExercise(id, { [field]: value });
  };

  const handleSelectSession = (id) => {
    setSelectedSessionId(id);
    setSelectedExerciseId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)', gap: 0 }}>

      {/* ── 상단: 루틴(세션) 가로 탭 ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '0 2px 28px 2px',
        flexShrink: 0,
        flexWrap: 'wrap',
      }}>
        {sessions.map(s => {
          const isActive = s.id === (effectiveSession?.id);
          return (
            <button
              key={s.id}
              onClick={() => handleSelectSession(s.id)}
              style={{
                padding: isActive ? '6px 0' : '6px 0',
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--text-bright)' : '2px solid transparent',
                color: isActive ? 'var(--text-bright)' : 'var(--text-muted)',
                fontWeight: isActive ? '700' : '400',
                fontSize: isActive ? '22px' : '20px',
                fontFamily: 'inherit',
                letterSpacing: '-0.03em',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                paddingRight: '20px',
                paddingLeft: '2px',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
              }}
            >
              {s.name}
            </button>
          );
        })}

        {/* 새 세션 추가 */}
        {isAddingSession ? (
          <form onSubmit={handleCreateSession} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="text"
              autoFocus
              placeholder="세션 명칭..."
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') { setIsAddingSession(false); setNewSessionName(''); }}}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: '2px solid var(--border-focus)',
                color: 'var(--text-bright)',
                fontSize: '20px',
                fontWeight: '600',
                fontFamily: 'inherit',
                letterSpacing: '-0.03em',
                outline: 'none',
                padding: '4px 4px 4px 2px',
                width: '160px',
              }}
            />
            <button type="submit" style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: '4px' }}>
              <Plus size={16} />
            </button>
          </form>
        ) : (
          <button
            onClick={() => setIsAddingSession(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '20px',
              fontFamily: 'inherit',
              cursor: 'pointer',
              padding: '6px 8px 6px 2px',
              opacity: 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
          >
            <Plus size={17} />
          </button>
        )}
      </div>

      {/* ── 하단: 3패널 ── */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '220px 1fr 260px',
        gap: '1px',
        overflow: 'hidden',
        borderTop: '1px solid var(--border)',
      }}>

        {/* 패널 1: 세션 목록 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--border)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 16px 10px',
            fontSize: '10px',
            fontWeight: '600',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}>
            세션
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 16px' }}>
            {sessions.length === 0 ? (
              <div style={{ padding: '20px 8px', color: 'var(--text-muted)', fontSize: '13px', opacity: 0.6 }}>
                세션이 없습니다
              </div>
            ) : (
              sessions.map(s => {
                const isActive = s.id === effectiveSession?.id;
                const count = sessionExercises.filter(se => se.session_id === s.id).length;
                return (
                  <div
                    key={s.id}
                    onClick={() => handleSelectSession(s.id)}
                    style={{
                      padding: '10px 10px',
                      borderRadius: '7px',
                      cursor: 'pointer',
                      background: isActive ? 'rgba(228, 232, 240, 0.06)' : 'transparent',
                      marginBottom: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: isActive ? '600' : '400',
                        color: isActive ? 'var(--text-bright)' : 'var(--text-main)',
                        letterSpacing: '-0.01em',
                      }}>
                        {s.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        운동 {count}개
                      </div>
                    </div>
                    {isActive && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('이 세션을 삭제하시겠습니까?')) {
                            deleteSession(s.id);
                            const remaining = sessions.filter(ss => ss.id !== s.id);
                            setSelectedSessionId(remaining[0]?.id || null);
                          }
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '4px',
                          opacity: 0.5,
                          borderRadius: '4px',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#f77a7a'; e.currentTarget.style.opacity = '1'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.opacity = '0.5'; }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 패널 2: 세션별 운동 목록 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--border)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px 10px',
            fontSize: '10px',
            fontWeight: '600',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span>{effectiveSession ? `${effectiveSession.name} — 운동` : '운동'}</span>
          </div>

          {/* 운동 검색 추가 */}
          {effectiveSession && (
            <div style={{ padding: '0 16px 12px', borderBottom: '1px solid var(--border)' }}>
              <ExerciseAutocomplete onSelect={handleAddExerciseToSession} />
            </div>
          )}

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px 16px' }}>
            {!effectiveSession ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', opacity: 0.5 }}>
                세션을 선택하세요
              </div>
            ) : activeSessionExercises.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', opacity: 0.5 }}>
                <ListPlus size={28} style={{ marginBottom: '8px', display: 'block', margin: '0 auto 8px' }} />
                운동을 추가해 보세요
              </div>
            ) : (
              activeSessionExercises.map((se, idx) => {
                const ex = exercises.find(e => e.id === se.exercise_id);
                if (!ex) return null;
                const isSelected = se.id === selectedExerciseId;
                return (
                  <div
                    key={se.id}
                    onClick={() => setSelectedExerciseId(isSelected ? null : se.id)}
                    style={{
                      padding: '12px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(228, 232, 240, 0.06)' : 'transparent',
                      marginBottom: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      width: '18px',
                      textAlign: 'right',
                      flexShrink: 0,
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {idx + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '15px',
                        fontWeight: isSelected ? '600' : '400',
                        color: isSelected ? 'var(--text-bright)' : 'var(--text-main)',
                        letterSpacing: '-0.01em',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {ex.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {se.target_sets}세트 · {se.target_record}회
                        {ex.primary_muscle ? ` · ${ex.primary_muscle}` : ''}
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteExercise(se.id); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                        opacity: 0,
                        borderRadius: '4px',
                        flexShrink: 0,
                      }}
                      className="exercise-delete-btn"
                      onMouseEnter={e => { e.currentTarget.style.color = '#f77a7a'; e.currentTarget.style.opacity = '1'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.opacity = '0'; }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 패널 3: 설정 (선택된 운동 or 세션 설정) */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 16px 10px',
            fontSize: '10px',
            fontWeight: '600',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}>
            설정
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
            {selectedExerciseLink && selectedExercise ? (
              /* 운동 선택 시: 해당 운동 세부 설정 */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: 'var(--text-bright)',
                    letterSpacing: '-0.02em',
                    marginBottom: '4px',
                  }}>
                    {selectedExercise.name}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {selectedExercise.primary_muscle && (
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        background: 'rgba(122,162,247,0.08)',
                        color: 'var(--accent)',
                        border: '1px solid rgba(122,162,247,0.12)',
                      }}>
                        {selectedExercise.primary_muscle}
                      </span>
                    )}
                    {selectedExercise.equipment && (
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        background: 'rgba(255,255,255,0.03)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border)',
                      }}>
                        {selectedExercise.equipment}
                      </span>
                    )}
                  </div>
                </div>

                {/* 목표 세트 */}
                <SettingRow label="목표 세트" icon={<Dumbbell size={13} />}>
                  <NumberStepper
                    value={selectedExerciseLink.target_sets || 3}
                    min={1}
                    max={20}
                    onChange={(v) => handleUpdateTarget(selectedExerciseLink.id, 'target_sets', v)}
                    unit="세트"
                  />
                </SettingRow>

                {/* 목표 횟수 */}
                <SettingRow label="목표 횟수" icon={<RotateCcw size={13} />}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="text"
                      value={selectedExerciseLink.target_record || '10'}
                      onChange={(e) => handleUpdateTarget(selectedExerciseLink.id, 'target_record', e.target.value)}
                      style={{
                        width: '56px',
                        padding: '6px 8px',
                        textAlign: 'center',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        color: 'var(--text-bright)',
                        fontSize: '15px',
                        fontWeight: '600',
                        fontFamily: 'inherit',
                        outline: 'none',
                        transition: 'border-color 0.15s',
                      }}
                      onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>회</span>
                  </div>
                </SettingRow>

                {/* 세트 간 휴식시간 */}
                <SettingRow label="세트 간 휴식" icon={<Timer size={13} />}>
                  <RestTimeStepper
                    value={selectedExerciseLink.rest_between_sets ?? 90}
                    onChange={(v) => handleUpdateTarget(selectedExerciseLink.id, 'rest_between_sets', v)}
                  />
                </SettingRow>

                {/* 운동 후 휴식시간 */}
                <SettingRow label="운동 후 휴식" icon={<Clock size={13} />}>
                  <RestTimeStepper
                    value={selectedExerciseLink.rest_after_exercise ?? 120}
                    onChange={(v) => handleUpdateTarget(selectedExerciseLink.id, 'rest_after_exercise', v)}
                  />
                </SettingRow>

                {/* 삭제 버튼 */}
                <button
                  onClick={() => handleDeleteExercise(selectedExerciseLink.id)}
                  style={{
                    marginTop: '8px',
                    padding: '9px 0',
                    background: 'transparent',
                    border: '1px solid rgba(247,122,122,0.2)',
                    borderRadius: '7px',
                    color: 'rgba(247,122,122,0.7)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(247,122,122,0.08)'; e.currentTarget.style.borderColor = 'rgba(247,122,122,0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(247,122,122,0.2)'; }}
                >
                  <Trash2 size={13} />
                  운동 제거
                </button>
              </div>
            ) : (
              /* 운동 미선택 시: 안내 */
              <div style={{
                paddingTop: '40px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '13px',
                opacity: 0.5,
                lineHeight: 1.6,
              }}>
                운동을 선택하면<br />세부 설정이 표시됩니다
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 공통 설정 행 컴포넌트 ── */
function SettingRow({ label, icon, children }) {
  return (
    <div>
      <div style={{
        fontSize: '11px',
        color: 'var(--text-muted)',
        fontWeight: '500',
        letterSpacing: '0.05em',
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
      }}>
        {icon}
        {label}
      </div>
      {children}
    </div>
  );
}

/* ── 숫자 스테퍼 ── */
function NumberStepper({ value, min, max, onChange, unit }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        style={{
          width: '28px',
          height: '28px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          color: 'var(--text-main)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          fontFamily: 'inherit',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
      >
        −
      </button>
      <span style={{
        fontSize: '17px',
        fontWeight: '700',
        color: 'var(--text-bright)',
        minWidth: '28px',
        textAlign: 'center',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        style={{
          width: '28px',
          height: '28px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          color: 'var(--text-main)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          fontFamily: 'inherit',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
      >
        +
      </button>
      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{unit}</span>
    </div>
  );
}

/* ── 휴식시간 스테퍼 (15초 단위) ── */
function RestTimeStepper({ value, onChange }) {
  const STEP = 15;
  const MIN = 0;
  const MAX = 600;

  const fmt = (s) => {
    if (s < 60) return `${s}초`;
    const m = Math.floor(s / 60);
    const r = s % 60;
    return r === 0 ? `${m}분` : `${m}분 ${r}초`;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <button
        onClick={() => onChange(Math.max(MIN, value - STEP))}
        style={{
          width: '28px',
          height: '28px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          color: 'var(--text-main)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          fontFamily: 'inherit',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
      >
        −
      </button>
      <span style={{
        fontSize: '15px',
        fontWeight: '700',
        color: 'var(--text-bright)',
        minWidth: '52px',
        textAlign: 'center',
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.02em',
      }}>
        {fmt(value)}
      </span>
      <button
        onClick={() => onChange(Math.min(MAX, value + STEP))}
        style={{
          width: '28px',
          height: '28px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          color: 'var(--text-main)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          fontFamily: 'inherit',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
      >
        +
      </button>
    </div>
  );
}
