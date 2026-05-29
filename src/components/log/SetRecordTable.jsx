import { formatSetCellValue } from '../../utils/logFormatters';

export default function SetRecordTable({ records, exercise, compact = false }) {
  const hasMemo = true;


  return (
    <div className={`log-set-grid-wrap ${compact ? 'log-set-grid-wrap--compact' : ''}`}>
      <table className={`log-set-grid ${hasMemo ? 'has-memo' : ''}`} aria-label={`${exercise?.name || '운동'} 세트 기록`}>
        <colgroup>
          <col className="log-set-col" />
          <col className="log-value-col" />
          <col className="log-value-col" />
          {hasMemo && <col className="log-memo-col" />}
        </colgroup>
        <thead>
          <tr>
            <th>
              <span className="log-grid-header-badge">Set</span>
            </th>
            <th>
              <span className="log-grid-header-badge log-grid-header-badge--accent">kg</span>
            </th>
            <th>
              <span className="log-grid-header-badge log-grid-header-badge--accent">reps</span>
            </th>
            {hasMemo && (
              <th>
                <span className="log-grid-header-badge log-grid-header-badge--memo">memo</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              <td className="cell-set">
                {record.set_number}
                {record.side && record.side !== 'both' && (
                  <span className={`side-badge side-badge--${record.side.toLowerCase()}`}>
                    {record.side}
                  </span>
                )}
              </td>
              <td className="cell-value">{formatSetCellValue(record.weight)}</td>
              <td className="cell-value">{formatSetCellValue(record.record)}</td>
              {hasMemo && (
                <td className="cell-memo">
                  {record.memo && record.memo.trim() ? (
                    <span className="log-set-memo-chip">{record.memo.trim()}</span>
                  ) : (
                    <span className="log-set-memo-empty">-</span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
