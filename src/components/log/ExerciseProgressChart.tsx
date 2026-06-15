// @ts-nocheck
import { formatDate, formatMetric } from '../../utils/logFormatters';

export default function ExerciseProgressChart({ points, exercise }: any) {
  const width = 640;
  const height = 240;
  const padding = { top: 22, right: 22, bottom: 38, left: 48 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  if (points.length === 0) {
    return (
      <div className="log-chart-wrap">
        <div className="log-chart-placeholder" role="status">
          기록 없음
        </div>
      </div>
    );
  }

  const times = points.map((point) => point.date.getTime());
  const values = points.map((point) => point.value);
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const minValue = Math.min(0, ...values);
  const maxValue = Math.max(1, ...values);
  const timeRange = Math.max(1, maxTime - minTime);
  const valueRange = Math.max(1, maxValue - minValue);

  const coords = points.map((point) => {
    const x = padding.left + ((point.date.getTime() - minTime) / timeRange) * chartWidth;
    const y = padding.top + chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
    return { x, y, point };
  });

  const linePath = coords.map((coord) => `${coord.x},${coord.y}`).join(' ');
  const areaPath = [
    `${padding.left},${padding.top + chartHeight}`,
    ...coords.map((coord) => `${coord.x},${coord.y}`),
    `${padding.left + chartWidth},${padding.top + chartHeight}`,
  ].join(' ');

  return (
    <div className="log-chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${exercise?.name || '운동'} 기록 그래프`}>
        <defs>
          <linearGradient id="logChartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(122, 162, 247, 0.28)" />
            <stop offset="100%" stopColor="rgba(122, 162, 247, 0)" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding.top + chartHeight * ratio;
          return <line key={ratio} x1={padding.left} x2={padding.left + chartWidth} y1={y} y2={y} className="log-chart-grid-line" />;
        })}
        <polygon points={areaPath} fill="url(#logChartFill)" />
        <polyline points={linePath} fill="none" className="log-chart-line" />
        {coords.map(({ x, y, point }) => (
          <g key={point.key}>
            <circle cx={x} cy={y} r="4.5" className="log-chart-dot" />
            <title>{`${formatDate(point.date, { month: 'short', day: 'numeric' })}: ${formatMetric(point.value, exercise)}`}</title>
          </g>
        ))}
        <text x={padding.left} y={height - 10} className="log-chart-axis-label">
          {formatDate(points[0].date, { month: 'short', day: 'numeric' })}
        </text>
        <text x={padding.left + chartWidth} y={height - 10} textAnchor="end" className="log-chart-axis-label">
          {formatDate(points[points.length - 1].date, { month: 'short', day: 'numeric' })}
        </text>
        <text x={padding.left - 8} y={padding.top + 6} textAnchor="end" className="log-chart-axis-label">
          {formatMetric(maxValue, exercise)}
        </text>
      </svg>
    </div>
  );
}
