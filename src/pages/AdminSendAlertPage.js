// frontend/src/pages/AdminSendAlertPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faExclamationTriangle, faInfoCircle, faCheckCircle, faPaperPlane, faTimes,
    faUsers, faUserGraduate, faUser, faPaperclip, faLink, faCalendarAlt, faEye,
    faEnvelope, faMobileAlt, faBell, faSpinner
} from '@fortawesome/free-solid-svg-icons';

// Placeholder data
const MOCK_GRADES = ["Kindergarten", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5"];

function AdminSendAlertPage() {
    // State for form inputs
    const [alertType, setAlertType] = useState('general');
    const [audience, setAudience] = useState('all');
    const [selectedGrades, setSelectedGrades] = useState([]);
    const [parentSearch, setParentSearch] = useState('');
    const [allParents, setAllParents] = useState([]);
    const [filteredParents, setFilteredParents] = useState([]);
    const [selectedParents, setSelectedParents] = useState([]);
    const [subject, setSubject] = useState('');
    const [messageBody, setMessageBody] = useState('');
    const [attachment, setAttachment] = useState(null);
    const [link, setLink] = useState('');
    const [deliveryMethods, setDeliveryMethods] = useState({ app: true, email: true, sms: false });
    const [scheduleLater, setScheduleLater] = useState(false);
    const [scheduledDateTime, setScheduledDateTime] = useState('');

    // State for UI control
    const [showPreview, setShowPreview] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [parentsLoading, setParentsLoading] = useState(false);
    const [parentsError, setParentsError] = useState('');
    const [sendError, setSendError] = useState('');
    const [sendSuccess, setSendSuccess] = useState('');

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    // --- Show Temporary Messages ---
    const showMessage = useCallback((type, text) => {
        if (type === 'success') {
            setSendSuccess(text);
            setSendError('');
        } else {
            setSendError(text);
            setSendSuccess('');
        }
        const timer = setTimeout(() => {
            setSendSuccess('');
            setSendError('');
        }, 5000);
        return () => clearTimeout(timer);
    }, []);

    // --- Fetch Parent List ---
    useEffect(() => {
        const fetchParents = async () => {
            setParentsLoading(true);
            setParentsError('');
            try {
                const token = localStorage.getItem("token");
                if (!token) throw new Error("Authentication required.");

                const res = await fetch(`${apiUrl}/api/admin/parents`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) {
                    let errorMsg = `Error: ${res.status}`;
                    try { const errData = await res.json(); errorMsg = errData.message || errorMsg; }
                    catch (e) { errorMsg = res.statusText || errorMsg; }
                    throw new Error(errorMsg);
                }
                const data = await res.json();
                // Sort parents alphabetically by name
                const sortedData = (data || []).sort((a, b) => (a?.name || "").localeCompare(b?.name || "")); // Added safe access here too
                setAllParents(sortedData);

            } catch (err) {
                console.error("Error fetching parents:", err);
                setParentsError(`Failed to load parents: ${err.message}`);
            } finally {
                setParentsLoading(false);
            }
        };
        fetchParents();
    }, [apiUrl]);

    // --- Filter Parents for Search Dropdown ---
    // **** THIS IS THE CORRECTED useEffect ****
    useEffect(() => {
        if (!parentSearch) {
          setFilteredParents([]);
          return;
        }
        const lowerCaseSearch = parentSearch.toLowerCase(); // Cache lowercase search term
        setFilteredParents(
          allParents.filter(p => {
            // Safely access p.name, provide fallback '', then call toLowerCase()
            const parentNameLower = (p?.name || '').toLowerCase();
            // Check if parent object and its _id exist before comparing
            const isAlreadySelected = selectedParents.find(sp => sp?._id === p?._id);
            return (
              parentNameLower.includes(lowerCaseSearch) && !isAlreadySelected
            );
          }).slice(0, 7) // Limit results
        );
    }, [parentSearch, allParents, selectedParents]); // Dependencies remain the same
    // **** END OF CORRECTION ****

    // --- Handlers ---
    const handleGradeSelect = (grade) => {
        setSelectedGrades(prev => prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade]);
    };

    const handleParentSearch = (e) => { setParentSearch(e.target.value); };

    const handleSelectParent = (parent) => {
        // Ensure parent and parent._id exist before adding
        if (parent?._id && !selectedParents.find(p => p?._id === parent._id)) {
            setSelectedParents(prev => [...prev, parent]);
        }
        setParentSearch('');
        setFilteredParents([]);
    };

    const handleRemoveParent = (parentId) => {
        // Ensure parentId is valid before filtering
        if(parentId) {
            setSelectedParents(prev => prev.filter(p => p?._id !== parentId));
        }
    };

    const handleFileChange = (e) => { setAttachment(e.target.files[0]); };

    const handleDeliveryChange = (e) => { setDeliveryMethods(prev => ({ ...prev, [e.target.name]: e.target.checked })); };

    const handlePreview = () => {
        // Added check for delivery methods
        if (!subject || !messageBody) { return showMessage('error', "Subject and Message Body are required."); }
        if (audience === 'grades' && selectedGrades.length === 0) { return showMessage('error', "Please select target grades."); }
        if (audience === 'individuals' && selectedParents.length === 0) { return showMessage('error', "Please select target parents."); }
        if (!deliveryMethods.app && !deliveryMethods.email && !deliveryMethods.sms) { return showMessage('error', "Please select at least one delivery method.");}
        if (scheduleLater && !scheduledDateTime) { return showMessage('error', "Please select a date/time for scheduling."); }
        if (scheduleLater && scheduledDateTime && new Date(scheduledDateTime) < new Date()) { return showMessage('error', "Scheduled time cannot be in the past."); }

        setShowPreview(true);
    };

    // --- Send Alert API Call ---
    const handleSend = async () => {
        // Re-run validation before sending
        if (!subject || !messageBody) { return showMessage('error', "Subject and Message Body are required."); }
        if (audience === 'grades' && selectedGrades.length === 0) { return showMessage('error', "Please select target grades."); }
        if (audience === 'individuals' && selectedParents.length === 0) { return showMessage('error', "Please select target parents."); }
        if (!deliveryMethods.app && !deliveryMethods.email && !deliveryMethods.sms) { return showMessage('error', "Please select at least one delivery method.");}
        if (scheduleLater && !scheduledDateTime) { return showMessage('error', "Please select a date/time for scheduling."); }
        if (scheduleLater && scheduledDateTime && new Date(scheduledDateTime) < new Date()) { return showMessage('error', "Scheduled time cannot be in the past."); }

        setIsSending(true);
        setSendError('');
        setSendSuccess('');

        const payload = {
            alertType,
            audienceType: audience,
            subject,
            messageBody,
            link: link || undefined,
            deliveryMethods,
            scheduleLater,
            scheduledDateTime: scheduleLater ? scheduledDateTime : undefined,
            ...(audience === 'grades' && { selectedGrades: selectedGrades }),
             // Ensure only valid IDs are mapped
            ...(audience === 'individuals' && { selectedParentIds: selectedParents.map(p => p?._id).filter(id => id) }),
        };

        console.log("Sending Alert with payload:", payload);

        if (attachment) {
            console.warn("File attachment selected, but sending files is not implemented in this version. Sending text data only.");
        }

        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Authentication required.");

            const res = await fetch(`${apiUrl}/api/admin/send-alert`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || `HTTP error! status: ${res.status}`);
            }

            showMessage('success', data.message || "Alert sent/scheduled successfully!");
            setShowPreview(false);
            // Consider resetting form fields after successful send
            // setSubject(''); setMessageBody(''); ... etc.

        } catch (err) {
            console.error("Send alert error:", err);
            showMessage('error', `Failed to send alert: ${err.message}`);
        } finally {
            setIsSending(false);
        }
    };


    // --- Render Logic ---
    // (The rest of the component's return statement remains the same as the previously provided version
    // with the design improvements and the updated typeInfo object for alert types)
    return (
        // Added page container with background and padding
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
            {/* Main Form Container with max-width and centering */}
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200 max-w-4xl mx-auto">

                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 border-b pb-3">Send New Alert</h2>

                {/* Success/Error Messages */}
                {sendSuccess && <div className="mb-6 p-3 bg-green-50 text-green-700 border border-green-200 rounded-md text-sm">{sendSuccess}</div>}
                {sendError && <div className="mb-6 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">{sendError}</div>}

                {/* Using space-y on the form for consistent vertical spacing between fieldsets */}
                <form onSubmit={(e) => e.preventDefault()} className="space-y-10">

                    {/* Step 1: Alert Type */}
                    <fieldset>
                        <legend className="text-lg font-semibold text-gray-700 mb-4">Step 1: Select Alert Type</legend>
                        <div className="flex flex-wrap gap-3 sm:gap-4">
                            {(['emergency', 'general', 'friendly']).map(type => {
                                // Uses the updated typeInfo object from the previous step
                                const typeInfo = {
                                    emergency: {
                                        label: 'Emergency',
                                        icon: faExclamationTriangle,
                                        color: 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100',
                                        selectedColor: 'ring-2 ring-red-500 bg-red-100'
                                    },
                                    general: {
                                        label: 'General',
                                        icon: faInfoCircle,
                                        color: 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100', // Default light blue
                                        selectedColor: 'ring-2 ring-blue-500 bg-blue-50' // Selected light blue + ring
                                    },
                                    friendly: {
                                        label: 'Info/Event',
                                        icon: faCheckCircle,
                                        color: 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100',
                                        selectedColor: 'ring-2 ring-green-500 bg-green-100'
                                    }
                                }[type];
                                return (
                                    <label key={type} className={`flex items-center px-4 py-2 border rounded-lg cursor-pointer transition duration-150 text-sm sm:text-base ${typeInfo.color} ${alertType === type ? typeInfo.selectedColor : ''}`}>
                                        <input type="radio" name="alertType" value={type} checked={alertType === type} onChange={(e) => setAlertType(e.target.value)} className="sr-only" />
                                        <FontAwesomeIcon icon={typeInfo.icon} className="mr-2 w-4 h-4" />
                                        <span className="font-medium">{typeInfo.label}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </fieldset>

                     {/* Step 2: Target Audience */}
                    <fieldset>
                        <legend className="text-lg font-semibold text-gray-700 mb-4">Step 2: Choose Recipients</legend>
                        <div className="space-y-5"> {/* Increased space within this section */}
                            <select
                                value={audience}
                                onChange={(e) => setAudience(e.target.value)}
                                className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                            >
                                <option value="all">All Parents</option>
                                <option value="grades">Specific Grade(s)</option>
                                <option value="individuals">Individual Parent(s)</option>
                                <option value="staff">Staff Only</option> {/* Assuming this might be needed */}
                            </select>

                            {/* Conditional Inputs - added light background and padding */}
                            {audience === 'grades' && (
                                <div className="p-4 border rounded-md bg-gray-50/50 space-y-3"> {/* Subtle background */}
                                    <label className="block text-sm font-medium text-gray-600">Select Grades:</label>
                                    <div className="flex flex-wrap gap-2">
                                        {MOCK_GRADES.map(grade => (
                                            <label key={grade} className={`flex items-center px-3 py-1.5 border rounded-full text-xs sm:text-sm cursor-pointer transition ${selectedGrades.includes(grade) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300'}`}>
                                                <input type="checkbox" checked={selectedGrades.includes(grade)} onChange={() => handleGradeSelect(grade)} className="opacity-0 w-0 h-0 absolute" /> {/* Visually hidden checkbox */}
                                                {grade}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {audience === 'individuals' && (
                                <div className="p-4 border rounded-md bg-gray-50/50 space-y-4"> {/* Subtle background */}
                                    <label htmlFor="parent-search" className="block text-sm font-medium text-gray-600">Search & Select Parents:</label>
                                    <div className="relative">
                                        <input
                                            id="parent-search" type="text" value={parentSearch} onChange={handleParentSearch}
                                            placeholder={parentsLoading ? "Loading..." : "Type parent name..."}
                                            disabled={parentsLoading || !!parentsError} // Disable if loading or error
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base disabled:bg-gray-100"
                                            aria-invalid={!!parentsError} // Indicate error state
                                            aria-describedby={parentsError ? "parent-error-msg" : undefined}
                                        />
                                        {/* Search Results Dropdown */}
                                        {parentSearch && !parentsLoading && (
                                            <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                                {filteredParents.length > 0 ? (
                                                    filteredParents.map(parent => (
                                                        // Ensure parent object and _id exist before rendering
                                                        parent?._id && (
                                                            <li key={parent._id} onClick={() => handleSelectParent(parent)} className="px-4 py-2 text-sm text-gray-800 hover:bg-blue-50 cursor-pointer" >
                                                                {parent.name || 'Unnamed Parent'} <span className="text-gray-500 text-xs">({parent.email || 'No email'})</span>
                                                            </li>
                                                        )
                                                    ))
                                                ) : (
                                                    <li className="px-4 py-2 text-sm text-gray-500">No matching parents found.</li>
                                                )}
                                            </ul>
                                        )}
                                        {parentsLoading && <p className="text-xs text-gray-500 mt-1 absolute">Loading...</p>}
                                        {parentsError && <p id="parent-error-msg" className="text-xs text-red-500 mt-1">{parentsError}</p>}
                                    </div>
                                    {/* Display Selected Parents */}
                                    {selectedParents.length > 0 && (
                                        <div className="mt-3 space-x-1 space-y-1 flex flex-wrap gap-1"> {/* Use flex-wrap */}
                                            <span className="text-xs font-medium text-gray-600 mr-1 self-center">Selected:</span>
                                            {selectedParents.map(parent => (
                                                // Ensure parent object and _id exist before rendering
                                                parent?._id && (
                                                    <span key={parent._id} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {parent.name || 'Unnamed Parent'}
                                                        <button type="button" onClick={() => handleRemoveParent(parent._id)} className="ml-1.5 flex-shrink-0 text-blue-600 hover:text-blue-800 focus:outline-none focus:text-blue-900" aria-label={`Remove ${parent.name || 'parent'}`}>
                                                            <FontAwesomeIcon icon={faTimes} className="h-3 w-3" />
                                                        </button>
                                                    </span>
                                                )
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </fieldset>

                    {/* Step 3: Message Content */}
                    <fieldset>
                        <legend className="text-lg font-semibold text-gray-700 mb-4">Step 3: Compose Message</legend>
                        <div className="space-y-5">
                            <div>
                                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject / Title</label>
                                <input id="subject" type="text" value={subject} onChange={(e) => setSubject(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base" placeholder="Enter a clear subject line" />
                            </div>
                            <div>
                                <label htmlFor="messageBody" className="block text-sm font-medium text-gray-700 mb-1">Message Body</label>
                                <textarea id="messageBody" rows="6" value={messageBody} onChange={(e) => setMessageBody(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base" placeholder="Type your message here..." ></textarea>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5"> {/* Adjusted gap */}
                                <div>
                                    <label htmlFor="attachment" className="block text-sm font-medium text-gray-700 mb-1">Attach File <span className="text-xs text-gray-500">(Optional, Not Implemented)</span></label>
                                    <div className="flex items-center border border-gray-300 rounded-md px-3 py-1.5 shadow-sm"> {/* Wrapped input for better styling */}
                                        <FontAwesomeIcon icon={faPaperclip} className="text-gray-400 mr-2" />
                                        <input id="attachment" type="file" onChange={handleFileChange} className="text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer w-full"/>
                                    </div>
                                    {attachment && <p className="text-xs text-gray-500 mt-1 truncate">Selected: {attachment.name}</p>}
                                </div>
                                <div>
                                    <label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-1">Add Quick Link <span className="text-xs text-gray-500">(Optional)</span></label>
                                    <div className="relative flex items-center">
                                        <FontAwesomeIcon icon={faLink} className="absolute left-3 text-gray-400 pointer-events-none" />
                                        <input id="link" type="url" value={link} onChange={(e) => setLink(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base" placeholder="https://example.com" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </fieldset>

                     {/* Step 4: Delivery Options */}
                    <fieldset>
                        <legend className="text-lg font-semibold text-gray-700 mb-4">Step 4: Choose Delivery Options</legend>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Send Via:</label>
                                <div className="flex flex-wrap gap-x-6 gap-y-3"> {/* Adjusted gap */}
                                    <label className="flex items-center cursor-pointer group">
                                        <input type="checkbox" name="app" checked={deliveryMethods.app} onChange={handleDeliveryChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-offset-1"/>
                                        <FontAwesomeIcon icon={faBell} className="mx-1.5 text-blue-500 group-hover:text-blue-700 transition-colors"/>
                                        <span className="ml-1 text-sm text-gray-800 group-hover:text-black transition-colors">In-App Notification</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer group">
                                        <input type="checkbox" name="email" checked={deliveryMethods.email} onChange={handleDeliveryChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-offset-1"/>
                                        <FontAwesomeIcon icon={faEnvelope} className="mx-1.5 text-gray-500 group-hover:text-gray-700 transition-colors"/>
                                        <span className="ml-1 text-sm text-gray-800 group-hover:text-black transition-colors">Email</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer group">
                                        <input type="checkbox" name="sms" checked={deliveryMethods.sms} onChange={handleDeliveryChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-offset-1"/>
                                        <FontAwesomeIcon icon={faMobileAlt} className="mx-1.5 text-green-500 group-hover:text-green-700 transition-colors"/>
                                        <span className="ml-1 text-sm text-gray-800 group-hover:text-black transition-colors">SMS Text</span>
                                        <span className="ml-1 text-xs text-gray-400">(Requires Integration)</span>
                                    </label>
                                </div>
                                {/* Add warning if no delivery methods selected */}
                                {!deliveryMethods.app && !deliveryMethods.email && !deliveryMethods.sms && (
                                    <p className="text-xs text-red-600 mt-2">Please select at least one delivery method.</p>
                                )}
                            </div>
                            <div className="pt-2"> {/* Added padding top for separation */}
                                <label className="flex items-center cursor-pointer group">
                                    <input type="checkbox" checked={scheduleLater} onChange={(e) => setScheduleLater(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-offset-1"/>
                                    <FontAwesomeIcon icon={faCalendarAlt} className="mx-1.5 text-purple-500 group-hover:text-purple-700 transition-colors"/>
                                    <span className="ml-1 text-sm text-gray-800 group-hover:text-black transition-colors">Schedule for Later?</span>
                                </label>
                                {scheduleLater && (
                                    <div className="mt-3 pl-8"> {/* Adjusted margin and padding */}
                                        <input
                                           type="datetime-local"
                                           value={scheduledDateTime}
                                           onChange={(e) => setScheduledDateTime(e.target.value)}
                                           // Set min to current date/time to prevent past selection (browser support varies)
                                           min={new Date().toISOString().slice(0, 16)}
                                           required={scheduleLater} // Make required only if scheduling
                                           className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                                        />
                                        {/* Add validation message if needed */}
                                        {scheduleLater && scheduledDateTime && new Date(scheduledDateTime) < new Date() && (
                                            <p className="text-xs text-red-600 mt-1">Cannot schedule for a past date/time.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </fieldset>

                    {/* Step 5: Confirmation / Actions */}
                    <div className="pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-end items-center gap-3 sm:gap-4">
                        <button
                            type="button"
                            onClick={handlePreview}
                            className="w-full sm:w-auto px-5 py-2.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center justify-center transition duration-150"
                        >
                            <FontAwesomeIcon icon={faEye} className="mr-2 h-4 w-4" /> Preview
                        </button>
                        <button
                            type="button"
                            onClick={handleSend}
                            // More robust disabled check
                            disabled={
                                isSending ||
                                (!deliveryMethods.app && !deliveryMethods.email && !deliveryMethods.sms) ||
                                (scheduleLater && !scheduledDateTime) ||
                                (scheduleLater && scheduledDateTime && new Date(scheduledDateTime) < new Date()) ||
                                (audience === 'grades' && selectedGrades.length === 0) ||
                                (audience === 'individuals' && selectedParents.length === 0) ||
                                !subject || !messageBody
                             }
                            className="w-full sm:w-auto px-6 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center transition duration-150"
                        >
                            {isSending ? (
                                <FontAwesomeIcon icon={faSpinner} spin className="mr-2 h-4 w-4" />
                            ) : (
                                <FontAwesomeIcon icon={faPaperPlane} className="mr-2 h-4 w-4" />
                            )}
                            {isSending ? 'Processing...' : (scheduleLater && scheduledDateTime ? 'Schedule Alert' : 'Send Now')}
                        </button>
                    </div>
                </form>
            </div>

            {/* Preview Modal (Remains the same as the previous version) */}
            {showPreview && (
                 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-fade-in">
                        <div className="flex justify-between items-center p-4 sm:p-5 border-b sticky top-0 bg-white rounded-t-lg">
                            <h4 className="text-lg font-semibold text-gray-800">Alert Preview</h4>
                            <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-700 transition-colors text-2xl leading-none" aria-label="Close preview">
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto text-sm">
                            <div className="flex justify-between items-center">
                                <strong className="text-gray-600">Type:</strong>
                                <span className={`capitalize px-2 py-0.5 rounded text-xs font-medium ${
                                    alertType === 'emergency' ? 'bg-red-100 text-red-800' :
                                    alertType === 'friendly' ? 'bg-green-100 text-green-800' :
                                    'bg-blue-100 text-blue-800'
                                }`}>{alertType}</span>
                            </div>
                             <div>
                                <strong className="text-gray-600 block mb-1">Audience:</strong>
                                <span className="capitalize bg-gray-100 px-2 py-1 rounded text-gray-800 text-xs inline-block">
                                    {audience === 'all' ? 'All Parents' :
                                     audience === 'grades' ? `Grade(s): ${selectedGrades.join(', ') || 'None'}` :
                                     audience === 'individuals' ? `Individual(s): ${selectedParents.map(p => p.name).join(', ') || 'None'}` :
                                     audience === 'staff' ? 'Staff Only' : audience }
                                </span>
                            </div>
                            <hr />
                            <div><strong className="text-gray-600">Subject:</strong> <span className="text-gray-800">{subject}</span></div>
                            <div><strong className="text-gray-600 block mb-1">Message Body:</strong>
                                <pre className="whitespace-pre-wrap font-sans text-sm p-3 bg-gray-50 rounded border border-gray-200 max-h-60 overflow-y-auto">{messageBody || "(Empty)"}</pre>
                            </div>
                            {link && <div><strong className="text-gray-600">Link:</strong> <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{link}</a></div>}
                            {attachment && <div><strong className="text-gray-600">Attachment:</strong> <span className="text-gray-700">{attachment.name}</span></div>}
                            <hr />
                             <div>
                                 <strong className="text-gray-600 block mb-1">Delivery Methods:</strong>
                                <div className="flex flex-wrap gap-2">
                                    {deliveryMethods.app && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"><FontAwesomeIcon icon={faBell} className="mr-1"/> App</span>}
                                    {deliveryMethods.email && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"><FontAwesomeIcon icon={faEnvelope} className="mr-1"/> Email</span>}
                                    {deliveryMethods.sms && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"><FontAwesomeIcon icon={faMobileAlt} className="mr-1"/> SMS</span>}
                                </div>
                            </div>
                            {scheduleLater && scheduledDateTime && <div><strong className="text-gray-600">Scheduled Time:</strong> <span className="text-gray-800">{new Date(scheduledDateTime).toLocaleString()}</span></div>}
                        </div>
                         <div className="p-4 border-t bg-gray-50 flex flex-col sm:flex-row justify-end gap-3 sticky bottom-0 rounded-b-lg">
                             <button onClick={() => setShowPreview(false)} className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 transition duration-150">Close Preview</button>
                             <button type="button" onClick={handleSend} disabled={isSending} className="w-full sm:w-auto px-5 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center transition duration-150" >
                                {isSending ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2"/> : <FontAwesomeIcon icon={faPaperPlane} className="mr-2"/>}
                                {isSending ? 'Processing...' : (scheduleLater && scheduledDateTime ? 'Confirm Schedule' : 'Confirm & Send')}
                             </button>
                        </div>
                    </div>
                     <style>{`
                       @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                       .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
                     `}</style>
                </div>
            )}

        </div> // End page container
    );
}

export default AdminSendAlertPage;