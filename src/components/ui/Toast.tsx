import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  onClose: (id: string) => void;
  autoClose?: boolean;
  autoCloseTime?: number;
}

interface ToastContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  autoClose?: boolean;
  autoCloseTime?: number;
  hideProgressBar?: boolean;
  closeOnClick?: boolean;
  pauseOnHover?: boolean;
  draggable?: boolean;
}

const Toast: React.FC<ToastProps> = ({ 
  id, 
  type, 
  message, 
  onClose, 
  autoClose = true, 
  autoCloseTime = 5000 
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Colors and icons based on toast type
  const typeConfig = {
    success: {
      bgColor: 'bg-green-100',
      borderColor: 'border-green-500',
      textColor: 'text-green-800',
      icon: <CheckCircle className="w-5 h-5 text-green-500" />
    },
    error: {
      bgColor: 'bg-red-100',
      borderColor: 'border-red-500',
      textColor: 'text-red-800',
      icon: <AlertCircle className="w-5 h-5 text-red-500" />
    },
    info: {
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-800',
      icon: <Info className="w-5 h-5 text-blue-500" />
    },
    warning: {
      bgColor: 'bg-yellow-100',
      borderColor: 'border-yellow-500',
      textColor: 'text-yellow-800',
      icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />
    }
  };

  useEffect(() => {
    if (autoClose && !isPaused && !isDragging) {
      const startTime = Date.now();
      const endTime = startTime + autoCloseTime;
      
      const timer = setInterval(() => {
        const now = Date.now();
        const remainingTime = endTime - now;
        const newProgress = (remainingTime / autoCloseTime) * 100;
        
        if (newProgress <= 0) {
          clearInterval(timer);
          onClose(id);
        } else {
          setProgress(newProgress);
        }
      }, 100);
      
      setIntervalId(timer);
      
      return () => {
        if (timer) clearInterval(timer);
      };
    } else if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  }, [autoClose, isPaused, isDragging, id, onClose, autoCloseTime]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const { bgColor, borderColor, textColor, icon } = typeConfig[type];

  return (
    <div
      className={`${bgColor} border-l-4 ${borderColor} p-4 mb-3 rounded-md shadow-md flex items-start transition-all duration-300 ease-in-out max-w-md transform hover:scale-[1.02]`}
      style={
        isDragging 
          ? { transform: `translate(${position.x}px, ${position.y}px)`, cursor: 'grabbing' }
          : {}
      }
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      role="alert"
    >
      <div className="flex-shrink-0 mr-3">
        {icon}
      </div>
      <div className="flex-grow">
        <p className={`${textColor} font-medium`}>{message}</p>
        {autoClose && (
          <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
            <div
              className={`h-1 rounded-full ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : type === 'info' ? 'bg-blue-500' : 'bg-yellow-500'}`}
              style={{ width: `${progress}%`, transition: 'width 0.1s linear' }}
            ></div>
          </div>
        )}
      </div>
      <button
        className="ml-3 text-gray-400 hover:text-gray-500 focus:outline-none"
        onClick={() => onClose(id)}
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// ToastContainer component
const ToastContainer: React.FC<ToastContainerProps> = ({
  position = 'bottom-right',
  autoClose = true,
  autoCloseTime = 5000,
  hideProgressBar = false,
  closeOnClick = true,
  pauseOnHover = true,
  draggable = true
}) => {
  const [toasts, setToasts] = useState<Array<{
    id: string;
    type: ToastType;
    message: string;
  }>>([]);

  const positionClasses = {
    'top-right': 'top-0 right-0',
    'top-left': 'top-0 left-0',
    'bottom-right': 'bottom-0 right-0',
    'bottom-left': 'bottom-0 left-0'
  };

  const removeToast = (id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    // Add a global toast function
    (window as any).toast = {
      success: (message: string) => {
        setToasts(prev => [...prev, { id: Date.now().toString(), type: 'success', message }]);
      },
      error: (message: string) => {
        setToasts(prev => [...prev, { id: Date.now().toString(), type: 'error', message }]);
      },
      info: (message: string) => {
        setToasts(prev => [...prev, { id: Date.now().toString(), type: 'info', message }]);
      },
      warning: (message: string) => {
        setToasts(prev => [...prev, { id: Date.now().toString(), type: 'warning', message }]);
      }
    };

    return () => {
      delete (window as any).toast;
    };
  }, []);

  return (
    <div className={`fixed p-4 z-50 ${positionClasses[position]}`}>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          message={toast.message}
          onClose={removeToast}
          autoClose={autoClose}
          autoCloseTime={autoCloseTime}
        />
      ))}
    </div>
  );
};

// Export
export { ToastContainer, Toast };
export const toast = {
  success: (message: string) => {
    if ((window as any).toast) {
      (window as any).toast.success(message);
    }
  },
  error: (message: string) => {
    if ((window as any).toast) {
      (window as any).toast.error(message);
    }
  },
  info: (message: string) => {
    if ((window as any).toast) {
      (window as any).toast.info(message);
    }
  },
  warning: (message: string) => {
    if ((window as any).toast) {
      (window as any).toast.warning(message);
    }
  }
};