import React from 'react';
import { Notification } from './utils/cotizadorTypes';

interface NotificationPopupProps {
  notification: Notification;
  setNotification: (notification: Notification) => void;
}

export const NotificationPopup: React.FC<NotificationPopupProps> = ({ 
  notification, 
  setNotification 
}) => {
  if (!notification.show) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg shadow-lg max-w-xs">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="font-bold">{notification.message}</p>
            {notification.details && (
              <button
                onClick={() => {
                  // Here you could show more details in a modal or expand the notification
                  console.log("Details:", notification.details);
                }}
                className="mt-2 text-green-600 hover:text-green-800 text-sm font-medium"
              >
                Ver detalles →
              </button>
            )}
          </div>
          <button
            onClick={() => setNotification({ ...notification, show: false })}
            className="ml-4 text-green-600 hover:text-green-800"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};