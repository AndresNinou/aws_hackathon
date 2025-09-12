import React from 'react';
import { cn } from '~/utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, disabled, ...props }, ref) => {
    const baseClasses = cn(
      // Base styling
      'inline-flex items-center justify-center font-medium rounded-button',
      'transition-all duration-default ease-swift',
      'focus:outline-none focus-ring',
      'disabled:cursor-not-allowed disabled:bg-node-cookie disabled:text-text-muted disabled:shadow-none',
      
      // Size variants
      {
        'px-3 py-2 text-small h-8': size === 'sm',
        'px-4 py-2 text-body h-10': size === 'md',
        'px-6 py-3 text-body h-12': size === 'lg',
      },
      
      // Variant styling
      {
        // Primary: Signal Lime on Ink Black
        'bg-accent-brand text-ink-black shadow-level-1 hover:bg-accent-brand-hover hover:shadow-level-2 active:bg-accent-brand-pressed active:shadow-none': 
          variant === 'primary' && !disabled,
          
        // Secondary: Slate bg, text primary, border strong
        'bg-slate text-text-primary border border-border-strong shadow-level-1 hover:shadow-level-2 hover:brightness-102 active:shadow-none active:brightness-95': 
          variant === 'secondary' && !disabled,
          
        // Ghost: transparent bg, selection on hover
        'bg-transparent text-text-primary hover:bg-selection active:bg-selection active:brightness-95': 
          variant === 'ghost' && !disabled,
          
        // Destructive: Scarlet bg
        'bg-scarlet text-ink-black shadow-level-1 hover:bg-red-500 hover:shadow-level-2 active:bg-red-600 active:shadow-none': 
          variant === 'destructive' && !disabled,
      },
      
      className
    );

    return (
      <button
        className={baseClasses}
        ref={ref}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
