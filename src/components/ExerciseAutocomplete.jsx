import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Dumbbell, Tag, Sparkles, Plus } from 'lucide-react';
import { MUSCLE_GROUPS } from '../data/muscleGroups.js';
import { useWorkoutStore } from '../store/useWorkoutStore.js';
import { getExerciseSuggestions } from '../utils/exerciseSearch.js';

const EQUIPMENTS = ['바벨', '덤벨', '머신', '맨몸', '케이블', '기타'];

export default function ExerciseAutocomplete({ onSelect, placeholder = '운동 검색 (예: 풀업, 벤치, ㅍㅇ, OHP)', autoFocus = false, onCancel }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  // 커스텀 운동 추가용 주동근 및 장비 선택 상태
  const [selectedMuscle, setSelectedMuscle] = useState('기타');
  const [selectedEquipment, setSelectedEquipment] = useState('기타');
  const [isUnilateral, setIsUnilateral] = useState(false);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const exercises = useWorkoutStore(state => state.exercises);
  const suggestions = useMemo(() => getExerciseSuggestions(query, exercises), [query, exercises]);

  const handleCustomSelect = () => {
    if (!query.trim()) return;
    const customExercise = {
      name: query.trim(),
      primaryMuscle: selectedMuscle,
      equipment: selectedEquipment,
      category: 'strength',
      unit: 'kg',
      is_unilateral: isUnilateral
    };
    onSelect(customExercise);
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
    setSelectedMuscle('기타');
    setSelectedEquipment('기타');
    setIsUnilateral(false);
  };

  // 바깥 영역 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 키보드 네비게이션 제어
  const handleKeyDown = (e) => {
    // IME 입력 중인 경우 Enter 등의 키 이벤트를 무시하여 중복 등록 방지
    if (e.nativeEvent?.isComposing || e.isComposing) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      inputRef.current?.blur();
      if (onCancel) {
        onCancel();
      }
      return;
    }

    if (!isOpen) return;

    if (suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleCustomSelect();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      default:
        break;
    }
  };

  const handleSelect = (exercise) => {
    onSelect(exercise);
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  return (
    <div ref={containerRef} className="exercise-search-wrap">
      {/* Input Box */}
      <div className="exercise-search-input-group">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            const nextQuery = e.target.value;
            setQuery(nextQuery);
            setIsOpen(true);
            setSelectedIndex(nextQuery.trim() ? 0 : -1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`exercise-search-input ${isOpen ? 'is-open' : ''}`}
        />
        <Search
          size={16}
          color={isOpen ? 'var(--accent)' : 'var(--text-muted)'}
          className="exercise-search-icon"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setSelectedIndex(-1);
              inputRef.current?.focus();
            }}
            className="exercise-search-clear-btn"
          >
            Clear
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul className="exercise-suggestions-dropdown">
          {suggestions.map((exercise, index) => {
            const isSelected = index === selectedIndex;
            return (
              <li
                key={exercise.id}
                onClick={() => handleSelect(exercise)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`exercise-suggestion-item ${isSelected ? 'is-selected' : ''}`}
              >
                {/* Exercise Name */}
                <div className="exercise-suggestion-header">
                  <span className="exercise-suggestion-name">
                    {exercise.name}
                  </span>
                  {exercise.englishName && (
                    <span className="exercise-suggestion-english">
                      {exercise.englishName}
                    </span>
                  )}
                </div>

                {/* Badges / Meta tags */}
                <div className="exercise-suggestion-meta">
                  {/* 주동근 태그 */}
                  <span className="exercise-badge-muscle">
                    <Dumbbell size={10} />
                    {exercise.primaryMuscle || exercise.primary_muscle}
                  </span>
                  
                  {/* 장비 태그 */}
                  <span className="exercise-badge-equipment">
                    <Tag size={10} />
                    {exercise.equipment}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* No Results Fallback / Custom Exercise Addition Form */}
      {isOpen && query.trim() !== '' && suggestions.length === 0 && (
        <div className="exercise-custom-popup">
          <div className="exercise-custom-popup-header">
            <Sparkles size={16} style={{ color: 'var(--accent)' }} />
            <span className="exercise-custom-popup-header-title">"{query}"</span>
            <span>검색 결과 없음</span>
          </div>

          <div className="exercise-custom-popup-desc">
            아래에서 주동근과 장비를 선택하고 나만의 커스텀 운동으로 등록할 수 있습니다.
          </div>

          {/* Custom Exercise Form */}
          <div className="exercise-custom-form">
            
            {/* 1. Target Muscle */}
            <div className="exercise-custom-label">
              <Dumbbell size={11} color="var(--accent)" />
              주동근 선택
            </div>
            <div className="exercise-custom-options">
              {MUSCLE_GROUPS.map(muscle => {
                const isSelected = selectedMuscle === muscle;
                return (
                  <button
                    key={muscle}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedMuscle(muscle);
                    }}
                    className={`exercise-custom-option-btn ${isSelected ? 'is-active' : ''}`}
                  >
                    {muscle}
                  </button>
                );
              })}
            </div>

            {/* 2. Equipment */}
            <div className="exercise-custom-label">
              <Tag size={11} color="var(--accent)" />
              장비 선택
            </div>
            <div className="exercise-custom-options" style={{ marginBottom: '20px' }}>
              {EQUIPMENTS.map(equip => {
                const isSelected = selectedEquipment === equip;
                return (
                  <button
                    key={equip}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedEquipment(equip);
                    }}
                    className={`exercise-custom-option-btn ${isSelected ? 'is-active' : ''}`}
                  >
                    {equip}
                  </button>
                );
              })}
            </div>

            {/* 3. Unilateral Option */}
            <div className="exercise-unilateral-toggle" onClick={() => setIsUnilateral(!isUnilateral)}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={12} color="var(--accent)" />
                  좌우 따로 수행 (편측 운동)
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  런지, 원암 덤벨 로우처럼 편측성 운동인 경우 활성화
                </div>
              </div>
              <div className={`toggle-switch-track ${isUnilateral ? 'is-active' : ''}`}>
                <div className="toggle-switch-thumb" />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleCustomSelect();
              }}
              className="exercise-custom-submit-btn"
            >
              <Plus size={13} />
              나만의 커스텀 운동으로 추가하기
            </button>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px' }}>
              또는 키보드 Enter를 누르면 바로 추가됩니다.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
