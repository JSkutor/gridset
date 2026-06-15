// @ts-nocheck
export function SettingRow({ label, icon, children }) {
  return (
    <div>
      <div className="setting-row-label-section">
        {icon}
        {label}
      </div>
      {children}
    </div>
  );
}

export function NumberStepper({ value, min, max, onChange, unit, valueRef, onValueKeyDown, disabled }) {
  return (
    <div className="setting-stepper-container" style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="setting-stepper-btn"
        aria-label={`${unit} 줄이기`}
        disabled={disabled}
      >
        −
      </button>
      <span
        ref={disabled ? null : valueRef}
        className="setting-stepper-value setting-stepper-display-value"
        tabIndex={disabled ? -1 : 0}
        role="spinbutton"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={`${unit} 값`}
        onKeyDown={disabled ? null : onValueKeyDown}
      >
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="setting-stepper-btn"
        aria-label={`${unit} 늘리기`}
        disabled={disabled}
      >
        +
      </button>
      <span className="setting-stepper-unit">{unit}</span>
    </div>
  );
}

export function RestTimeStepper({ value, onChange, valueRef, onValueKeyDown, disabled }) {
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
    <div className="setting-stepper-container" style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      <button
        onClick={() => onChange(Math.max(min, value - step))}
        className="setting-stepper-btn"
        aria-label="휴식시간 줄이기"
        disabled={disabled}
      >
        −
      </button>
      <span
        ref={disabled ? null : valueRef}
        className="setting-stepper-value setting-stepper-display-value rest-time"
        tabIndex={disabled ? -1 : 0}
        role="spinbutton"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label="휴식시간 값"
        onKeyDown={disabled ? null : onValueKeyDown}
      >
        {formatTime(value)}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + step))}
        className="setting-stepper-btn"
        aria-label="휴식시간 늘리기"
        disabled={disabled}
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
    <div className="setting-stepper-container" style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      <button
        onClick={handleToggle}
        disabled={disabled}
        className="setting-stepper-btn"
        aria-label="편측성 변경"
      >
        −
      </button>
      <span
        ref={disabled ? null : valueRef}
        className={`setting-stepper-value setting-stepper-display-value unilateral ${
          disabled ? 'is-disabled' : ''
        }`}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-label="편측성 값"
        onKeyDown={disabled ? null : onValueKeyDown}
        onClick={handleToggle}
      >
        {label}
      </span>
      <button
        onClick={handleToggle}
        disabled={disabled}
        className="setting-stepper-btn"
        aria-label="편측성 변경"
      >
        +
      </button>
    </div>
  );
}
