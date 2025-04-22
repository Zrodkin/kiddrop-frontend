import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEnvelope, // Default icon for unread
    faEnvelopeOpen, // Icon when read (optional)
    faCircle, // Simple badge dot
    faExclamationTriangle, // Emergency
    faInfoCircle, // General
    faSmile, // Friendly
    faExternalLinkAlt, // External Link
    faTimes, // Close modal
    faSpinner, // Loading indicator
    faCheckDouble // Mark all read icon
} from '@fortawesome/free-solid-svg-icons';

// Helper function to format date (customize as needed)
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        // Example: "Apr 22, 2025, 2:51 AM" - Adjust format as desired
        return new Intl.DateTimeFormat('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(new Date(dateString));
    } catch (e) {
        console.error("Error formatting date:", e);
        return dateString; // Fallback to original string
    }
};

// Helper function for alert styling
const getAlertStyle = (alertType) => {
    switch (alertType?.toLowerCase()) {
        case 'emergency':
            return {
                borderColor: 'border-red-500',
                bgColor: 'bg-red-50',
                icon: faExclamationTriangle,
                iconColor: 'text-red-600',
                hoverBg: 'hover:bg-red-100'
            };
        case 'general':
            return {
                borderColor: 'border-blue-500',
                bgColor: 'bg-blue-50',
                icon: faInfoCircle,
                iconColor: 'text-blue-600',
                hoverBg: 'hover:bg-blue-100'
            };
        case 'friendly':
            return {
                borderColor: 'border-green-500',
                bgColor: 'bg-green-50',
                icon: faSmile,
                iconColor: 'text-green-600',
                hoverBg: 'hover:bg-green-100'
            };
        default:
            return {
                borderColor: 'border-gray-300',
                bgColor: 'bg-gray-50',
                icon: faEnvelope, // Default general icon if type is unknown
                iconColor: 'text-gray-600',
                hoverBg: 'hover:bg-gray-100'
            };
    }
};

