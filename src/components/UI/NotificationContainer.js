import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeNotification } from '../../store/slices/uiSlice';
import { X, CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';
import './NotificationContainer.css';

const NotificationContainer = () => {
  const dispatch = useDispatch();
  const notifications = useSelector(state => state.ui.notifications);

  const handleRemove = (id) => {
    dispatch(removeNotification(id));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <XCircle size={20} />;
      case 'warning':
        return <AlertCircle size={20} />;
      default:
        return <Info size={20} />;
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="notification-container">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`notification ${notification.type || 'info'}`}
        >
          <div className="notification-content">
            <div className="notification-icon">
              {getIcon(notification.type)}
            </div>
            <div className="notification-text">
              <h4 className="notification-title">{notification.title}</h4>
              {notification.message && (
                <p className="notification-message">{notification.message}</p>
              )}
            </div>
          </div>
          <button
            className="notification-close"
            onClick={() => handleRemove(notification.id)}
            aria-label="Close notification"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationContainer;

