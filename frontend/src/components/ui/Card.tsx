import React from 'react';
import { cn } from '~/utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base styling
          'bg-bg-elevated border border-border-subtle rounded-card shadow-level-1',
          'transition-all duration-default ease-swift',
          
          // Hover effect
          {
            'hover:shadow-level-2 hover:brightness-102': hover,
          },
          
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
