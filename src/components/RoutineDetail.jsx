import { useState, useRef } from 'react';
import { Plus, Trash2, Dumbbell, ListPlus, Timer, Clock, RotateCcw, Pencil, Check, X } from 'lucide-react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import ExerciseAutocomplete from './ExerciseAutocomplete';
import { getSessionDayLetter, getFormattedSessionName } from '../utils/sessionHelper';

export default function RoutineDetail() {
  const routines = useWorkoutStore(state => state.routines);
  const sessions = useWorkoutStore(state => state.sessions);
  const sessionExercises = useWorkoutStore(state => state.sessionExercises);
  const exercises = useWorkoutStore(state => state.exercises);

  const addRoutine = useWorkoutStore(state => state.addRoutine);
  const deleteRoutine = useWorkoutStore(state => state.deleteRoutine);
  const duplicateRoutine = useWorkoutStore(state => state.duplicateRoutine);
  const updateRoutine = useWorkoutStore(state => state.updateRoutine);
  const addSession = useWorkoutStore(state => state.addSession);
  const deleteSession = useWorkoutStore(state => state.deleteSession);
  const updateSession = useWorkoutStore(state => state.updateSession);
  const addSessionExercise = useWorkoutStore(state => state.addSessionExercise);
  const deleteSessionExercise = useWorkoutStore(state => state.deleteSessionExercise);
  const updateSessionExercise = useWorkoutStore(state => state.updateSessionExercise);
  const addExercise = useWorkoutStore(state => state.addExercise);
  const reorderSessions = useWorkoutStore(state => state.reorderSessions);
  const reorderSessionExercises = useWorkoutStore(state => state.reorderSessionExercises);

  const [selectedRoutineId, setSelectedRoutineId] = useState(routines[0]?.id || null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownCoords, setDropdownCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);

  // 루틴 이름 편집 상태
  const [isEditingRoutineName, setIsEditingRoutineName] = useState(false);
  const [editingRoutineNameVal, setEditingRoutineNameVal] = useState('');

  // 세션 이름 편집 상태
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingSessionNameVal, setEditingSessionNameVal] = useState('');

  const handleToggleDropdown = () => {
    if (!isDropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownCoords({
        top: rect.bottom + 8,
        left: rect.left
      });
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [newSessionName, setNewSessionName] = useState('');
  const [isAddingSession, setIsAddingSession] = useState(false);

  const [selectedExerciseId, setSelectedExerciseId] = useState(null);
  const [isAddingExerciseRow, setIsAddingExerciseRow] = useState(false);

  // Keyboard navigation refs
  const sessionRefs = useRef([]);
  const exerciseRefs = useRef([]);
  const targetRecordInputRef = useRef(null);
  const addExerciseBtnRef = useRef(null);

  // Keyboard navigation session handler
  const handleSessionKeyDown = (e, index) => {
    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const isReordering = e.metaKey || e.ctrlKey;
        const nextIndex = index + 1;
        if (nextIndex < effectiveRoutineSessions.length) {
          if (isReordering) {
            const newSessions = [...effectiveRoutineSessions];
            const temp = newSessions[index];
            newSessions[index] = newSessions[nextIndex];
            newSessions[nextIndex] = temp;
            
            reorderSessions(effectiveRoutineId, newSessions.map(s => s.id));
            setTimeout(() => {
              sessionRefs.current[nextIndex]?.focus();
              sessionRefs.current[nextIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }, 0);
          } else {
            const nextSession = effectiveRoutineSessions[nextIndex];
            handleSelectSession(nextSession.id);
            setTimeout(() => {
              sessionRefs.current[nextIndex]?.focus();
              sessionRefs.current[nextIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }, 0);
          }
        }
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const isReordering = e.metaKey || e.ctrlKey;
        const prevIndex = index - 1;
        if (prevIndex >= 0) {
          if (isReordering) {
            const newSessions = [...effectiveRoutineSessions];
            const temp = newSessions[index];
            newSessions[index] = newSessions[prevIndex];
            newSessions[prevIndex] = temp;
            
            reorderSessions(effectiveRoutineId, newSessions.map(s => s.id));
            setTimeout(() => {
              sessionRefs.current[prevIndex]?.focus();
              sessionRefs.current[prevIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }, 0);
          } else {
            const prevSession = effectiveRoutineSessions[prevIndex];
            handleSelectSession(prevSession.id);
            setTimeout(() => {
              sessionRefs.current[prevIndex]?.focus();
              sessionRefs.current[prevIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }, 0);
          }
        }
        break;
      }
      case 'ArrowRight': {
        e.preventDefault();
        if (activeSessionExercises.length > 0) {
          const firstEx = activeSessionExercises[0];
          setSelectedExerciseId(firstEx.id);
          setTimeout(() => {
            exerciseRefs.current[0]?.focus();
            exerciseRefs.current[0]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }, 0);
        }
        break;
      }
      case 'Enter':
      case ' ': {
        e.preventDefault();
        handleSelectSession(effectiveRoutineSessions[index].id);
        break;
      }
      default:
        break;
    }
  };

  // Keyboard navigation exercise handler
  const handleExerciseKeyDown = (e, idx) => {
    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const isReordering = e.metaKey || e.ctrlKey;
        const nextIdx = idx + 1;
        if (nextIdx < activeSessionExercises.length) {
          if (isReordering) {
            const newExercises = [...activeSessionExercises];
            const temp = newExercises[idx];
            newExercises[idx] = newExercises[nextIdx];
            newExercises[nextIdx] = temp;
            
            reorderSessionExercises(effectiveSessionId, newExercises.map(se => se.id));
            setTimeout(() => {
              exerciseRefs.current[nextIdx]?.focus();
              exerciseRefs.current[nextIdx]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }, 0);
          } else {
            const nextEx = activeSessionExercises[nextIdx];
            setSelectedExerciseId(nextEx.id);
            setTimeout(() => {
              exerciseRefs.current[nextIdx]?.focus();
              exerciseRefs.current[nextIdx]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }, 0);
          }
        } else if (nextIdx === activeSessionExercises.length && !isAddingExerciseRow) {
          setTimeout(() => {
            addExerciseBtnRef.current?.focus();
            addExerciseBtnRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }, 0);
        }
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const isReordering = e.metaKey || e.ctrlKey;
        const prevIdx = idx - 1;
        if (prevIdx >= 0) {
          if (isReordering) {
            const newExercises = [...activeSessionExercises];
            const temp = newExercises[idx];
            newExercises[idx] = newExercises[prevIdx];
            newExercises[prevIdx] = temp;
            
            reorderSessionExercises(effectiveSessionId, newExercises.map(se => se.id));
            setTimeout(() => {
              exerciseRefs.current[prevIdx]?.focus();
              exerciseRefs.current[prevIdx]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }, 0);
          } else {
            const prevEx = activeSessionExercises[prevIdx];
            setSelectedExerciseId(prevEx.id);
            setTimeout(() => {
              exerciseRefs.current[prevIdx]?.focus();
              exerciseRefs.current[prevIdx]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }, 0);
          }
        }
        break;
      }
      case 'ArrowLeft': {
        e.preventDefault();
        const activeSessionIndex = effectiveRoutineSessions.findIndex(s => s.id === effectiveSessionId);
        if (activeSessionIndex !== -1) {
          setTimeout(() => {
            sessionRefs.current[activeSessionIndex]?.focus();
            sessionRefs.current[activeSessionIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }, 0);
        }
        break;
      }
      case 'ArrowRight': {
        e.preventDefault();
        if (targetRecordInputRef.current) {
          targetRecordInputRef.current.focus();
          targetRecordInputRef.current.select();
        }
        break;
      }
      case 'Enter':
      case ' ': {
        e.preventDefault();
        setSelectedExerciseId(selectedExerciseId === activeSessionExercises[idx].id ? null : activeSessionExercises[idx].id);
        break;
      }
      default:
        break;
    }
  };

  // 현재 선택된 루틴 복구/조회
  const effectiveRoutineId = selectedRoutineId || routines[0]?.id || null;
  const effectiveRoutine = routines.find(r => r.id === effectiveRoutineId) || null;

  // 현재 루틴 소속 세션들
  const effectiveRoutineSessions = sessions
    .filter(s => s.routine_id === effectiveRoutineId)
    .sort((a, b) => (a.session_order || 0) - (b.session_order || 0));

  // 현재 선택된 세션 복구/조회
  const effectiveSessionId = selectedSessionId || effectiveRoutineSessions[0]?.id || null;
  const effectiveSession = effectiveRoutineSessions.find(s => s.id === effectiveSessionId) || null;

  // 현재 세션의 운동들
  const activeSessionExercises = sessionExercises
    .filter(se => se.session_id === (effectiveSession?.id || null))
    .sort((a, b) => a.order - b.order);

  // 현재 세션의 인덱스 및 Day 문자 (Day A, B, C...)
  const dayLetter = getSessionDayLetter(effectiveSession, sessions);

  // 선택된 운동 상세
  const selectedExerciseLink = activeSessionExercises.find(se => se.id === selectedExerciseId);
  const selectedExercise = selectedExerciseLink
    ? exercises.find(e => e.id === selectedExerciseLink.exercise_id)
    : null;



  // 새 세션 생성
  const handleCreateSession = (e) => {
    e.preventDefault();
    if (!effectiveRoutineId || !newSessionName.trim()) return;
    const newSn = addSession(effectiveRoutineId, newSessionName.trim());
    setSelectedSessionId(newSn.id);
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

  const handleSelectRoutine = (id) => {
    setSelectedRoutineId(id);
    const routineSessions = sessions.filter(s => s.routine_id === id);
    setSelectedSessionId(routineSessions[0]?.id || null);
    setSelectedExerciseId(null);
    setIsAddingExerciseRow(false);
  };

  const handleSelectSession = (id) => {
    setSelectedSessionId(id);
    setSelectedExerciseId(null);
    setIsAddingExerciseRow(false);
  };

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', flex: 1, minHeight: 0, gap: 0 }}>

      {/* ── 상단: 루틴 가로 리스트 (floating pill 스타일) ── */}
      <div style={{
        position: 'absolute',
        top: '-64px',
        left: '2px',
        right: '2px',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '0 2px 28px 2px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>

        {/* 맨 왼쪽: 추가 버튼 및 드롭다운 */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            ref={buttonRef}
            onClick={handleToggleDropdown}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              background: 'transparent',
              border: 'none',
              color: isDropdownOpen ? 'var(--accent)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
            }}
            onMouseEnter={e => {
              if (!isDropdownOpen) {
                e.currentTarget.style.color = 'var(--accent)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }
            }}
            onMouseLeave={e => {
              if (!isDropdownOpen) {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            <Plus size={18} style={{ transform: isDropdownOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {isDropdownOpen && (
            <>
              {/* Click-away backdrop */}
              <div 
                onClick={() => setIsDropdownOpen(false)}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 998,
                }}
              />
              {/* Dropdown Menu */}
              <div style={{
                position: 'fixed',
                top: `${dropdownCoords.top}px`,
                left: `${dropdownCoords.left}px`,
                background: 'rgba(20, 24, 38, 0.95)',
                backdropFilter: 'blur(12px)',
                border: '1px solid var(--border-strong)',
                borderRadius: '10px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                padding: '6px',
                zIndex: 999,
                minWidth: '220px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}>
                {/* 새 루틴 만들기 */}
                <button
                  onClick={() => {
                    const num = routines.length + 1;
                    const newRt = addRoutine(`새 루틴 ${num}`);
                    handleSelectRoutine(newRt.id);
                    setIsDropdownOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '10px 12px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'var(--accent)',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(122, 162, 247, 0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Plus size={14} />
                  새 루틴 만들기
                </button>

                {routines.length > 0 && (
                  <>
                    <div style={{
                      height: '1px',
                      background: 'var(--border)',
                      margin: '4px 6px',
                    }} />
                    <div style={{
                      padding: '4px 12px 6px',
                      fontSize: '10px',
                      fontWeight: '600',
                      color: 'var(--text-muted)',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                    }}>
                      기존 루틴 복사
                    </div>
                    <div style={{
                      maxHeight: '240px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                    }}>
                      {[...routines].reverse().map(r => (
                        <button
                          key={r.id}
                          onClick={() => {
                            const newRt = duplicateRoutine(r.id);
                            if (newRt) {
                              handleSelectRoutine(newRt.id);
                            }
                            setIsDropdownOpen(false);
                          }}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '8px 12px',
                            background: 'transparent',
                            border: 'none',
                            borderRadius: '6px',
                            color: 'var(--text-main)',
                            fontSize: '13px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                            e.currentTarget.style.color = 'var(--text-bright)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--text-main)';
                          }}
                        >
                          {r.name} 복사
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* 루틴 목록 — 최신(마지막 추가)이 왼쪽 */}
        {[...routines].reverse().map(r => {
          const isActive = r.id === effectiveRoutineId;
          return (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <button
                onClick={() => handleSelectRoutine(r.id)}
                style={{
                  padding: '8px 12px',
                  background: 'transparent',
                  border: 'none',
                  color: isActive ? 'var(--text-bright)' : 'var(--text-muted)',
                  fontWeight: isActive ? '600' : '500',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  letterSpacing: '0.02em',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.3,
                  position: 'relative',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--text-main)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }
                }}
              >
                {r.name}
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    bottom: '-6px',
                    left: '12px',
                    right: '12px',
                    height: '2px',
                    background: 'var(--accent)',
                    borderRadius: '1px',
                    boxShadow: '0 0 10px var(--accent-glow), 0 0 4px var(--accent)',
                  }} />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* ── 하단: 3패널 ── */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 1.8fr 1fr',
        gap: '24px',
        overflow: 'hidden',
      }}>

        {/* 패널 1: 세션 목록 */}
        <div
          className="glass-panel"
          style={{
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {effectiveRoutine && (
            <div style={{
              padding: '20px 20px 16px',
              borderBottom: '1px solid var(--border)',
            }}>
              <div style={{
                fontSize: '11px',
                fontWeight: '600',
                color: 'var(--accent)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '4px',
              }}>
                현재 루틴
              </div>
              {isEditingRoutineName ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }} onClick={e => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editingRoutineNameVal}
                    onChange={(e) => setEditingRoutineNameVal(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (editingRoutineNameVal.trim()) {
                          updateRoutine(effectiveRoutine.id, editingRoutineNameVal.trim());
                        }
                        setIsEditingRoutineName(false);
                      } else if (e.key === 'Escape') {
                        setIsEditingRoutineName(false);
                      }
                    }}
                    style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-focus)',
                      borderRadius: '6px',
                      color: 'var(--text-bright)',
                      fontSize: '14px',
                      outline: 'none',
                      padding: '6px 10px',
                      minWidth: 0,
                    }}
                  />
                  <button
                    onClick={() => {
                      if (editingRoutineNameVal.trim()) {
                        updateRoutine(effectiveRoutine.id, editingRoutineNameVal.trim());
                      }
                      setIsEditingRoutineName(false);
                    }}
                    style={{
                      background: 'rgba(122,162,247,0.15)',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'var(--accent)',
                      cursor: 'pointer',
                      padding: '6px 8px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => setIsEditingRoutineName(false)}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '6px 8px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: 'var(--text-bright)',
                    letterSpacing: '-0.02em',
                    wordBreak: 'break-all',
                    flex: 1,
                  }}>
                    {effectiveRoutine.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditingRoutineName(true);
                        setEditingRoutineNameVal(effectiveRoutine.name);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: '4px',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.color = 'var(--accent)';
                        e.currentTarget.style.background = 'rgba(122,162,247,0.08)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.color = 'var(--text-muted)';
                        e.currentTarget.style.background = 'none';
                      }}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('이 루틴을 완전히 삭제하시겠습니까? 모든 세션과 설정이 함께 제거됩니다.')) {
                          deleteRoutine(effectiveRoutine.id);
                          const remaining = routines.filter(r => r.id !== effectiveRoutine.id);
                          const nextRoutine = remaining[remaining.length - 1] || null;
                          handleSelectRoutine(nextRoutine ? nextRoutine.id : null);
                        }
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: '4px',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.color = '#f77a7a';
                        e.currentTarget.style.background = 'rgba(247,122,122,0.08)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.color = 'var(--text-muted)';
                        e.currentTarget.style.background = 'none';
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
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
            <span>세션 목록</span>
            {effectiveRoutine && (
              isAddingSession ? (
                <form onSubmit={handleCreateSession} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="text"
                    autoFocus
                    placeholder="새 세션..."
                    value={newSessionName}
                    onChange={(e) => setNewSessionName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Escape') { setIsAddingSession(false); setNewSessionName(''); }}}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-focus)',
                      borderRadius: '5px',
                      color: 'var(--text-bright)',
                      fontSize: '11px',
                      outline: 'none',
                      padding: '4px 8px',
                      width: '90px',
                    }}
                  />
                  <button type="submit" style={{ background: 'rgba(122,162,247,0.15)', border: 'none', borderRadius: '5px', color: 'var(--accent)', cursor: 'pointer', padding: '4px 6px' }}>
                    <Plus size={10} />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setIsAddingSession(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    fontSize: '10px',
                    fontWeight: '600',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <Plus size={12} /> 추가
                </button>
              )
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 16px' }}>
            {!effectiveRoutine ? (
              <div style={{ padding: '20px 8px', color: 'var(--text-muted)', fontSize: '13px', opacity: 0.6 }}>
                루틴을 선택하거나 추가해주세요
              </div>
            ) : effectiveRoutineSessions.length === 0 ? (
              <div style={{ padding: '20px 8px', color: 'var(--text-muted)', fontSize: '13px', opacity: 0.6 }}>
                세션이 없습니다
              </div>
            ) : (
              effectiveRoutineSessions.map((s, index) => {
                const isActive = s.id === effectiveSessionId;
                const count = sessionExercises.filter(se => se.session_id === s.id).length;
                const isEditing = editingSessionId === s.id;

                if (isEditing) {
                  return (
                    <div
                      key={s.id}
                      onClick={e => e.stopPropagation()}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '7px',
                        background: 'rgba(228, 232, 240, 0.06)',
                        marginBottom: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <input
                        type="text"
                        value={editingSessionNameVal}
                        onChange={(e) => setEditingSessionNameVal(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (editingSessionNameVal.trim()) {
                              updateSession(s.id, editingSessionNameVal.trim());
                            }
                            setEditingSessionId(null);
                          } else if (e.key === 'Escape') {
                            setEditingSessionId(null);
                          }
                        }}
                        style={{
                          flex: 1,
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid var(--border-focus)',
                          borderRadius: '5px',
                          color: 'var(--text-bright)',
                          fontSize: '13px',
                          outline: 'none',
                          padding: '4px 8px',
                          minWidth: 0,
                        }}
                      />
                      <button
                        onClick={() => {
                          if (editingSessionNameVal.trim()) {
                            updateSession(s.id, editingSessionNameVal.trim());
                          }
                          setEditingSessionId(null);
                        }}
                        style={{
                          background: 'rgba(122,162,247,0.15)',
                          border: 'none',
                          borderRadius: '5px',
                          color: 'var(--accent)',
                          cursor: 'pointer',
                          padding: '4px 6px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <Check size={12} />
                      </button>
                      <button
                        onClick={() => setEditingSessionId(null)}
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: 'none',
                          borderRadius: '5px',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '4px 6px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={s.id}
                    ref={el => sessionRefs.current[index] = el}
                    tabIndex={0}
                    onKeyDown={(e) => handleSessionKeyDown(e, index)}
                    onClick={() => handleSelectSession(s.id)}
                    className="routine-session-row"
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
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: isActive ? '600' : '400',
                        color: isActive ? 'var(--text-bright)' : 'var(--text-main)',
                        letterSpacing: '-0.01em',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {getFormattedSessionName(s, sessions)}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        운동 {count}개
                      </div>
                    </div>
                    {isActive && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setEditingSessionId(s.id);
                            setEditingSessionNameVal(s.name);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '4px',
                            opacity: 0.5,
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.opacity = '1'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.opacity = '0.5'; }}
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('이 세션을 삭제하시겠습니까?')) {
                              deleteSession(s.id);
                              const remaining = effectiveRoutineSessions.filter(ss => ss.id !== s.id);
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
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#f77a7a'; e.currentTarget.style.opacity = '1'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.opacity = '0.5'; }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 패널 2: 세션별 운동 목록 */}
        <div
          className="glass-panel"
          style={{
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div style={{
            padding: '16px 20px 10px',
            fontSize: '11px',
            fontWeight: '600',
            letterSpacing: '0.05em',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border)',
          }}>
            <span>
              {effectiveSession ? (
                <>
                  <span style={{ color: 'var(--accent)', fontWeight: '700' }}>Day {dayLetter}</span>
                  <span style={{ margin: '0 6px', opacity: 0.5 }}>:</span>
                  <span>{effectiveSession.name}</span>
                </>
              ) : '운동'}
            </span>
          </div>

          <div 
            className="exercise-scroll-container" 
            style={{ flex: 1, overflowY: 'auto', padding: '8px 8px 16px' }}
          >
            {!effectiveSession ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', opacity: 0.5 }}>
                세션을 선택하세요
              </div>
            ) : (
              <>
                {/* 1. 운동 행 리스트 */}
                {activeSessionExercises.map((se, idx) => {
                  const ex = exercises.find(e => e.id === se.exercise_id);
                  if (!ex) return null;
                  const isSelected = se.id === selectedExerciseId;
                  return (
                    <div
                      key={se.id}
                      ref={el => exerciseRefs.current[idx] = el}
                      tabIndex={0}
                      onKeyDown={(e) => handleExerciseKeyDown(e, idx)}
                      onClick={() => setSelectedExerciseId(isSelected ? null : se.id)}
                      className="routine-exercise-row"
                      style={{
                        padding: '12px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(228, 232, 240, 0.06)' : 'transparent',
                        marginBottom: '2px',
                        display: 'grid',
                        gridTemplateColumns: '24px 1fr 60px 60px 24px',
                        alignItems: 'center',
                        gap: '12px',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                    >
                      {/* 1열: 번호 */}
                      <span style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        textAlign: 'right',
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {idx + 1}
                      </span>

                      {/* 2열: 운동 이름 및 부위 */}
                      <div style={{ minWidth: 0 }}>
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
                        {ex.primary_muscle && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {ex.primary_muscle}
                          </div>
                        )}
                      </div>
                      
                      {/* 3열: 목표 세트 */}
                      <span style={{
                        fontSize: '15px',
                        color: isSelected ? 'var(--text-bright)' : 'var(--text-muted)',
                        fontWeight: isSelected ? '500' : '400',
                        fontVariantNumeric: 'tabular-nums',
                        whiteSpace: 'nowrap',
                      }}>
                        {se.target_sets}세트
                      </span>

                      {/* 4열: 목표 기록 */}
                      <span style={{
                        fontSize: '15px',
                        color: isSelected ? 'var(--text-bright)' : 'var(--text-muted)',
                        fontWeight: isSelected ? '500' : '400',
                        fontVariantNumeric: 'tabular-nums',
                        whiteSpace: 'nowrap',
                        justifySelf: 'end',
                        marginRight: '8px',
                      }}>
                        {se.target_record}회
                      </span>

                      {/* 5열: 삭제 버튼 */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
                            transition: 'opacity 0.15s, color 0.15s',
                          }}
                          className="exercise-delete-btn"
                          onMouseEnter={e => { e.currentTarget.style.color = '#f77a7a'; e.currentTarget.style.opacity = '1'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.opacity = '0'; }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* 등록된 운동이 없는 경우 안내 */}
                {activeSessionExercises.length === 0 && !isAddingExerciseRow && (
                  <div style={{ padding: '30px 20px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', opacity: 0.5 }}>
                    <ListPlus size={24} style={{ marginBottom: '6px', display: 'block', margin: '0 auto 6px' }} />
                    등록된 운동이 없습니다
                  </div>
                )}

                {/* 2. 새 운동 추가 입력 행 (활성화 시) */}
                {isAddingExerciseRow && (
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(228, 232, 240, 0.03)',
                      marginBottom: '8px',
                      display: 'grid',
                      gridTemplateColumns: '24px 1fr 60px 60px 24px',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <span style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {activeSessionExercises.length + 1}
                    </span>

                    <div style={{ gridColumn: '2 / span 3', minWidth: 0 }}>
                      <ExerciseAutocomplete 
                        onSelect={(exercise) => {
                          handleAddExerciseToSession(exercise);
                          setIsAddingExerciseRow(false);
                        }}
                        onCancel={() => {
                          setIsAddingExerciseRow(false);
                          setTimeout(() => addExerciseBtnRef.current?.focus(), 50);
                        }}
                        autoFocus={true}
                        placeholder="추가할 운동 검색..."
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gridColumn: '5' }}>
                      <button
                        onClick={() => {
                          setIsAddingExerciseRow(false);
                          setTimeout(() => addExerciseBtnRef.current?.focus(), 50);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'color 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = '#f77a7a'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. 플러스 추가 버튼 */}
                {!isAddingExerciseRow && (
                  <button
                    ref={addExerciseBtnRef}
                    className="routine-add-exercise-btn"
                    onClick={() => {
                      setIsAddingExerciseRow(true);
                      setTimeout(() => {
                        const scrollContainer = document.querySelector('.exercise-scroll-container');
                        if (scrollContainer) {
                          scrollContainer.scrollTop = scrollContainer.scrollHeight;
                        }
                      }, 50);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        if (activeSessionExercises.length > 0) {
                          const lastIdx = activeSessionExercises.length - 1;
                          const lastEx = activeSessionExercises[lastIdx];
                          setSelectedExerciseId(lastEx.id);
                          setTimeout(() => {
                            exerciseRefs.current[lastIdx]?.focus();
                            exerciseRefs.current[lastIdx]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                          }, 0);
                        }
                      } else if (e.key === 'ArrowLeft') {
                        e.preventDefault();
                        const activeSessionIndex = effectiveRoutineSessions.findIndex(s => s.id === effectiveSessionId);
                        if (activeSessionIndex !== -1) {
                          setTimeout(() => {
                            sessionRefs.current[activeSessionIndex]?.focus();
                            sessionRefs.current[activeSessionIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                          }, 0);
                        }
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 0',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px dashed var(--border)',
                      borderRadius: '8px',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      marginTop: '8px',
                    }}
                  >
                    <Plus size={14} />
                    운동 추가
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* 패널 3: 설정 (선택된 운동 or 세션 설정) */}
        <div
          className="glass-panel"
          style={{
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
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
                      ref={targetRecordInputRef}
                      type="text"
                      value={selectedExerciseLink.target_record || '10'}
                      onChange={(e) => handleUpdateTarget(selectedExerciseLink.id, 'target_record', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowLeft' || e.key === 'Escape' || e.key === 'Enter') {
                          e.preventDefault();
                          if (e.key === 'Enter') {
                            e.target.blur();
                          }
                          const idx = activeSessionExercises.findIndex(se => se.id === selectedExerciseId);
                          if (idx !== -1) {
                            setTimeout(() => {
                              exerciseRefs.current[idx]?.focus();
                              exerciseRefs.current[idx]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                            }, 0);
                          }
                        }
                      }}
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
