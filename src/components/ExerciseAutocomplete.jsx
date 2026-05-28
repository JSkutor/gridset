import React, { useState, useEffect, useRef } from 'react';
import { Search, Dumbbell, Tag, Sparkles, Plus } from 'lucide-react';
import { EXERCISE_DICTIONARY } from '../data/exerciseDictionary';
import { matchHangul } from '../utils/hangul';

const MUSCLES = ['가슴', '등 (광배근)', '등 (중부)', '어깨', '이두', '삼두', '복근', '허벅지 앞 (대퇴사두)', '허벅지 뒤 (햄스트링)', '엉덩이 (둔근)', '기타'];
const EQUIPMENTS = ['바벨', '덤벨', '머신', '맨몸', '케이블', '기타'];

export default function ExerciseAutocomplete({ onSelect, placeholder = '운동 검색 (예: 풀업, 벤치, ㅍㅇ, OHP)' }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  // 커스텀 운동 추가용 주동근 및 장비 선택 상태
  const [selectedMuscle, setSelectedMuscle] = useState('기타');
  const [selectedEquipment, setSelectedEquipment] = useState('기타');

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const handleCustomSelect = () => {
    if (!query.trim()) return;
    const customExercise = {
      name: query.trim(),
      primaryMuscle: selectedMuscle,
      equipment: selectedEquipment,
      category: 'strength',
      unit: 'kg'
    };
    onSelect(customExercise);
    setQuery('');
    setIsOpen(false);
    // 상태 초기화
    setSelectedMuscle('기타');
    setSelectedEquipment('기타');
  };

  // 실시간 검색 매칭 로직
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setSelectedIndex(-1);
      return;
    }

    const matched = EXERCISE_DICTIONARY.filter(exercise => {
      // 1. 한국어 정식 명칭 매칭
      if (matchHangul(exercise.name, query)) return true;
      // 2. 영문 정식 명칭 매칭
      if (matchHangul(exercise.englishName, query)) return true;
      // 3. 줄임말 및 동의어 배열 매칭
      if (exercise.synonyms && exercise.synonyms.some(syn => matchHangul(syn, query))) return true;
      
      return false;
    });

    // 검색 결과 수 제한 (최대 10개)
    setSuggestions(matched.slice(0, 8));
    setSelectedIndex(0); // 첫 번째 추천 검색어에 기본 하이라이트
  }, [query]);

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
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        inputRef.current?.blur();
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
    <div ref={containerRef} style={{ position: 'relative', width: '100%', zIndex: 100 }}>
      {/* Input Box */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '12px 16px 12px 42px',
            background: 'rgba(0, 0, 0, 0.25)',
            border: isOpen ? '1px solid var(--border-focus)' : '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-bright)',
            fontSize: '14px',
            fontFamily: 'inherit',
            outline: 'none',
            boxShadow: isOpen ? '0 0 12px var(--accent-glow)' : 'none',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
        <Search
          size={16}
          color={isOpen ? 'var(--accent)' : 'var(--text-muted)'}
          style={{
            position: 'absolute',
            left: '16px',
            transition: 'color 0.2s'
          }}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setSuggestions([]);
              inputRef.current?.focus();
            }}
            style={{
              position: 'absolute',
              right: '16px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '12px',
              padding: 0
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            margin: 0,
            padding: '6px',
            listStyle: 'none',
            background: 'rgba(12, 14, 24, 0.95)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-md)',
            maxHeight: '280px',
            overflowY: 'auto',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.45)',
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          {suggestions.map((exercise, index) => {
            const isSelected = index === selectedIndex;
            return (
              <li
                key={exercise.id}
                onClick={() => handleSelect(exercise)}
                onMouseEnter={() => setSelectedIndex(index)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '6px',
                  background: isSelected ? 'rgba(122, 162, 247, 0.12)' : 'transparent',
                  color: isSelected ? 'var(--text-bright)' : 'var(--text-main)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Exercise Name */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '600', fontSize: '14px' }}>
                    {exercise.name}
                  </span>
                  {exercise.englishName && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      {exercise.englishName}
                    </span>
                  )}
                </div>

                {/* Badges / Meta tags */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                  {/* 주동근 태그 */}
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    fontSize: '11px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(122, 162, 247, 0.08)',
                    color: 'var(--accent)',
                    border: '1px solid rgba(122, 162, 247, 0.15)'
                  }}>
                    <Dumbbell size={10} />
                    {exercise.primaryMuscle}
                  </span>
                  
                  {/* 장비 태그 */}
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    fontSize: '11px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border)'
                  }}>
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
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            padding: '20px',
            background: 'rgba(12, 14, 24, 0.96)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-muted)',
            fontSize: '13px',
            boxShadow: '0 12px 45px rgba(0, 0, 0, 0.5)',
            animation: 'fadeIn 0.15s ease-out',
            zIndex: 101,
            maxHeight: '380px',
            overflowY: 'auto'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '12px' }}>
            <Sparkles size={16} style={{ color: 'var(--accent)' }} />
            <span style={{ color: 'var(--text-bright)', fontWeight: '600' }}>"{query}"</span>
            <span>검색 결과 없음</span>
          </div>

          <div style={{ fontSize: '11px', textAlign: 'center', color: 'var(--text-muted)', marginBottom: '16px' }}>
            아래에서 주동근과 장비를 선택하고 나만의 커스텀 운동으로 등록할 수 있습니다.
          </div>

          {/* Custom Exercise Form */}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px', textAlign: 'left' }}>
            
            {/* 1. Target Muscle */}
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Dumbbell size={11} color="var(--accent)" />
              주동근 선택
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {MUSCLES.map(muscle => {
                const isSelected = selectedMuscle === muscle;
                return (
                  <button
                    key={muscle}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedMuscle(muscle);
                    }}
                    style={{
                      fontSize: '10.5px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: isSelected ? 'rgba(122, 162, 247, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      color: isSelected ? 'var(--accent)' : 'var(--text-muted)',
                      border: isSelected ? '1px solid rgba(122, 162, 247, 0.35)' : '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {muscle}
                  </button>
                );
              })}
            </div>

            {/* 2. Equipment */}
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Tag size={11} color="var(--accent)" />
              장비 선택
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
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
                    style={{
                      fontSize: '10.5px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: isSelected ? 'rgba(122, 162, 247, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      color: isSelected ? 'var(--accent)' : 'var(--text-muted)',
                      border: isSelected ? '1px solid rgba(122, 162, 247, 0.35)' : '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {equip}
                  </button>
                );
              })}
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleCustomSelect();
              }}
              style={{
                width: '100%',
                padding: '11px',
                background: 'linear-gradient(135deg, var(--accent) 0%, #5b87e6 100%)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: '#ffffff',
                fontWeight: '600',
                fontSize: '12.5px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(122, 162, 247, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.filter = 'brightness(1.1)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.filter = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
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
