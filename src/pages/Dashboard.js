import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCheckCircle, faSignOutAlt, faHourglassStart, faArrowDown,
    faArrowUp, faUserEdit, faSpinner, faExclamationCircle, faChild,
    faClock, faListAlt, faPalette, faPlus, faSchool, faClipboardList // Added faPalette, faPlus
} from '@fortawesome/free-solid-svg-icons';

function Dashboard() {
    const navigate = useNavigate();
    const [children, setChildren] = useState([]);
    const [message, setMessage] = useState(null); // { text: string, isSuccess: boolean } | null
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // Stores the studentId being acted upon
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    const showMessage = useCallback((text, isSuccess = true) => {
        setMessage({ text, isSuccess });
        const timer = setTimeout(() => setMessage(null), 4000); // Message disappears after 4 seconds
        return () => clearTimeout(timer); // Cleanup timer on unmount or if message changes
    }, []);

    const fetchChildren = useCallback(async () => {
        setIsLoading(true);
        // Don't clear message immediately, allow previous messages to be seen briefly
        // setMessage(null);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                // Optionally navigate to login if no token
                // navigate('/login');
                throw new Error("Authentication token not found. Please log in again.");
            }

            const res = await fetch(`${apiUrl}/api/parent/children`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                let errorMsg = `HTTP error! status: ${res.status}`;
                try {
                    const errorData = await res.json();
                    // Use message from API if available, otherwise provide status text or generic fallback
                    errorMsg = errorData.message || res.statusText || "An error occurred while fetching data.";
                } catch (jsonError) {
                    // If parsing JSON fails, use status text or generic fallback
                    errorMsg = res.statusText || "An unexpected error occurred."; // Improved fallback
                }
                throw new Error(errorMsg);
            }

            const data = await res.json();
            setChildren(data || []); // Ensure data is an array
        } catch (err) {
            console.error("Fetch children error:", err);
            showMessage(`❌ Error fetching children: ${err.message}`, false);
            // Clear children if fetch fails? Optional, depends on desired UX.
            // setChildren([]);
        } finally {
            setIsLoading(false);
        }
    }, [apiUrl, showMessage]); // Removed navigate from dependencies unless needed for auth redirect

    useEffect(() => {
        fetchChildren();
    }, [fetchChildren]);

    const handleAction = async (studentId, action) => {
        setActionLoading(studentId);
        setMessage(null); // Clear previous messages before new action
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Authentication token not found.");

            const res = await fetch(`${apiUrl}/api/log/${action}/${studentId}`, {
                method: "POST",
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                let errorMsg = `HTTP error! status: ${res.status}`;
                try {
                    const errorData = await res.json();
                    errorMsg = errorData.message || res.statusText || "An error occurred during the action.";
                } catch (jsonError) {
                    errorMsg = res.statusText || "An unexpected error occurred."; // Improved fallback
                }
                throw new Error(errorMsg);
            }

            const data = await res.json();

            // --- Reliability Note ---
            // Using client's time here. More reliable if the server response
            // included the actual timestamp of the log event.
            const now = new Date().toISOString();

            setChildren(prev =>
                prev.map(c =>
                    c._id === studentId
                        ? { ...c, status: data.newStatus, lastActivity: data.timestamp || now } // Use server timestamp if available
                        : c
                )
            );
            showMessage(`✅ ${action === "dropoff" ? "Dropped off" : "Picked up"} successfully!`, true);
        } catch (err) {
            console.error(`Error during ${action}:`, err);
            showMessage(`❌ Error during ${action}: ${err.message}`, false);
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case "checked-in":
                return { text: "Checked In", icon: faCheckCircle, style: "bg-emerald-500 text-white" };
            case "checked-out":
                return { text: "Checked Out", icon: faSignOutAlt, style: "bg-rose-500 text-white" };
            default:
                return { text: "Awaiting", icon: faHourglassStart, style: "bg-slate-400 text-white" };
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }); // Added hour12
        } catch (e) {
            console.error("Error formatting date:", e);
            return 'Invalid Date';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-tl from-purple-200 via-indigo-200 to-sky-200 py-8">
            {/* Message Area */}
            {message && (
                <div className="container mx-auto px-4 mb-6">
                    <div className="max-w-4xl mx-auto">
                        <div
                             // Added key for better React updates when message changes
                            key={message.text}
                            className={`p-4 border-l-4 rounded-md shadow-lg flex items-center animate-fade-in ${ // Added simple fade-in
                                message.isSuccess
                                    ? "bg-green-50 border-green-600 text-green-900"
                                    : "bg-red-50 border-red-600 text-red-900"
                            }`}
                            role="alert" // Added role for accessibility
                        >
                            <FontAwesomeIcon
                                icon={message.isSuccess ? faCheckCircle : faExclamationCircle}
                                className={`mr-3 flex-shrink-0 ${
                                    message.isSuccess ? "text-green-600" : "text-red-600"
                                }`}
                            />
                            <span className="font-medium">{message.text}</span>
                        </div>
                    </div>
                </div>
            )}

            <main className="container mx-auto px-4" >
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        {/* Dashboard Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
                            <div className="mb-4 sm:mb-0">
                                <h1 className="text-2xl font-bold flex items-center">
                                    <FontAwesomeIcon icon={faClipboardList} className="mr-3 opacity-80" /> {/* Used imported icon */}
                                    Your Dashboard
                                </h1>
                                <p className="text-blue-100 mt-1">
                                    Manage your children's check-in and check-out status.
                                </p>
                            </div>
                            <button
                                onClick={() => navigate("/add-child")}
                                className="w-full sm:w-auto px-4 py-2 bg-white text-indigo-600 rounded-lg shadow hover:bg-indigo-50 transition-colors duration-150 font-medium flex items-center justify-center"
                            >
                                <FontAwesomeIcon icon={faPlus} className="mr-2" /> {/* Used imported icon */}
                                Add Child
                            </button>
                        </div>

                        {/* Content Area: Loading, Empty, or Children List */}
                        {isLoading ? (
                            <div className="text-center py-20 px-6">
                                <FontAwesomeIcon icon={faSpinner} spin size="3x" className="text-indigo-500" />
                                <p className="mt-4 text-gray-600 text-xl">Loading student data...</p>
                            </div>
                        ) : children.length === 0 ? (
                            <div className="text-center py-20 px-6">
                                <FontAwesomeIcon icon={faChild} size="3x" className="text-gray-400 mb-4" />
                                <p className="text-gray-600 text-xl font-semibold">No children found.</p>
                                <p className="text-gray-500 mt-1 mb-4">
                                    Please add your first child to get started.
                                </p>
                                {/* Consistent Add Child Button Style */}
                                <button
                                    onClick={() => navigate("/add-child")}
                                    className="px-5 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-colors duration-150 font-medium flex items-center justify-center mx-auto"
                                >
                                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                                    Add Your First Child
                                </button>
                            </div>
                        ) : (
                            // Children Grid
                            <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50"> {/* Changed lg: to md: for earlier grid */}
                                {children
                                    .filter((child) => child.approvalStatus === "approved")
                                    .map((child) => {
                                        const statusInfo = getStatusInfo(child.status);
                                        const isCurrentActionLoading = actionLoading === child._id;
                                        const isDropoffAction = child.status !== "checked-in";
                                        const nextAction = isDropoffAction ? "dropoff" : "pickup";

                                        return (
                                            // Child Card
                                            <div
                                                key={child._id}
                                                className={`relative bg-white rounded-lg shadow-lg overflow-hidden transition duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-xl ${ // Slightly reduced hover shadow
                                                    isCurrentActionLoading ? "opacity-60 pointer-events-none" : "" // Prevent interaction while loading
                                                }`}
                                            >
                                                <div className="p-5 flex flex-col h-full"> {/* Ensure full height for flex items */}
                                                    {/* Card Header: Name, Grade, Edit */}
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <h3 className="text-xl font-bold text-indigo-800">{child.name}</h3>
                                                            <p className="text-sm text-gray-500">Grade {child.grade}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => navigate(`/edit-child/${child._id}`)}
                                                            className="text-gray-400 hover:text-indigo-600 transition duration-150 p-1 disabled:opacity-50"
                                                            disabled={isCurrentActionLoading}
                                                            title="Edit Child Info"
                                                        >
                                                            <FontAwesomeIcon icon={faUserEdit} size="lg" />
                                                        </button>
                                                    </div>

                                                    {/* Status and Time */}
                                                    <div className="flex items-center justify-between my-4 text-sm">
                                                        <span
                                                            className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full shadow-sm ${statusInfo.style}`}
                                                        >
                                                            <FontAwesomeIcon icon={statusInfo.icon} className="mr-1.5" />
                                                            {statusInfo.text}
                                                        </span>
                                                        <span className="text-gray-500 flex items-center">
                                                            <FontAwesomeIcon icon={faClock} className="mr-1.5 text-gray-400" />
                                                            Last Activity: {formatDateTime(child.lastActivity)}
                                                        </span>
                                                    </div>

                                                    {/* Action Button Area */}
                                                    <div className="mt-auto pt-4"> {/* Pushes button to bottom */}
                                                        <button
                                                            className={`w-full py-3 px-4 rounded-lg text-base font-semibold transition duration-150 ease-in-out flex items-center justify-center shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ${
                                                                isDropoffAction
                                                                    ? "bg-emerald-500 hover:bg-emerald-600 text-white focus:ring-emerald-500"
                                                                    : "bg-sky-500 hover:bg-sky-600 text-white focus:ring-sky-500"
                                                            }`}
                                                            onClick={() => handleAction(child._id, nextAction)}
                                                            // Simplified disable logic slightly, approval check is done by filter above
                                                            disabled={isCurrentActionLoading || (child.status === "awaiting" && nextAction === "pickup")}
                                                        >
                                                            {isCurrentActionLoading ? (
                                                                <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                                                            ) : (
                                                                <FontAwesomeIcon icon={isDropoffAction ? faArrowDown : faArrowUp} className="mr-2" />
                                                            )}
                                                            {isDropoffAction ? "Log Drop-off" : "Log Pick-up"}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}

                        {/* Footer Link Area */}
                        {children.length > 0 && !isLoading && (
                            <div className="p-6 text-center bg-gray-50 border-t border-gray-200">
                                {/* Changed link to button using navigate */}
                                <button
                                    onClick={() => navigate('/log-history')} // Navigate to log history route
                                    className="inline-flex items-center px-6 py-2 border border-indigo-300 shadow-sm text-sm font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150"
                                >
                                    <FontAwesomeIcon icon={faListAlt} className="mr-2" /> View Full Log History
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Dashboard;