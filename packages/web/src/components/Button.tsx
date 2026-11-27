import React, { useState } from 'react';
import { KahootLoader } from './KahootLoader';
import { deriveLoaderText } from './loaderHelper';

function Arc({ className = '', style, ...props }: React.ComponentProps<"div">) {
  return (
    <>
      <style>{`
        @keyframes loading-ui-arc-spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
      <div
        className={`rounded-full border-[2px] border-current/25 border-t-current ${className}`}
        style={{
          animationName: "loading-ui-arc-spin",
          animationDuration: "var(--duration, 0.75s)",
          animationTimingFunction: "linear",
          animationIterationCount: "infinite",
          ...style,
        }}
        {...props}
      />
    </>
  );
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  showLoader?: boolean;
  loaderText?: string;
  loadingDuration?: number;
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '', 
  isLoading = false,
  showLoader = false,
  loaderText,
  loadingDuration = 0,
  onClick,
  ...props 
}: ButtonProps) {
  const [simulatedLoading, setSimulatedLoading] = useState(false);

  const sizeStyles = {
    sm: 'h-8 px-2.5 text-xs rounded-[var(--radius-sm)] gap-1.5',
    md: 'h-9 px-3.5 text-xs sm:text-sm rounded-[var(--radius-md)] gap-2',
    lg: 'h-10 px-4 text-sm rounded-[var(--radius-md)] gap-2',
  };

  const baseStyles = 'app-button items-center justify-center font-medium transform-gpu transition-[transform,background-color,border-color,color,box-shadow,opacity] duration-[180ms] ease-[cubic-bezier(0.32,0.72,0,1)] select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-text)] active:scale-[0.98] active:duration-[90ms] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-2xs font-semibold',
    secondary: 'bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] border border-[var(--color-border)] shadow-2xs font-medium',
    outline: 'bg-transparent hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] border border-[var(--color-border)] font-medium',
    ghost: 'bg-transparent hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] font-medium',
    danger: 'bg-[var(--color-danger)] hover:bg-[var(--color-danger)]/90 text-white shadow-2xs font-semibold',
  };

  const showLoading = isLoading || simulatedLoading;
  const currentLoaderText = deriveLoaderText(children, loaderText);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (showLoading) return;
    
    if (loadingDuration > 0 || showLoader) {
      setSimulatedLoading(true);
    }
    
    const startTime = Date.now();
    try {
      if (onClick) {
        await onClick(e);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (loadingDuration > 0) {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, loadingDuration - elapsed);
        if (remaining > 0) {
          await new Promise(resolve => setTimeout(resolve, remaining));
        }
      }
      setSimulatedLoading(false);
    }
  };

  return (
    <>
      {showLoading && showLoader && (
        <KahootLoader text={currentLoaderText} />
      )}
      <button 
        className={`${baseStyles} ${sizeStyles[size]} ${variants[variant]} ${className} ${showLoading ? 'opacity-85 pointer-events-none' : ''}`} 
        disabled={showLoading || props.disabled}
        onClick={handleClick}
        {...props}
      >
        {showLoading ? (
          <Arc className="w-3.5 h-3.5 shrink-0" style={{ '--duration': '0.75s' } as React.CSSProperties} />
        ) : null}
        {children}
      </button>
    </>
  );
}
