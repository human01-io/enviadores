import React, { useEffect } from 'react';
import { Notification } from './utils/cotizadorTypes';

interface NotificationPopupProps {
  notification: Notification;
  setNotification: (notification: Notification) => void;
}

export const NotificationPopup: React.FC<NotificationPopupProps> = ({ 
  notification, 
  setNotification 
}) => {
  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ ...notification, show: false });
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [notification, setNotification]);

  if (!notification.show) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-fade-in-right">
      <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg shadow-lg">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="font-bold">{notification.message}</p>
            </div>
            {notification.details && (
              <div className="mt-2 pl-7">
                <button
                  onClick={() => {
                    // Here you could show more details in a modal or expand the notification
                    console.log("Details:", notification.details);
                  }}
                  className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center"
                >
                  Ver detalles
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => setNotification({ ...notification, show: false })}
            className="ml-4 text-green-600 hover:text-green-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};