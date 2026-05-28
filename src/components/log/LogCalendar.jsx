import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { buildCalendarCells, formatDate, getCalendarMarkerColors } from '../../utils/logFormatters';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function LogCalendar({ monthDate, selectedDateKey, activityByDate, sessionsById, onSelectDate, onMonthChange }) {
  const cells = useMemo(() => buildCalendarCells(monthDate), [monthDate]);

  return (
    <section className="log-panel log-calendar-panel">
      <div className="log-panel-header">
        <div>
          <span className="log-kicker">Calendar</span>
          <h2>{formatDate(monthDate, { year: 'numeric', month: 'long' })}</h2>
        </div>
        <div className="log-icon-button-group">
          <button type="button" className="log-icon-button" onClick={() => onMonthChange(-1)} title="이전 달">
            <ChevronLeft size={16} />
          </button>
          <button type="button" className="log-icon-button" onClick={() => onMonthChange(1)} title="다음 달">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="log-calendar-weekdays">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="log-calendar-grid" aria-label="운동 기록 달력">
        {cells.map((cell) => {
          const dayItems = activityByDate.get(cell.key) || [];
          const count = dayItems.length;
          const markerColors = getCalendarMarkerColors(dayItems, sessionsById);
          const primaryMarkerColor = markerColors[0] || '#6B7394';
          const isSelected = selectedDateKey === cell.key;

          return (
            <button
              key={cell.key}
              type="button"
              className={[
                'log-calendar-cell',
                !cell.isCurrentMonth ? 'is-outside-month' : '',
                count > 0 ? 'has-activity' : '',
                isSelected ? 'is-selected' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => onSelectDate(cell.date)}
              title={`${formatDate(cell.date, { month: 'long', day: 'numeric' })} 기록 ${count}개`}
              style={{
                '--activity-border': `${primaryMarkerColor}4D`,
              }}
            >
              <span>{cell.date.getDate()}</span>
              {count > 0 && (
                <span className="log-calendar-activity-marks" aria-hidden="true">
                  {markerColors.slice(0, 3).map((color, markerIndex) => (
                    <span
                      key={`${color}-${markerIndex}`}
                      className="log-calendar-check-mark"
                      style={{ '--session-color': color }}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
