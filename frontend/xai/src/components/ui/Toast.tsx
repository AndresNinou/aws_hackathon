import React from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

export const ReversorToaster = () => (
  <Toaster
    position="top-right"
    gutter={8}
    toastOptions={{
      duration: 4000,
      style: {
        background: '#232830', // bg-elevated
        color: '#E9EEF9', // text-primary
        border: '1px solid #2B2F36', // border-subtle
        borderRadius: '16px', // rounded-card
        padding: '16px',
        boxShadow: '0 6px 24px rgba(0,0,0,0.45)', // shadow-level-2
        fontSize: '14px',
        lineHeight: '20px',
      },
      success: {
        style: {
          borderLeft: '4px solid #17E9C2', // Electric Teal
        },
        iconTheme: {
          primary: '#17E9C2',
          secondary: '#232830',
        },
      },
      error: {
        style: {
          borderLeft: '4px solid #FF5A5A', // Scarlet
        },
        iconTheme: {
          primary: '#FF5A5A',
          secondary: '#232830',
        },
      },
    }}
  />
);

// Custom toast functions with Reversor Theme styling
export const reversorToast = {
  success: (message: string) => 
    toast.success(message, {
      icon: <CheckCircle size={20} />,
    }),
    
  error: (message: string, code?: string) => 
    toast.error(
      <div>
        <div>{message}</div>
        {code && (
          <code className="mt-2 block font-mono text-code-sm text-text-muted bg-bg-base px-2 py-1 rounded">
            {code}
          </code>
        )}
      </div>,
      {
        icon: <XCircle size={20} />,
        duration: 6000, // Longer for errors
      }
    ),
    
  info: (message: string) =>
    toast(message, {
      icon: <Info size={20} color="#4DB1FF" />,
    }),
    
  warning: (message: string) =>
    toast(message, {
      icon: <AlertCircle size={20} color="#FFB020" />,
    }),
    
  promise: <T,>(
    promise: Promise<T>,
    msgs: {
      loading: string;
      success: string;
      error: string;
    }
  ) => toast.promise(promise, msgs),
};
