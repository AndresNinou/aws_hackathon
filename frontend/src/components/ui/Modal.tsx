import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '~/utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Scrim */}
      <div
        className="absolute inset-0 bg-scrim transition-opacity duration-overlay ease-swift"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div
        className={cn(
          'relative w-full bg-bg-elevated border border-border-subtle rounded-modal shadow-level-2',
          'animate-fade-in transition-all duration-overlay ease-swift',
          sizeClasses[size]
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-border-subtle">
            <h2 className="text-h3 font-semibold text-text-primary">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-button text-text-muted hover:text-text-primary hover:bg-selection transition-colors duration-micro"
            >
              <X size={20} />
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
