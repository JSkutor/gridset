import React from 'react'

export default function PastLogs() {
  const dummyLogs = [
    { id: 'log1', date: 'Today', totalVolume: 1250, sets: [{ set: 1, weight: 60, reps: 10 }, { set: 2, weight: 65, reps: 8 }, { set: 3, weight: 65, reps: 8 }] },
    { id: 'log2', date: 'May 24', totalVolume: 1100, sets: [{ set: 1, weight: 60, reps: 10 }, { set: 2, weight: 60, reps: 8 }, { set: 3, weight: 60, reps: 6 }] },
    { id: 'log3', date: 'May 20', totalVolume: 900, sets: [{ set: 1, weight: 50, reps: 12 }, { set: 2, weight: 50, reps: 10 }, { set: 3, weight: 50, reps: 10 }] },
    { id: 'log4', date: 'May 16', totalVolume: 850, sets: [{ set: 1, weight: 50, reps: 10 }, { set: 2, weight: 50, reps: 10 }] },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 100px 22px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {dummyLogs.map((log) => (
            <div key={log.id} className="glass-card" style={{ padding: '16px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px'
              }}>
                <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-bright)' }}>{log.date}</span>
                <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: '500' }}>{log.totalVolume} kg</span>
              </div>

              <table className="spreadsheet spreadsheet--readonly">
                <tbody>
                  {log.sets.map((set, i) => (
                    <tr key={i}>
                      <td className="cell-set">{set.set}</td>
                      <td className="cell-value">{set.weight}</td>
                      <td className="cell-value">{set.reps}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
