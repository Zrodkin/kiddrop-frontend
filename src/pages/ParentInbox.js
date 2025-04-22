import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEnvelope, faCircle, faExclamationTriangle, faInfoCircle, faSmile,
  faExternalLinkAlt, faTimes, faSpinner, faCheckDouble, faTrashAlt,
  faCalendarAlt, faUserTie, faCheck, faEnvelopeOpen, faInbox
} from '@fortawesome/free-solid-svg-icons';
import {
  format, isToday, isYesterday, isThisWeek, isThisMonth, parseISO
} from 'date-fns';

// --- Group notifications by date (Today, Yesterday, etc.) ---
const groupNotificationsByDate = (notifications) => {
  const groups = { Today: [], Yesterday: [], 'This Week': [], 'This Month': [], Earlier: [] };
  notifications.forEach(n => {
    try {
      const date = parseISO(n.sentAt);
      if (isToday(date)) groups.Today.push(n);
      else if (isYesterday(date)) groups.Yesterday.push(n);
      else if (isThisWeek(date, { weekStartsOn: 1 })) groups['This Week'].push(n);
      else if (isThisMonth(date)) groups['This Month'].push(n);
      else groups.Earlier.push(n);
    } catch (e) {
      console.error("Date parse error:", e);
      groups.Earlier.push(n);
    }
  });
  Object.keys(groups).forEach(key => { if (groups[key].length === 0) delete groups[key]; });
  return groups;
};

