import { useEffect } from 'react';
import { X } from 'lucide-react';

interface NotificationProps {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose: (id: string) => void;
}

export function Notification({ id, message, type = 'success', onClose }: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [id, onClose]);

  const getBorderColor = () => {
    switch (type) {
      case 'success': return 'border-l-green-500';
      case 'error': return 'border-l-red-500';
      case 'warning': return 'border-l-orange-500';
      case 'info': return 'border-l-blue-500';
      default: return 'border-l-blue-500';
    }
  };

  return (
    <div className={`notification bg-card border border-border p-4 rounded-lg shadow-lg max-w-sm border-l-4 ${getBorderColor()}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">{message}</p>
        <button 
          onClick={() => onClose(id)}
          className="text-muted-foreground hover:text-foreground"
          data-testid={`button-close-notification-${id}`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
