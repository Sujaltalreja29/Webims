import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  icon
}) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
      <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        {icon ?? <Inbox size={26} />}
      </div>
      <p className="text-base font-semibold text-slate-800">{title}</p>
      {description ? <p className="mt-2 text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
};
