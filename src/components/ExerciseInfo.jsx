import { useMemo, useState, useRef, useEffect } from 'react'
import { Activity, Target, TrendingUp } from 'lucide-react'
import { useWorkoutStore } from '../store/useWorkoutStore'
import {
  buildExerciseHistoryStats,
  getExerciseDisplayUnitByUnit,
  getExerciseTotalLabelByUnit,
} from '../utils/exerciseHistory'

// A premium responsive SVG-based line chart component matching the project design
function SimpleLineChart({ data, unit, displayUnit }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [containerWidth, setContainerWidth] = useState(316);
  const containerRef = useRef(null);

  // Measure the width of the container dynamically to maintain perfect aspect ratios and circular dots
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect.width) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const { points, linePath, areaPath, yLabels, xLabels } = useMemo(() => {
    if (!data || data.length === 0) {
      return { points: [], linePath: '', areaPath: '', yLabels: [], xLabels: [] };
    }

    const width = containerWidth;
    const height = 135;
    const paddingLeft = 36;
    const paddingRight = 12;
    const paddingTop = 12;
    const paddingBottom = 22;

    const plotWidth = Math.max(50, width - paddingLeft - paddingRight);
    const plotHeight = Math.max(50, height - paddingTop - paddingBottom);

    const values = data.map(d => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);

    // Auto-scale Y axis with padding to keep it grounded but readable
    const range = maxVal - minVal;
    const pad = range === 0 ? Math.max(10, maxVal * 0.1) : range * 0.15;
    const yMin = Math.max(0, minVal - pad);
    const yMax = maxVal + pad === 0 ? 10 : maxVal + pad;

    const points = [];
    const N = data.length;

    for (let i = 0; i < N; i++) {
      const d = data[i];
      const x = N > 1 
        ? paddingLeft + (i / (N - 1)) * plotWidth 
        : paddingLeft + plotWidth / 2;
      const denom = (yMax - yMin) || 1;
      const y = paddingTop + plotHeight - ((d.value - yMin) / denom) * plotHeight;
      points.push({ x, y, ...d, index: i });
    }

    // Build SVG paths
    let linePath = '';
    let areaPath = '';

    if (points.length > 0) {
      // Line path
      linePath = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        linePath += ` L ${points[i].x} ${points[i].y}`;
      }

      // Area path
      const bottomY = paddingTop + plotHeight;
      areaPath = `M ${points[0].x} ${bottomY} L ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        areaPath += ` L ${points[i].x} ${points[i].y}`;
      }
      areaPath += ` L ${points[points.length - 1].x} ${bottomY} Z`;
    }

    // Y Axis Labels (Min, Mid, Max)
    const yLabels = [
      { y: paddingTop + plotHeight, value: Math.round(yMin) },
      { y: paddingTop + plotHeight / 2, value: Math.round((yMin + yMax) / 2) },
      { y: paddingTop, value: Math.round(yMax) }
    ];

    // X Axis Labels (Start, Mid, End)
    const xLabels = [];
    if (N > 0) {
      xLabels.push({ x: points[0].x, label: points[0].formattedDate, anchor: 'start' });
      if (N > 2) {
        const midIdx = Math.floor(N / 2);
        xLabels.push({ x: points[midIdx].x, label: points[midIdx].formattedDate, anchor: 'middle' });
      }
      if (N > 1) {
        xLabels.push({ x: points[points.length - 1].x, label: points[points.length - 1].formattedDate, anchor: 'end' });
      }
    }

    return { points, linePath, areaPath, yLabels, xLabels };
  }, [data, containerWidth]);

  if (!data || data.length === 0) {
    return (
      <div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
          <TrendingUp size={14} /> Progress Chart
        </div>
        <div style={{
          height: '145px',
          background: 'rgba(0, 0, 0, 0.12)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--border)',
          gap: '6px',
          color: 'var(--text-muted)'
        }}>
          <Target size={28} style={{ opacity: 0.4 }} strokeWidth={1.5} />
          <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-main)' }}>기록 그래프</div>
          <div style={{ fontSize: '11px', opacity: 0.7 }}>완료된 운동 기록이 없습니다.</div>
        </div>
      </div>
    );
  }

  const activePoint = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
        <TrendingUp size={14} /> Progress Chart
      </div>

      {/* Tooltip Overlay */}
      {activePoint && (
        <div style={{
          position: 'absolute',
          top: '-26px',
          left: `${activePoint.x}px`,
          transform: 'translateX(-50%)',
          background: 'var(--bg-panel-strong)',
          border: '1px solid var(--accent)',
          borderRadius: '6px',
          padding: '4px 8px',
          fontSize: '11px',
          color: 'var(--text-bright)',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          zIndex: 10,
          boxShadow: 'var(--shadow-card)',
          borderWidth: '1px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1px',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}>
          <div style={{ fontWeight: '600' }}>
            {activePoint.value.toLocaleString()}{displayUnit}
            {unit === 'kg' && activePoint.reps > 0 && ` (${activePoint.reps}회)`}
          </div>
          <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{activePoint.dateStr}</div>
        </div>
      )}

      {/* SVG Plot Container */}
      <div ref={containerRef} style={{
        height: '145px',
        background: 'rgba(0, 0, 0, 0.15)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
        overflow: 'visible',
        position: 'relative'
      }}>
        <svg
          width="100%"
          height="100%"
          style={{ overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yLabels.map((lbl, idx) => (
            <line
              key={idx}
              x1="36"
              y1={lbl.y}
              x2={containerWidth - 12}
              y2={lbl.y}
              stroke="var(--border)"
              strokeWidth="0.75"
              strokeDasharray="3 3"
            />
          ))}

          {/* Y Axis Labels */}
          {yLabels.map((lbl, idx) => (
            <text
              key={idx}
              x="28"
              y={lbl.y + 3.5}
              fill="var(--text-muted)"
              fontSize="9"
              textAnchor="end"
              fontFamily="inherit"
              fontWeight="500"
            >
              {lbl.value.toLocaleString()}
            </text>
          ))}

          {/* X Axis Labels */}
          {xLabels.map((lbl, idx) => (
            <text
              key={idx}
              x={lbl.x}
              y="134"
              fill="var(--text-muted)"
              fontSize="9"
              textAnchor={lbl.anchor}
              fontFamily="inherit"
              fontWeight="500"
            >
              {lbl.label}
            </text>
          ))}

          {/* Area Under the Line */}
          {areaPath && (
            <path
              d={areaPath}
              fill="url(#chartGrad)"
            />
          )}

          {/* main line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Dots & hover targets */}
          {points.map((pt) => {
            const isHovered = hoveredIndex === pt.index;
            return (
              <g key={pt.index}>
                {/* Wider invisible hover target for easier mouse interactions */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="14"
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredIndex(pt.index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
                {/* Inner dot */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 5 : 3}
                  fill="var(--bg-deep)"
                  stroke="var(--accent)"
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  style={{ transition: 'r 0.15s ease, stroke-width 0.15s ease', pointerEvents: 'none' }}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default function ExerciseInfo({ activeExerciseId }) {
  const exercises = useWorkoutStore(state => state.exercises);
  const setRecords = useWorkoutStore(state => state.setRecords);
  const workoutLogs = useWorkoutStore(state => state.workoutLogs);

  const activeExercise = exercises.find(ex => ex.id === activeExerciseId);

  const unit = useMemo(() => {
    if (!activeExercise) return 'kg';
    return activeExercise.unit || 'kg';
  }, [activeExercise]);

  const displayUnit = useMemo(() => getExerciseDisplayUnitByUnit(unit), [unit]);
  const displayLabel = useMemo(() => getExerciseTotalLabelByUnit(unit), [unit]);
  const { totalVolume, chartData, heatmapData } = useMemo(() => (
    buildExerciseHistoryStats({
      exerciseId: activeExerciseId,
      setRecords,
      workoutLogs,
      unit,
    })
  ), [activeExerciseId, setRecords, workoutLogs, unit]);

  const heatmapColors = [
    'rgba(255, 255, 255, 0.03)',
    'rgba(122, 162, 247, 0.18)',
    'rgba(122, 162, 247, 0.42)',
    'rgba(122, 162, 247, 0.68)',
    'rgba(122, 162, 247, 0.95)'
  ];

  if (!activeExercise) {
    return (
      <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
        운동을 선택해주세요
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <div className="section-header">
        <h2>{activeExercise.name}</h2>
      </div>

      <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '26px' }}>
        {/* 1. Git 잔디 (Activity Heatmap) */}
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
            <Activity size={14} /> Activity History
          </div>
          <div style={{ 
            background: 'rgba(0, 0, 0, 0.12)', 
            border: '1px solid var(--border)', 
            borderRadius: 'var(--radius-md)', 
            padding: '12px',
            display: 'grid', 
            gridTemplateColumns: 'repeat(10, 1fr)',
            gridTemplateRows: 'repeat(7, 1fr)',
            gridAutoFlow: 'column', 
            gap: '3px',
            width: '100%'
          }}>
            {heatmapData.map((intensity, i) => (
              <div
                key={i}
                className="heatmap-cell"
                style={{ 
                  height: '11px',
                  borderRadius: '2.0px', 
                  background: heatmapColors[intensity],
                  transition: 'background 0.2s ease'
                }}
              />
            ))}
          </div>
        </div>

        {/* 2. Sleek dynamic chart showing Period vs. Record */}
        <SimpleLineChart data={chartData} unit={unit} displayUnit={displayUnit} />

        {/* 3. Total Volume / Count */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '500', letterSpacing: '0.03em' }}>
            {displayLabel}
          </div>
          <div style={{ fontSize: '30px', fontWeight: '700', letterSpacing: '-1px', color: 'var(--text-bright)' }}>
            {totalVolume.toLocaleString()} <span style={{ fontSize: '15px', fontWeight: '400', color: 'var(--text-muted)' }}>{displayUnit}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
