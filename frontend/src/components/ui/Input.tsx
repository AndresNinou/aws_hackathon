import React from 'react';
import { cn } from '~/utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-small font-medium text-text-primary mb-2"
          >
            {label}
          </label>
        )}
        
        <input
          id={inputId}
          ref={ref}
          className={cn(
            // Base styling
            'w-full px-3 py-2 rounded-input',
            'bg-slate border border-border-subtle text-text-primary',
            'placeholder:text-text-muted',
            'transition-all duration-default ease-swift',
            
            // Focus state
            'focus:outline-none focus:border-border-strong focus-ring',
            
            // Error state
            {
              'border-danger focus:border-danger': error,
            },
            
            // Disabled state
            'disabled:bg-node-cookie disabled:text-text-muted disabled:cursor-not-allowed',
            
            className
          )}
          {...props}
        />
        
        {error && (
          <p className="mt-1 text-small text-danger">{error}</p>
        )}
        
        {helperText && !error && (
          <p className="mt-1 text-small text-text-muted">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
