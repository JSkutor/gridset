export function SettingRow({ label, icon, children }) {
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

export function NumberStepper({ value, min, max, onChange, unit, valueRef, onValueKeyDown }) {
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
        onMouseEnter={event => event.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
        onMouseLeave={event => event.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
        aria-label={`${unit} 줄이기`}
      >
        −
      </button>
      <span
        ref={valueRef}
        className="setting-stepper-value"
        tabIndex={0}
        role="spinbutton"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={`${unit} 값`}
        onKeyDown={onValueKeyDown}
        style={{
          fontSize: '17px',
          fontWeight: '700',
          color: 'var(--text-bright)',
          minWidth: '28px',
          textAlign: 'center',
          fontVariantNumeric: 'tabular-nums',
          borderRadius: '6px',
          outline: 'none',
          cursor: 'default',
        }}
      >
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
        onMouseEnter={event => event.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
        onMouseLeave={event => event.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
        aria-label={`${unit} 늘리기`}
      >
        +
      </button>
      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{unit}</span>
    </div>
  );
}

export function RestTimeStepper({ value, onChange, valueRef, onValueKeyDown }) {
  const step = 15;
  const min = 0;
  const max = 600;

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}초`;
    const minutes = Math.floor(seconds / 60);
    const restSeconds = seconds % 60;
    return restSeconds === 0 ? `${minutes}분` : `${minutes}분 ${restSeconds}초`;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <button
        onClick={() => onChange(Math.max(min, value - step))}
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
        onMouseEnter={event => event.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
        onMouseLeave={event => event.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
        aria-label="휴식시간 줄이기"
      >
        −
      </button>
      <span
        ref={valueRef}
        className="setting-stepper-value"
        tabIndex={0}
        role="spinbutton"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label="휴식시간 값"
        onKeyDown={onValueKeyDown}
        style={{
          fontSize: '15px',
          fontWeight: '700',
          color: 'var(--text-bright)',
          minWidth: '52px',
          textAlign: 'center',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.02em',
          borderRadius: '6px',
          outline: 'none',
          cursor: 'default',
        }}
      >
        {formatTime(value)}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + step))}
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
        onMouseEnter={event => event.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
        onMouseLeave={event => event.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
        aria-label="휴식시간 늘리기"
      >
        +
      </button>
    </div>
  );
}

export function UnilateralStepper({ value, onChange, valueRef, onValueKeyDown, disabled }) {
  const label = value ? 'L/R' : 'Both';

  const handleToggle = () => {
    if (disabled) return;
    onChange(!value);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <button
        onClick={handleToggle}
        disabled={disabled}
        style={{
          width: '28px',
          height: '28px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          color: disabled ? 'var(--text-muted)' : 'var(--text-main)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          fontFamily: 'inherit',
          transition: 'background 0.15s',
          opacity: disabled ? 0.3 : 1,
        }}
        onMouseEnter={event => { if (!disabled) event.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
        onMouseLeave={event => { if (!disabled) event.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
        aria-label="편측성 변경"
      >
        −
      </button>
      <span
        ref={disabled ? null : valueRef}
        className="setting-stepper-value"
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-label="편측성 값"
        onKeyDown={disabled ? null : onValueKeyDown}
        style={{
          fontSize: '15px',
          fontWeight: '700',
          color: disabled ? 'var(--text-muted)' : 'var(--text-bright)',
          minWidth: '52px',
          textAlign: 'center',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.02em',
          borderRadius: '6px',
          outline: 'none',
          cursor: disabled ? 'default' : 'pointer',
        }}
        onClick={handleToggle}
      >
        {label}
      </span>
      <button
        onClick={handleToggle}
        disabled={disabled}
        style={{
          width: '28px',
          height: '28px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          color: disabled ? 'var(--text-muted)' : 'var(--text-main)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          fontFamily: 'inherit',
          transition: 'background 0.15s',
          opacity: disabled ? 0.3 : 1,
        }}
        onMouseEnter={event => { if (!disabled) event.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
        onMouseLeave={event => { if (!disabled) event.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
        aria-label="편측성 변경"
      >
        +
      </button>
    </div>
  );
}
