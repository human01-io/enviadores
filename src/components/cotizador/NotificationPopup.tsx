import React, { useEffect } from 'react';
import { Notification } from './utils/cotizadorTypes';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Info, X, AlertTriangle, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardFooter } from '../ui/CardComponent';

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

  // Animation variants
  const notificationVariants = {
    hidden: { opacity: 0, x: 100 },
    visible: { opacity: 1, x: 0, transition: { type: 'spring', damping: 15 } },
    exit: { opacity: 0, x: 100, transition: { ease: 'easeOut', duration: 0.3 } }
  };

  // Determine notification type/color
  const getNotificationStyle = () => {
    if (notification.message.toLowerCase().includes('error') || 
        notification.message.toLowerCase().includes('problema')) {
      return {
        icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
        bgColor: 'bg-red-100',
        borderColor: 'border-red-500',
        textColor: 'text-red-700'
      };
    } else if (notification.message.toLowerCase().includes('advertencia') || 
              notification.message.toLowerCase().includes('atención')) {
      return {
        icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
        bgColor: 'bg-yellow-100',
        borderColor: 'border-yellow-500',
        textColor: 'text-yellow-700'
      };
    } else {
      return {
        icon: <Check className="h-5 w-5 text-green-500" />,
        bgColor: 'bg-green-100',
        borderColor: 'border-green-500',
        textColor: 'text-green-700'
      };
    }
  };

  const style = getNotificationStyle();

  return (
    <AnimatePresence>
      <motion.div
        className="fixed top-4 right-4 z-50 max-w-md"
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={notificationVariants}
      >
        <Card className={`${style.bgColor} border-l-4 ${style.borderColor} shadow-lg`}>
          <CardContent className="p-4">
            <div className="flex">
              <div className="flex-shrink-0 mr-3">
                {style.icon}
              </div>
              <div className="flex-1">
                <h3 className={`font-bold ${style.textColor}`}>{notification.message}</h3>
                {notification.details && (
                  <p className="text-sm mt-1">{notification.details}</p>
                )}
              </div>
              <button
                onClick={() => setNotification({ ...notification, show: false })}
                className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </CardContent>
          {notification.details && (
            <CardFooter className="bg-white bg-opacity-40 px-4 py-2 flex justify-end border-t border-gray-200">
              <Button 
                variant="ghost" 
                size="sm"
                className={`text-xs ${style.textColor}`}
                onClick={() => {
                  // Here you could expand to show more details
                  console.log("More details:", notification.details);
                }}
              >
                Ver detalles
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </CardFooter>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};