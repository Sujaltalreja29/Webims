import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading data...',
  className = 'h-64'
}) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex items-center gap-2 text-slate-600">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
};
