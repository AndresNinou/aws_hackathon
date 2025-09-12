import React from 'react';
import { cn } from '~/utils/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'AUTH' | 'default';
  children: React.ReactNode;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          // Base styling - pill shape, 12px text, 16px height
          'inline-flex items-center justify-center px-2 h-4 rounded-pill text-code-sm font-medium',
          'transition-all duration-micro ease-swift',
          
          // Variant colors
          {
            'bg-info/20 text-info border border-info/30': variant === 'GET',
            'bg-accent-brand/20 text-accent-brand border border-accent-brand/30': variant === 'POST',
            'bg-purple-500/20 text-purple-400 border border-purple-500/30': variant === 'PUT',
            'bg-warning/20 text-warning border border-warning/30': variant === 'PATCH',
            'bg-danger/20 text-danger border border-danger/30': variant === 'DELETE',
            'bg-success/20 text-success border border-success/30': variant === 'AUTH',
            'bg-bg-elevated text-text-secondary border border-border-subtle': variant === 'default',
          },
          
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
