import React, { useState } from 'react';
import { Plus, Trash2, Dumbbell, Tag, Calendar, ListPlus, ChevronRight } from 'lucide-react';
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

  // 현재 선택된 세션
  const activeSession = sessions.find(s => s.id === selectedSessionId) || sessions[0] || null;
  const activeSessionId = activeSession?.id || null;

  // 현재 세션의 운동들
  const activeSessionExercises = sessionExercises
    .filter(se => se.session_id === activeSessionId)
    .sort((a, b) => a.order - b.order);

  // 새 세션 생성
  const handleCreateSession = (e) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;
    const newSession = addSession(newSessionName.trim());
    setSelectedSessionId(newSession.id);
    setNewSessionName('');
  };

  // 세션에 운동 추가
  const handleAddExerciseToSession = (dictExercise) => {
    if (!activeSessionId) return;

    // 1. 스토어의 전체 운동 리스트에 이미 등록되었는지 확인, 없으면 스토어에 추가
    let storeExercise = exercises.find(ex => ex.name.toLowerCase() === dictExercise.name.toLowerCase());
    if (!storeExercise) {
      storeExercise = addExercise(
        dictExercise.name,
        dictExercise.primaryMuscle,
        dictExercise.equipment,
        dictExercise.category === 'cardio' ? 'reps' : 'kg'
      );
    }

    // 2. 세션 내에 이미 이 운동이 추가되어 있는지 검사
    const alreadyExists = activeSessionExercises.some(se => se.exercise_id === storeExercise.id);
    if (alreadyExists) {
      alert('이미 세션에 추가된 운동입니다.');
      return;
    }

    // 3. 세션 운동으로 추가
    const nextOrder = activeSessionExercises.length + 1;
    addSessionExercise(activeSessionId, storeExercise.id, nextOrder, 3, '10');
  };

  // 세션 운동 삭제
  const handleDeleteExercise = (id) => {
    deleteSessionExercise(id);
  };

  // 목표 세트수나 횟수 변경
  const handleUpdateTarget = (id, field, value) => {
    updateSessionExercise(id, { [field]: value });
  };

  return (
    <div className="main-grid" style={{ height: 'calc(100vh - 180px)', overflow: 'hidden' }}>
      
      {/* 1. Left Sidebar: 세션 목록 */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="section-header">
          <h2>내 세션 목록</h2>
          <span className="subtitle">My Workout Sessions</span>
        </div>

        {/* 세션 생성 폼 */}
        <form onSubmit={handleCreateSession} style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="새 세션 명칭 (예: 하체 폭발)"
            value={newSessionName}
            onChange={(e) => setNewSessionName(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 14px',
              background: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-bright)',
              fontSize: '13px',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '10px',
              background: 'rgba(122, 162, 247, 0.15)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--accent)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Plus size={16} />
          </button>
        </form>

        {/* 세션 리스트 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {sessions.length === 0 ? (
            <div style={{ padding: '30px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              생성된 세션이 없습니다.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {sessions.map(s => {
                const isActive = s.id === selectedSessionId;
                const sExs = sessionExercises.filter(se => se.session_id === s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSessionId(s.id)}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      background: isActive ? 'rgba(122, 162, 247, 0.08)' : 'transparent',
                      border: isActive ? '1px solid var(--border-focus)' : '1px solid var(--border)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', color: isActive ? 'var(--text-bright)' : 'var(--text-main)', fontSize: '14px' }}>
                        {s.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        운동 {sExs.length}개 설정됨
                      </div>
                    </div>
                    <ChevronRight size={14} color={isActive ? 'var(--accent)' : 'var(--text-muted)'} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 2. Middle Panel: 선택한 세션의 상세 운동 설정 */}
      <div className="glass-panel--strong" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {activeSession ? (
          <>
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2>{activeSession.name} - 운동 상세 설정</h2>
                <span className="subtitle">세션의 운동 구성 및 목표 세트를 관리합니다.</span>
              </div>
              <button
                onClick={() => {
                  if (confirm('이 세션을 삭제하시겠습니까?')) {
                    deleteSession(activeSession.id);
                    setSelectedSessionId(sessions[0]?.id || null);
                  }
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(247, 122, 122, 0.7)',
                  cursor: 'pointer',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  borderRadius: 'var(--radius-md)',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(247, 122, 122, 0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Trash2 size={14} /> 세션 삭제
              </button>
            </div>

            {/* 운동 추가 검색창 영역 */}
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '500' }}>
                세션에 추가할 운동 검색 (자동완성)
              </div>
              <ExerciseAutocomplete onSelect={handleAddExerciseToSession} />
            </div>

            {/* 세션 내 운동 목록 */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {activeSessionExercises.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <ListPlus size={36} style={{ marginBottom: '12px', opacity: 0.5 }} />
                  <div>세션에 설정된 운동이 없습니다.</div>
                  <div style={{ fontSize: '12px', marginTop: '6px' }}>위의 검색창에서 운동을 검색해 추가해 보세요!</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {activeSessionExercises.map((se, index) => {
                    const ex = exercises.find(e => e.id === se.exercise_id);
                    if (!ex) return null;
                    return (
                      <div
                        key={se.id}
                        style={{
                          padding: '16px',
                          borderRadius: 'var(--radius-md)',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid var(--border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '16px',
                        }}
                      >
                        {/* 운동 기본 정보 */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: 'var(--border-strong)',
                              color: 'var(--text-muted)',
                              fontSize: '11px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold'
                            }}>
                              {index + 1}
                            </span>
                            <span style={{ fontWeight: '600', color: 'var(--text-bright)', fontSize: '15px' }}>{ex.name}</span>
                          </div>

                          <div style={{ display: 'flex', gap: '6px', marginTop: '6px', paddingLeft: '28px' }}>
                            <span style={{
                              fontSize: '10px',
                              padding: '1px 5px',
                              borderRadius: '3px',
                              background: 'rgba(122, 162, 247, 0.08)',
                              color: 'var(--accent)',
                              border: '1px solid rgba(122, 162, 247, 0.12)'
                            }}>
                              {ex.primary_muscle || '기타'}
                            </span>
                            <span style={{
                              fontSize: '10px',
                              padding: '1px 5px',
                              borderRadius: '3px',
                              background: 'rgba(255,255,255,0.03)',
                              color: 'var(--text-muted)',
                              border: '1px solid var(--border)'
                            }}>
                              {ex.equipment || '기타'}
                            </span>
                          </div>
                        </div>

                        {/* 세트 목표 설정 영역 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                              type="number"
                              min="1"
                              max="20"
                              value={se.target_sets || 3}
                              onChange={(e) => handleUpdateTarget(se.id, 'target_sets', parseInt(e.target.value) || 1)}
                              style={{
                                width: '45px',
                                padding: '6px',
                                textAlign: 'center',
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid var(--border)',
                                borderRadius: '4px',
                                color: 'var(--text-bright)',
                                outline: 'none',
                                fontSize: '13px'
                              }}
                            />
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>세트</span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                              type="text"
                              value={se.target_record || '10'}
                              onChange={(e) => handleUpdateTarget(se.id, 'target_record', e.target.value)}
                              style={{
                                width: '55px',
                                padding: '6px',
                                textAlign: 'center',
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid var(--border)',
                                borderRadius: '4px',
                                color: 'var(--text-bright)',
                                outline: 'none',
                                fontSize: '13px'
                              }}
                            />
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>회</span>
                          </div>

                          <button
                            onClick={() => handleDeleteExercise(se.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '6px',
                              borderRadius: '4px',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = '#f77a7a'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', flexDirection: 'column', gap: '10px' }}>
            <Calendar size={40} style={{ opacity: 0.4 }} />
            <div>선택된 세션이 없습니다. 왼편에서 세션을 생성해 주세요!</div>
          </div>
        )}
      </div>

      {/* 3. Right Panel: 전체 가용 운동 가이드 리스트 (참고용) */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="section-header">
          <h2>가이드 사전 정보</h2>
          <span className="subtitle">로컬 사전에 제공되는 주동근 및 장비 종류</span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-bright)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Dumbbell size={14} color="var(--accent)" /> 주동근 카테고리 (15개 이상)
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['가슴', '등 (광배근)', '등 (중부)', '등 (하부/허리)', '어깨', '이두', '삼두', '복근', '전완근', '승모근', '허벅지 앞 (대퇴사두)', '허벅지 뒤 (햄스트링)', '엉덩이 (둔근)', '종아리', '전신 (유산소)'].map(m => (
                <span key={m} style={{ fontSize: '11px', padding: '3px 7px', background: 'rgba(122,162,247,0.06)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-main)' }}>
                  {m}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-bright)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Tag size={14} color="var(--accent)" /> 운동 장비 카테고리
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['바벨', '덤벨', '케이블', '머신', '맨몸', '케틀벨', '메디신볼', '짐볼', '밴드', 'EZ바'].map(e => (
                <span key={e} style={{ fontSize: '11px', padding: '3px 7px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-muted)' }}>
                  {e}
                </span>
              ))}
            </div>
          </div>

          <div style={{
            padding: '14px',
            background: 'rgba(122, 162, 247, 0.04)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            fontSize: '12px',
            color: 'var(--text-muted)',
            lineHeight: '1.6'
          }}>
            <strong>💡 자동 매칭 팁:</strong><br />
            사전에 내장된 '풀업', '벤치', '오헤프', '사레레', '라트익', '행레레' 등의 한글 줄임말이나 단어 조각을 입력하면 정확한 주동근과 장비 정보가 연동되어 자동으로 세팅됩니다.
          </div>
        </div>
      </div>

    </div>
  );
}
