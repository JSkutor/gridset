import { Fragment, useEffect } from 'react';
import type { ReactNode } from 'react';
import { HelpCircle, X, Keyboard } from 'lucide-react';

function HelpKbd({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return <kbd className={wide ? 'help-kbd help-kbd--wide' : 'help-kbd'}>{children}</kbd>;
}

function ModifierKeys({ modifiers }: { modifiers?: string[] }) {
  if (!modifiers?.length) return null;

  return (
    <span className="help-kbd-mod-group">
      {modifiers.map((mod, index) => (
        <Fragment key={mod}>
          {index > 0 ? (
            <span className="help-kbd-sep" aria-hidden="true">
              /
            </span>
          ) : null}
          <HelpKbd wide>{mod}</HelpKbd>
        </Fragment>
      ))}
    </span>
  );
}

function ShortcutKeys({ keys, modifiers }: { keys?: string[]; modifiers?: string[] }) {
  const hasModifiers = Boolean(modifiers?.length);
  const hasKeys = Boolean(keys?.length);
  if (!hasModifiers && !hasKeys) return null;

  return (
    <span className="shortcut-key-combo">
      {hasModifiers ? <ModifierKeys modifiers={modifiers} /> : null}
      {hasKeys
        ? keys?.map((key) => (
            <HelpKbd key={key} wide={key === 'Tab'}>
              {key}
            </HelpKbd>
          ))
        : null}
    </span>
  );
}

function ShortcutRow({ label, keys, modifiers, detail }: { label: string; keys?: string[]; modifiers?: string[]; detail?: string }) {
  return (
    <div className="help-shortcut-row">
      <span className="help-shortcut-label">
        {label}
        {detail ? <span className="help-shortcut-detail">{detail}</span> : null}
      </span>
      <ShortcutKeys keys={keys} modifiers={modifiers} />
    </div>
  );
}

const SHORTCUT_TIPS = [
  { label: '그리드 진입 · 세트 메모 전환', keys: ['`', '₩'] },
  { label: '첫 kg 입력 후', keys: ['Tab'], detail: '같은 운동의 아래 세트 중량에 복사' },
  { label: 'Reps 입력 후', keys: ['Tab'], detail: '세트 완료 · 휴식 타이머' },
  { label: '세션·운동 순서 바꾸기', modifiers: ['Command', 'Ctrl'], keys: ['↑', '↓'], detail: '루틴 편집 화면' },
  { label: '목표·휴식 설정값 조절', modifiers: ['Command', 'Ctrl'], keys: ['↑', '↓'], detail: '설정 패널에 포커스 있을 때' },
];

export default function HelpModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="help-backdrop" onClick={onClose}>
      <div className="help-card fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="help-header">
          <div className="help-title-wrap">
            <HelpCircle size={20} className="text-accent animate-pulse-subtle" />
            <h2>도움말</h2>
          </div>
          <button className="help-close-btn" onClick={onClose} aria-label="도움말 닫기">
            <X size={18} />
          </button>
        </div>

        <div className="help-content">
          <div className="help-section">
            <div className="section-title-wrap">
              <Keyboard size={15} className="text-accent" />
              <h3>키보드 단축키</h3>
            </div>

            <p className="help-kbd-summary" role="note">
              <ShortcutKeys keys={['Q', 'W', 'E']} />
              <span className="help-kbd-summary-text">로 화면을 바꿉니다.</span>
              <ShortcutKeys keys={['↑', '↓', '←', '→']} />
              <span className="help-kbd-summary-text">로 목록·셀을 이동하고,</span>
              <ShortcutKeys keys={['Esc']} />
              <span className="help-kbd-summary-text">로 포커스를 빼거나 이 도움말을 닫을 수 있습니다.</span>
            </p>

            <div className="help-nav-hero" aria-label="화면 전환">
              <div className="help-nav-hero-item">
                <HelpKbd>Q</HelpKbd>
                <span>루틴 편집</span>
              </div>
              <div className="help-nav-hero-item">
                <HelpKbd>W</HelpKbd>
                <span>실시간 기록</span>
              </div>
              <div className="help-nav-hero-item">
                <HelpKbd>E</HelpKbd>
                <span>로그</span>
              </div>
            </div>

            <div className="help-tip-list">
              {SHORTCUT_TIPS.map((row) => (
                <ShortcutRow key={row.label} {...row} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
