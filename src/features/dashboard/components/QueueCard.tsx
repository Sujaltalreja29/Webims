import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface QueueCardProps {
  title: string;
  description: string;
  count: number;
  path: string;
  icon: LucideIcon;
  colorClasses: string;
  onNavigate: (path: string) => void;
}

export const QueueCard: React.FC<QueueCardProps> = ({
  title,
  description,
  count,
  path,
  icon: Icon,
  colorClasses,
  onNavigate
}) => {
  return (
    <button
      onClick={() => onNavigate(path)}
      className="w-full rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
        <div className={`rounded-lg p-2.5 ${colorClasses}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{count}</p>
    </button>
  );
};
