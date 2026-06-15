// @ts-nocheck
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
    <div className="routine-tabs">
      <div className="routine-tabs-add">
        <button
          ref={buttonRef}
          onClick={handleToggleDropdown}
          className={`routine-tabs-add-button ${isDropdownOpen ? 'is-open' : ''}`}
        >
          <Plus size={18} className="routine-tabs-add-button-icon" />
        </button>

        {isDropdownOpen && (
          <>
            <div
              onClick={closeDropdown}
              className="routine-tabs-scrim"
            />
            <div
              className="routine-tabs-menu"
              style={{
                top: `${dropdownCoords.top}px`,
                left: `${dropdownCoords.left}px`,
              }}
            >
              <button
                onClick={() => {
                  onCreateRoutine();
                  closeDropdown();
                }}
                className="routine-tabs-menu-button"
              >
                <Plus size={14} />
                새 루틴 만들기
              </button>

              {routines.length > 0 && (
                <>
                  <div className="routine-tabs-menu-divider" />
                  <div className="routine-tabs-menu-label">
                    기존 루틴 복사
                  </div>
                  <div className="routine-tabs-copy-list">
                    {routines.map(routine => (
                      <button
                        key={routine.id}
                        onClick={() => {
                          onDuplicateRoutine(routine.id);
                          closeDropdown();
                        }}
                        className="routine-tabs-menu-copy"
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
          <div key={routine.id} className="routine-tabs-item">
            <button
              onClick={() => onSelectRoutine(routine.id)}
              className={`routine-tabs-button ${isActive ? 'is-active' : ''}`}
            >
              {routine.name}
              {isActive && (
                <div className="routine-tabs-active-marker" />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
