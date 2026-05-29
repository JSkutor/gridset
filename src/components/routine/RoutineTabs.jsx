import { useRef, useState } from 'react';
import { Plus } from 'lucide-react';

export default function RoutineTabs({
  routines,
  activeRoutineId,
  onSelectRoutine,
  onCreateRoutine,
  onDuplicateRoutine,
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownCoords, setDropdownCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);

  const handleToggleDropdown = () => {
    if (!isDropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownCoords({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeDropdown = () => setIsDropdownOpen(false);

  return (
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
          onMouseEnter={event => {
            if (!isDropdownOpen) {
              event.currentTarget.style.color = 'var(--accent)';
              event.currentTarget.style.transform = 'scale(1.1)';
            }
          }}
          onMouseLeave={event => {
            if (!isDropdownOpen) {
              event.currentTarget.style.color = 'var(--text-muted)';
              event.currentTarget.style.transform = 'scale(1)';
            }
          }}
        >
          <Plus size={18} style={{ transform: isDropdownOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        {isDropdownOpen && (
          <>
            <div
              onClick={closeDropdown}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 998,
              }}
            />
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
              <button
                onClick={() => {
                  onCreateRoutine();
                  closeDropdown();
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
                onMouseEnter={event => event.currentTarget.style.background = 'rgba(122, 162, 247, 0.1)'}
                onMouseLeave={event => event.currentTarget.style.background = 'transparent'}
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
                    {routines.map(routine => (
                      <button
                        key={routine.id}
                        onClick={() => {
                          onDuplicateRoutine(routine.id);
                          closeDropdown();
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
                        onMouseEnter={event => {
                          event.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                          event.currentTarget.style.color = 'var(--text-bright)';
                        }}
                        onMouseLeave={event => {
                          event.currentTarget.style.background = 'transparent';
                          event.currentTarget.style.color = 'var(--text-main)';
                        }}
                      >
                        {routine.name} 복사
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {routines.map(routine => {
        const isActive = routine.id === activeRoutineId;
        return (
          <div key={routine.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button
              onClick={() => onSelectRoutine(routine.id)}
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
              onMouseEnter={event => {
                if (!isActive) event.currentTarget.style.color = 'var(--text-main)';
              }}
              onMouseLeave={event => {
                if (!isActive) event.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              {routine.name}
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
  );
}