// --- Style mapping for different alert types ---
const getAlertStyle = (alertType) => {
  switch (alertType?.toLowerCase()) {
    case 'emergency': return { ribbonColor: 'bg-red-500', bgColor: 'bg-red-50', icon: faExclamationTriangle, iconColor: 'text-red-600', textColor: 'text-red-800', unreadRingColor: 'ring-red-300' };
    case 'general': return { ribbonColor: 'bg-blue-500', bgColor: 'bg-blue-50', icon: faInfoCircle, iconColor: 'text-blue-600', textColor: 'text-blue-800', unreadRingColor: 'ring-blue-300' };
    case 'friendly': return { ribbonColor: 'bg-green-500', bgColor: 'bg-green-50', icon: faSmile, iconColor: 'text-green-600', textColor: 'text-green-800', unreadRingColor: 'ring-green-300' };
    default: return { ribbonColor: 'bg-gray-400', bgColor: 'bg-gray-50', icon: faEnvelope, iconColor: 'text-gray-500', textColor: 'text-gray-700', unreadRingColor: 'ring-gray-300' };
  }
};
function ParentInbox() {
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [isDeletingAll, setIsDeletingAll] = useState(false);
    const [updatingReadId, setUpdatingReadId] = useState(null);
  
    const API_BASE_URL = process.env.REACT_APP_API_URL
      ? `${process.env.REACT_APP_API_URL}/api/parent/notifications`
      : '/api/parent/notifications';
  
    const authenticatedFetch = useCallback(async (url, options = {}) => {
      const token = localStorage.getItem("token");
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(url, { ...options, headers });
      if (!response.ok) {
        let errorBody = null;
        try { errorBody = await response.json(); } catch (e) {}
        const errorMessage = errorBody?.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      if (response.status === 204 || response.headers.get('Content-Length') === '0') {
        return { success: true };
      }
      return response.json();
    }, []);
  
    const fetchNotifications = useCallback(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await authenticatedFetch(API_BASE_URL);
        const sortedData = (data || [])
          .filter(n => n.sentAt)
          .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
        setNotifications(sortedData);
      } catch (e) {
        console.error("Failed to fetch notifications:", e);
        setError(`Failed to load notifications: ${e.message}. Please try again later.`);
      } finally {
        setIsLoading(false);
      }
    }, [API_BASE_URL, authenticatedFetch]);
  
    useEffect(() => {
      fetchNotifications();
    }, [fetchNotifications]);
  
    const handleToggleRead = useCallback(async (event, notification) => {
      event.stopPropagation();
      if (updatingReadId || deletingId) return;
      setUpdatingReadId(notification._id);
      setError(null);
      const newReadStatus = !notification.read;
      const url = `${API_BASE_URL}/${notification._id}/read`;
const body = JSON.stringify({ read: newReadStatus });

  
      try {
        await authenticatedFetch(url, { method: 'PATCH' });
        setNotifications(prev => prev.map(n =>
          n._id === notification._id ? { ...n, read: newReadStatus } : n
        ));
        if (selectedNotification?._id === notification._id) {
          setSelectedNotification(prev => ({ ...prev, read: newReadStatus }));
        }
      } catch (e) {
        console.error(`Failed to update read status:`, e);
        setError(`Error updating status: ${e.message}`);
      } finally {
        setUpdatingReadId(null);
      }
    }, [API_BASE_URL, authenticatedFetch, updatingReadId, deletingId, selectedNotification?._id]);
  
    const handleDeleteNotification = useCallback(async (event, notificationId) => {
      event.stopPropagation();
      if (updatingReadId) return;
      if (!window.confirm("Are you sure you want to delete this notification?")) return;
      setDeletingId(notificationId);
      setError(null);
      try {
        await authenticatedFetch(`${API_BASE_URL}/${notificationId}`, { method: 'DELETE' });
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
        if (selectedNotification?._id === notificationId) {
          setSelectedNotification(null);
        }
      } catch (e) {
        console.error(`Failed to delete notification ${notificationId}:`, e);
        setError(`Failed to delete notification: ${e.message}`);
      } finally {
        setDeletingId(null);
      }
    }, [API_BASE_URL, authenticatedFetch, selectedNotification?._id, updatingReadId]);
  
    const handleNotificationClick = (notification) => {
      if (deletingId === notification._id || updatingReadId === notification._id) return;
      setSelectedNotification(notification);
      if (!notification.read && updatingReadId !== notification._id) {
        const markReadInline = async () => {
          setUpdatingReadId(notification._id);
          try {
            await authenticatedFetch(`${API_BASE_URL}/${notification._id}/read`, { method: 'PATCH' });
            setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, read: true } : n));
            setSelectedNotification(prev => prev ? { ...prev, read: true } : null);
          } catch (e) {
            console.error(`Failed to mark as read:`, e);
          } finally {
            setUpdatingReadId(null);
          }
        };
        markReadInline();
      }
    };
  
    const closeModal = () => setSelectedNotification(null);
    const handleMarkAllRead = async () => {
        const unreadNotifications = notifications.filter(n => !n.read);
        if (unreadNotifications.length === 0 || isUpdating || isDeletingAll) return;
        setIsUpdating(true);
        setError(null);
        const promises = unreadNotifications.map(n =>
          authenticatedFetch(`${API_BASE_URL}/${n._id}/read`, { method: 'PATCH' })
            .catch(e => ({ error: true, id: n._id, message: e.message }))
        );
        try {
          const results = await Promise.all(promises);
          const failures = results.filter(res => res?.error);
          if (failures.length === 0) {
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
          } else {
            failures.forEach(fail => console.error(`Failed to mark ${fail.id} as read: ${fail.message}`));
            setError(`Could not mark all as read (${failures.length} failed).`);
            fetchNotifications();
          }
        } catch (e) {
          console.error("Mark all read error:", e);
          setError("An unexpected error occurred while marking all as read.");
        } finally {
          setIsUpdating(false);
        }
      };
    
      const handleDeleteAllNotifications = async () => {
        if (notifications.length === 0 || isDeletingAll || isUpdating) return;
        if (!window.confirm("DANGER: Delete ALL notifications? This cannot be undone.")) return;
        setIsDeletingAll(true);
        setError(null);
        const ids = notifications.map(n => n._id);
        const promises = ids.map(id =>
          authenticatedFetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' })
            .catch(e => ({ error: true, id, message: e.message }))
        );
        try {
          const results = await Promise.all(promises);
          const failures = results.filter(res => res?.error);
          if (failures.length === 0) {
            setNotifications([]);
            setSelectedNotification(null);
          } else {
            failures.forEach(fail => console.error(`Failed to delete ${fail.id}: ${fail.message}`));
            setError(`Could not delete all (${failures.length} failed). Some remain.`);
            fetchNotifications();
          }
        } catch (e) {
          console.error("Delete all error:", e);
          setError("An unexpected error occurred while deleting all.");
        } finally {
          setIsDeletingAll(false);
        }
      };
    
      const groupedNotifications = useMemo(() => groupNotificationsByDate(notifications), [notifications]);
      const totalCount = notifications.length;
      const unreadCount = notifications.filter(n => !n.read).length;
    
      return (
        <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto font-sans bg-gradient-to-br from-sky-50 via-white to-blue-50 min-h-screen">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-6 pb-4 border-b border-gray-300">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-sky-800">Inbox</h1>
            {totalCount > 0 && (
              <div className="flex gap-2 flex-wrap justify-center sm:justify-end">
                <button
                  onClick={handleMarkAllRead}
                  disabled={isUpdating || unreadCount === 0 || isDeletingAll || updatingReadId}
                  className="px-3 py-1.5 text-sm font-semibold rounded-md flex items-center bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
                >
                  {isUpdating
                    ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                    : <FontAwesomeIcon icon={faCheckDouble} className="mr-2 text-blue-500" />}
                  Mark All Read {unreadCount > 0 ? `(${unreadCount})` : ''}
                </button>
                <button
                  onClick={handleDeleteAllNotifications}
                  disabled={isDeletingAll || totalCount === 0 || isUpdating || updatingReadId}
                  className="px-3 py-1.5 text-sm font-semibold rounded-md flex items-center bg-white border border-gray-300 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition disabled:opacity-50"
                >
                  {isDeletingAll
                    ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                    : <FontAwesomeIcon icon={faTrashAlt} className="mr-2 text-red-500" />}
                  Delete All ({totalCount})
                </button>
              </div>
            )}
          </div>
    
          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <FontAwesomeIcon icon={faSpinner} spin size="3x" className="text-sky-500" />
              <p className="mt-3 text-gray-600">Loading Inbox...</p>
            </div>
          )}
    
          {/* Error Display */}
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6 shadow-sm" role="alert">
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
          )}
    
          {/* Empty State */}
          {!isLoading && !error && totalCount === 0 && (
            <div className="text-center py-16 px-6 text-gray-600">
              <FontAwesomeIcon icon={faInbox} size="4x" className="text-blue-300 mb-6" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">All Clear!</h2>
              <p className="text-gray-500">You have no new notifications. ✨</p>
            </div>
          )}
      {/* Notification Groups */}
      {!isLoading && totalCount > 0 && (
        <div className="space-y-8">
          {Object.entries(groupedNotifications).map(([groupTitle, groupNotifications]) => (
            <section key={groupTitle}>
              <div className="flex items-center mb-3">
                <h2 className="text-sm font-semibold uppercase text-gray-500 pr-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faCalendarAlt} />
                  {groupTitle}
                </h2>
                <hr className="flex-grow border-gray-200" />
              </div>

              <div className="space-y-4">
                {groupNotifications.map(notification => {
                  const { _id, subject, messageBody, link, read, alertType, sentAt, senderName } = notification;
                  const styles = getAlertStyle(alertType);
                  const isBeingDeleted = deletingId === _id;
                  const isBeingUpdated = updatingReadId === _id;
                  const isDisabled = isBeingDeleted || isBeingUpdated;

                  return (
                    <div
                      key={_id}
                      onClick={() => !isDisabled && handleNotificationClick(notification)}
                      className={`group relative flex overflow-hidden rounded-xl shadow-md border border-gray-200 bg-white transition-all duration-200 ease-in-out ${isDisabled ? 'opacity-60 cursor-wait' : 'cursor-pointer hover:shadow-lg hover:scale-[1.01]'} ${!read && !isDisabled ? `ring-1 ${styles.unreadRingColor} ring-offset-1` : ''}`}
                      role="button"
                      tabIndex={isDisabled ? -1 : 0}
                      onKeyDown={(e) => {
                        if (!isDisabled && (e.key === 'Enter' || e.key === ' ')) handleNotificationClick(notification);
                      }}
                    >
                      <div className={`w-2 flex-shrink-0 ${styles.ribbonColor}`}></div>
                      <div className={`relative flex-grow p-4 flex flex-col sm:flex-row items-start gap-3 ${styles.bgColor} hover:bg-opacity-95 transition-colors duration-150`}>
                        <div className={`flex-shrink-0 w-7 h-7 mt-1 rounded-full flex items-center justify-center ${read ? styles.ribbonColor + ' opacity-40' : styles.ribbonColor}`}>
                          <FontAwesomeIcon icon={styles.icon} className="text-white text-sm" />
                        </div>
                        <div className="flex-grow min-w-0 flex flex-col">
                          <div className="flex justify-between items-start mb-1 gap-x-2">
                            <h3 className={`text-base md:text-lg font-semibold flex-grow truncate pr-10 ${read ? 'text-gray-700' : styles.textColor}`}>
                              {subject || 'No Subject'}
                            </h3>
                          </div>

                          {senderName && (
                            <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                              <FontAwesomeIcon icon={faUserTie} /> From: {senderName}
                            </p>
                          )}

                          <p className={`text-sm flex-grow ${read ? 'text-gray-600' : 'text-gray-700'} line-clamp-2 mb-2`}>
                            {messageBody}
                          </p>

                          <div className="flex justify-between items-end mt-auto pt-1">
                            {link && (
                              <div className="text-xs text-blue-600 inline-flex items-center gap-1">
                                <FontAwesomeIcon icon={faExternalLinkAlt} /> Details
                              </div>
                            )}
                            <span className="text-xs text-gray-500 flex-shrink-0 whitespace-nowrap ml-auto pl-2">
                              {format(parseISO(sentAt), 'MMM d, p')}
                            </span>
                          </div>
                        </div>

                        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 ease-in-out z-10">
                          <button
                            onClick={(e) => handleToggleRead(e, notification)}
                            disabled={isDisabled}
                            title={read ? 'Mark as Unread' : 'Mark as Read'}
                            className={`p-1.5 rounded-full text-gray-500 bg-white/70 backdrop-blur-sm hover:bg-gray-200 hover:text-gray-700 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-blue-500 disabled:opacity-50`}
                          >
                            {isBeingUpdated
                              ? <FontAwesomeIcon icon={faSpinner} spin className="w-4 h-4" />
                              : <FontAwesomeIcon icon={read ? faEnvelopeOpen : faCheck} className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={(e) => handleDeleteNotification(e, _id)}
                            disabled={isDisabled}
                            title="Delete Notification"
                            className={`p-1.5 rounded-full text-gray-500 bg-white/70 backdrop-blur-sm hover:text-red-600 hover:bg-red-100 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-red-500 disabled:opacity-50`}
                          >
                            {isBeingDeleted
                              ? <FontAwesomeIcon icon={faSpinner} spin className="w-4 h-4" />
                              : <FontAwesomeIcon icon={faTrashAlt} className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center p-4 z-50" onClick={closeModal} role="dialog" aria-modal="true">
          <div className="bg-white rounded-xl shadow-xl p-6 md:p-7 max-w-lg w-full relative max-h-[85vh] overflow-y-auto flex flex-col" onClick={(e) => e.stopPropagation()}>
            <button onClick={closeModal} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700" aria-label="Close">
              <FontAwesomeIcon icon={faTimes} size="lg" />
            </button>
            <h2 className="text-xl md:text-2xl font-semibold mb-3 pr-8 text-gray-800 flex items-center gap-2">
              <FontAwesomeIcon icon={getAlertStyle(selectedNotification.alertType).icon} className={getAlertStyle(selectedNotification.alertType).iconColor} />
              {selectedNotification.subject || 'Notification Details'}
            </h2>
            <p className="text-sm text-gray-500 mb-1">
              Sent: {format(parseISO(selectedNotification.sentAt), 'PPpp')}
            </p>
            {selectedNotification.senderName && (
              <p className="text-sm text-gray-500 mb-4">From: {selectedNotification.senderName}</p>
            )}
            <div className="text-base text-gray-700 mb-5 whitespace-pre-line">
              {selectedNotification.messageBody}
            </div>
            {selectedNotification.link && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <a href={selectedNotification.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-2 font-medium">
                  View More <FontAwesomeIcon icon={faExternalLinkAlt} />
                </a>
              </div>
            )}
            <div className="mt-6 pt-4 border-t border-gray-200 text-right">
              <button onClick={closeModal} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ParentInbox;
      