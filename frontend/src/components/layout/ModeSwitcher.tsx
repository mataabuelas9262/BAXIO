'use client';

import React from 'react';
import { Search, Zap } from 'lucide-react';
import { useUserMode } from '@/features/mode/context/ModeContext';
import { cn } from '@/utils/cn';

export const ModeSwitcher: React.FC<{ className?: string }> = ({ className }) => {
  const { mode, setMode } = useUserMode();

  return (
    <div
      className={cn(
        'inline-flex items-center p-1 rounded-full bg-slate-200/70 backdrop-blur-sm border border-slate-300/60 shadow-inner dark:bg-slate-800/90 dark:border-slate-700',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setMode('hire')}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all duration-200',
          mode === 'hire'
            ? 'baxio-premium-button bg-brand-600 text-white dark:bg-brand-600 dark:text-white'
            : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white',
        )}
      >
        <Search className="w-3.5 h-3.5" />
        <span>Contratar</span>
      </button>

      <button
        type="button"
        onClick={() => setMode('work')}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all duration-200',
          mode === 'work'
            ? 'baxio-premium-button baxio-premium-button-amber bg-amber-500 text-white dark:bg-amber-500 dark:text-slate-950'
            : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white',
        )}
      >
        <Zap className="w-3.5 h-3.5" />
        <span>Conseguir Chamba</span>
      </button>
    </div>
  );
};
