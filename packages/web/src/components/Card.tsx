import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverable?: boolean;
}

export function Card({ children, className = '', hoverable = false, ...props }: CardProps) {
  return (
    <div 
      className={`bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-2xs transition-[transform,border-color,box-shadow,background-color] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${hoverable ? 'hover:border-[var(--color-primary)]/35 hover:shadow-xs' : ''} ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
}
