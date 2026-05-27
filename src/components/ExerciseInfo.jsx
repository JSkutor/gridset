import React from 'react'
import { Activity, Target } from 'lucide-react'

export default function ExerciseInfo() {
  const heatmapColors = [
    'rgba(255,255,255,0.04)',
    'rgba(122, 162, 247, 0.25)',
    'rgba(122, 162, 247, 0.45)',
    'rgba(122, 162, 247, 0.65)',
    'rgba(122, 162, 247, 0.9)'
  ];

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <div className="section-header">
        <h2>Bench Press</h2>
        <span className="subtitle">Barbell • Chest</span>
      </div>

      <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Exercise Image Area */}
        <div style={{
          height: '150px',
          background: 'linear-gradient(135deg, rgba(122,162,247,0.03) 0%, rgba(122,162,247,0.08) 100%)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--border)'
        }}>
          <Target size={36} color="var(--text-muted)" strokeWidth={1.5} />
        </div>

        {/* Total Volume */}
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '500', letterSpacing: '0.03em' }}>Total Volume (All Time)</div>
          <div style={{ fontSize: '30px', fontWeight: '700', letterSpacing: '-1px', color: 'var(--text-bright)' }}>
            24,500 <span style={{ fontSize: '15px', fontWeight: '400', color: 'var(--text-muted)' }}>kg</span>
          </div>
        </div>

        {/* Activity Heatmap */}
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
            <Activity size={14} /> Activity History
          </div>
          <div className="heatmap-grid">
            {Array.from({ length: 40 }).map((_, i) => {
              const intensity = Math.random() > 0.6 ? Math.floor(Math.random() * 4) + 1 : 0;
              return (
                <div
                  key={i}
                  className="heatmap-cell"
                  style={{ background: heatmapColors[intensity] }}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
