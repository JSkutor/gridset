import { useEffect, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';

export default function DemoClearAction({ onConfirm }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handlePointerDown(event) {
      if (containerRef.current?.contains(event.target)) return;
      setIsOpen(false);
    }

    function handleKeyDown(event) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      setIsOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen]);

  const handleConfirm = () => {
    onConfirm();
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="demo-clear-action">
      <button
        type="button"
        className={`demo-clear-trigger-btn${isOpen ? ' is-open' : ''}`}
        onClick={() => setIsOpen((open) => !open)}
        title="샘플용 예시 기록을 지우고 빈 상태에서 시작"
        aria-label="샘플용 기록 지우기"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Trash2 size={14} />
        <span>샘플 기록 지우기</span>
      </button>

      {isOpen && (
        <div
          className="demo-clear-popover"
          role="alertdialog"
          aria-labelledby="demo-clear-popover-title"
          aria-describedby="demo-clear-popover-desc"
        >
          <p id="demo-clear-popover-title" className="demo-clear-popover-title">
            샘플 기록을 지울까요?
          </p>
          <p id="demo-clear-popover-desc" className="demo-clear-popover-desc">
            예시 루틴·운동 기록이 모두 삭제됩니다.
          </p>
          <div className="demo-clear-popover-actions">
            <button type="button" className="demo-clear-popover-btn is-danger" onClick={handleConfirm}>
              지우기
            </button>
            <button type="button" className="demo-clear-popover-btn is-cancel" onClick={() => setIsOpen(false)}>
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