function ParentInbox() {
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false); // For Mark All Read button

    const API_BASE_URL = '/api/parent/notifications'; // Configure if needed

    // Fetch notifications on component mount
    const fetchNotifications = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(API_BASE_URL, {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem("token")}`
  }
});
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
             // Sort by date, newest first
            const sortedData = data.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
            setNotifications(sortedData || []);
        } catch (e) {
            console.error("Failed to fetch notifications:", e);
            setError("Failed to load notifications. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    }, [API_BASE_URL]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]); // Depend on the memoized fetch function

    // Mark a single notification as read
    const markAsRead = useCallback(async (notificationId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/${notificationId}/read`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    // Add Authentication headers if required
                    // 'Authorization': 'Bearer YOUR_TOKEN_HERE'
                },
                // Body might not be needed if the endpoint just uses the ID
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Update local state immediately for better UX
            setNotifications(prevNotifications =>
                prevNotifications.map(notif =>
                    notif._id === notificationId ? { ...notif, read: true } : notif
                )
            );

            // Also update the selected notification if it's the one being viewed
             setSelectedNotification(prevSelected =>
                prevSelected?._id === notificationId ? { ...prevSelected, read: true } : prevSelected
            );

        } catch (e) {
            console.error(`Failed to mark notification ${notificationId} as read:`, e);
            // Optionally show an error to the user
        }
    }, [API_BASE_URL]);

    // Handle clicking a notification card/row
    const handleNotificationClick = (notification) => {
        setSelectedNotification(notification);
        // Mark as read only if it's currently unread
        if (!notification.read) {
            markAsRead(notification._id);
        }
    };

    // Close the modal
    const closeModal = () => {
        setSelectedNotification(null);
    };

    // Mark all unread notifications as read
    const handleMarkAllRead = async () => {
        const unreadNotifications = notifications.filter(n => !n.read);
        if (unreadNotifications.length === 0) return; // Nothing to do

        setIsUpdating(true);
        setError(null); // Clear previous errors

        const promises = unreadNotifications.map(n =>
             fetch(`${API_BASE_URL}/${n._id}/read`, {
                method: 'PATCH',
                 headers: { 'Content-Type': 'application/json' /* Add Auth if needed */ },
            })
        );

        try {
            const responses = await Promise.all(promises);

            // Check if all requests were successful
            const allSucceeded = responses.every(res => res.ok);

            if (allSucceeded) {
                // Update local state if all API calls succeed
                 setNotifications(prevNotifications =>
                    prevNotifications.map(n => ({ ...n, read: true }))
                );
            } else {
                 // Find which ones failed (optional: more granular error handling)
                 responses.forEach((res, index) => {
                    if(!res.ok) {
                        console.error(`Failed to mark notification ${unreadNotifications[index]._id} as read. Status: ${res.status}`);
                    }
                 });
                throw new Error("Some notifications could not be marked as read.");
            }
        } catch (e) {
            console.error("Failed to mark all notifications as read:", e);
             setError("Failed to mark all as read. Please try again.");
             // Optional: Re-fetch data to ensure consistency, or rely on individual marking
             // fetchNotifications();
        } finally {
            setIsUpdating(false);
        }
    };

    // Calculate unread count for the badge/button state
    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto font-sans">
            <div className="flex justify-between items-center mb-4 md:mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Notifications</h1>
                {notifications.length > 0 && (
                     <button
                        onClick={handleMarkAllRead}
                        disabled={isUpdating || unreadCount === 0}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center transition-colors duration-150 ease-in-out ${
                            isUpdating
                                ? 'bg-gray-300 text-gray-500 cursor-wait'
                                : unreadCount > 0
                                    ? 'bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        {isUpdating ? (
                            <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                        ) : (
                             <FontAwesomeIcon icon={faCheckDouble} className="mr-2" />
                        )}
                        Mark All as Read {unreadCount > 0 ? `(${unreadCount})` : ''}
                    </button>
                )}
            </div>

            {isLoading && (
                <div className="text-center py-10">
                    <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-blue-500" />
                    <p className="mt-2 text-gray-600">Loading notifications...</p>
                </div>
            )}

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Error:</strong>
                    <span className="block sm:inline ml-2">{error}</span>
                </div>
            )}

            {!isLoading && !error && notifications.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                    You have no notifications yet.
                </div>
            )}

            {!isLoading && !error && notifications.length > 0 && (
                <div className="space-y-3">
                    {notifications.map((notification) => {
                        const { _id, subject, messageBody, link, read, alertType, sentAt } = notification;
                        const styles = getAlertStyle(alertType);
                        const preview = messageBody?.substring(0, 100) + (messageBody?.length > 100 ? '...' : '');

                        return (
                            <div
                                key={_id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`flex items-start p-3 md:p-4 border-l-4 rounded-r-md shadow-sm cursor-pointer transition-colors duration-150 ease-in-out ${styles.borderColor} ${styles.bgColor} ${styles.hoverBg} ${read ? 'opacity-70' : ''}`}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleNotificationClick(notification)}} // Accessibility
                            >
                                {/* Icon Column */}
                                <div className={`flex-shrink-0 w-8 text-center mt-1 ${read ? 'text-gray-400' : styles.iconColor}`}>
                                    <FontAwesomeIcon icon={styles.icon} size="lg" />
                                     {/* Optional: Different icon for read */}
                                     {/* <FontAwesomeIcon icon={read ? faEnvelopeOpen : styles.icon} size="lg" /> */}
                                </div>

                                {/* Content Column */}
                                <div className="flex-grow ml-3 overflow-hidden">
                                    <div className="flex justify-between items-center mb-1">
                                        <h3 className={`text-base md:text-lg ${read ? 'font-normal text-gray-700' : 'font-semibold text-gray-900'}`}>
                                             {/* Unread Badge (simple dot) */}
                                            {!read && (
                                                <FontAwesomeIcon icon={faCircle} className={`text-xs mr-2 ${styles.iconColor}`} title="Unread"/>
                                            )}
                                            {subject || 'No Subject'}
                                        </h3>
                                        <span className="text-xs md:text-sm text-gray-500 flex-shrink-0 ml-2 whitespace-nowrap">
                                            {formatDate(sentAt)}
                                        </span>
                                    </div>
                                    <p className={`text-sm ${read ? 'text-gray-600' : 'text-gray-700'} mb-1`}>
                                        {preview}
                                    </p>
                                     {link && (
                                         <div className="text-xs text-blue-600 hover:text-blue-800 inline-flex items-center">
                                             <FontAwesomeIcon icon={faExternalLinkAlt} className="mr-1" />
                                             <span>Details Available</span> {/* Indication, link shown in modal */}
                                         </div>
                                     )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal for Full Notification */}
            {selectedNotification && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center p-4 z-50"
                    onClick={closeModal} // Close modal on backdrop click
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="notification-subject"
                    aria-describedby="notification-body"
                >
                    <div
                        className="bg-white rounded-lg shadow-xl p-5 md:p-6 max-w-lg w-full relative max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
                    >
                        <button
                            onClick={closeModal}
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl leading-none"
                            aria-label="Close notification details"
                        >
                             <FontAwesomeIcon icon={faTimes} />
                        </button>

                        <h2 id="notification-subject" className="text-xl md:text-2xl font-semibold mb-3 text-gray-800">
                             {/* Show icon in modal title too */}
                             <FontAwesomeIcon icon={getAlertStyle(selectedNotification.alertType).icon} className={`mr-2 ${getAlertStyle(selectedNotification.alertType).iconColor}`} />
                            {selectedNotification.subject || 'Notification Details'}
                        </h2>

                        <p className="text-sm text-gray-500 mb-4">
                            Sent: {formatDate(selectedNotification.sentAt)}
                        </p>

                        <div id="notification-body" className="text-base text-gray-700 mb-5 prose max-w-none">
                           {/* Use whitespace-pre-wrap to preserve formatting like newlines */}
                           <p className="whitespace-pre-wrap">{selectedNotification.messageBody}</p>
                        </div>

                        {selectedNotification.link && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <a
                                    href={selectedNotification.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                                >
                                    View More
                                    <FontAwesomeIcon icon={faExternalLinkAlt} className="ml-2" />
                                </a>
                            </div>
                        )}

                        <div className="mt-5 text-right">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ParentInbox;