import { History } from 'lucide-react';

export function EmptyState({ title, body }: any) {
  return (
    <div className="log-empty-state">
      <History size={22} />
      <strong>{title}</strong>
      <span>{body}</span>
    </div>
  );
}

export function StatPill({ label, value, icon: Icon }: any) {
  return (
    <div className="log-stat-pill">
      <Icon size={14} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
