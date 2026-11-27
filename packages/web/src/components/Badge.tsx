import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  status?: 'default' | 'success' | 'warning' | 'danger' | 'primary' | 'info' | 'purple';
  variant?: 'subtle' | 'outline';
}

export function Badge({ 
  children, 
  status = 'default',
  variant = 'subtle',
  className = '',
  ...props 
}: BadgeProps) {
  const styles = {
    default: variant === 'outline'
      ? 'border border-[var(--color-border)] text-[var(--color-text-secondary)] bg-transparent'
      : 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20',
    success: variant === 'outline'
      ? 'border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-transparent'
      : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20',
    warning: variant === 'outline'
      ? 'border border-amber-500/30 text-amber-600 dark:text-amber-400 bg-transparent'
      : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20',
    danger: variant === 'outline'
      ? 'border border-rose-500/30 text-rose-600 dark:text-rose-400 bg-transparent'
      : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20',
    primary: variant === 'outline'
      ? 'border border-[var(--color-primary)]/30 text-[var(--color-primary)] bg-transparent'
      : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20',
    info: variant === 'outline'
      ? 'border border-blue-500/30 text-blue-600 dark:text-blue-400 bg-transparent'
      : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20',
    purple: variant === 'outline'
      ? 'border border-purple-500/30 text-purple-600 dark:text-purple-400 bg-transparent'
      : 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20',
  };

  return (
    <span 
      className={`inline-flex items-center px-2 py-0.5 rounded-[var(--radius-sm)] text-[11px] font-semibold tracking-wide whitespace-nowrap transition-colors ${styles[status]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
