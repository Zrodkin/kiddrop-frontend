// frontend/src/pages/AdminSendAlertPage.js (or components/AdminSendAlert.js)
import React, { useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExclamationTriangle, faInfoCircle, faCheckCircle, faPaperPlane, faTimes,
  faUsers, faUserGraduate, faUser, faPaperclip, faLink, faCalendarAlt, faEye,
  faEnvelope, faMobileAlt, faBell, faSpinner // Added faBell, faSpinner
} from '@fortawesome/free-solid-svg-icons';

// Placeholder data - replace with fetched data in a real app
const MOCK_GRADES = ["Kindergarten", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5"];
const MOCK_PARENTS = [
  { id: 'p1', name: 'John Smith (Alice S.)' },
  { id: 'p2', name: 'Jane Doe (Bob J.)' },
  { id: 'p3', name: 'Peter Jones (Charlie B.)' },
];

function AdminSendAlertPage() {
  // State for form inputs
  const [alertType, setAlertType] = useState('general'); // 'emergency', 'general', 'friendly'
  const [audience, setAudience] = useState('all'); // 'all', 'grades', 'individuals', 'staff'
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [parentSearch, setParentSearch] = useState('');
  const [selectedParents, setSelectedParents] = useState([]); // Array of parent objects/IDs
  const [subject, setSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [attachment, setAttachment] = useState(null); // File object
  const [link, setLink] = useState('');
  const [deliveryMethods, setDeliveryMethods] = useState({ app: true, email: true, sms: false });
  const [scheduleLater, setScheduleLater] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState('');

  // State for UI control
  const [showPreview, setShowPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendSuccess, setSendSuccess] = useState('');

  // --- Handlers ---
  const handleGradeSelect = (grade) => {
    setSelectedGrades(prev =>
      prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade]
    );
  };

  // TODO: Implement parent search logic (debounced fetch recommended)
  const handleParentSearch = (e) => {
    setParentSearch(e.target.value);
    // Add logic here to filter MOCK_PARENTS or fetch from API based on search term
  };

  const handleSelectParent = (parent) => {
    if (!selectedParents.find(p => p.id === parent.id)) {
      setSelectedParents(prev => [...prev, parent]);
    }
    setParentSearch(''); // Clear search after selection
  };

  const handleRemoveParent = (parentId) => {
    setSelectedParents(prev => prev.filter(p => p.id !== parentId));
  };

  const handleFileChange = (e) => {
    setAttachment(e.target.files[0]);
  };

  const handleDeliveryChange = (e) => {
    setDeliveryMethods(prev => ({ ...prev, [e.target.name]: e.target.checked }));
  };

  const handlePreview = () => {
    // Basic validation before showing preview
    if (!subject || !messageBody) {
        alert("Please enter a Subject and Message Body before previewing.");
        return;
    }
    if (audience === 'grades' && selectedGrades.length === 0) {
        alert("Please select at least one Grade for the target audience.");
        return;
    }
     if (audience === 'individuals' && selectedParents.length === 0) {
        alert("Please select at least one Parent for the target audience.");
        return;
    }
    setShowPreview(true);
  };

  const handleSend = async () => {
    setIsSending(true);
    setSendError('');
    setSendSuccess('');
    console.log("Sending Alert with data:", {
        alertType, audience, selectedGrades, selectedParents,
        subject, messageBody, attachment, link, deliveryMethods,
        scheduleLater, scheduledDateTime
    });

    // --- TODO: Implement API Call ---
    // Construct payload based on state
    // Use FormData if sending files
    // Example:
    // const payload = new FormData();
    // payload.append('subject', subject);
    // ... other fields ...
    // if (attachment) payload.append('file', attachment);
    // const res = await fetch('/api/admin/send-alert', { method: 'POST', headers: { Authorization: ... }, body: payload });
    // Handle response...

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulate success/failure
    const success = Math.random() > 0.2; // 80% success rate
    if (success) {
        setSendSuccess("Alert sent/scheduled successfully!");
        setShowPreview(false); // Close preview on success
        // Optionally reset form here
    } else {
        setSendError("Failed to send alert. Please try again.");
    }
    // --- End API Call Simulation ---

    setIsSending(false);
  };

  // --- Dynamic Data Mocks ---
  // Replace with actual search results based on parentSearch
  const filteredMockParents = MOCK_PARENTS.filter(p =>
    p.name.toLowerCase().includes(parentSearch.toLowerCase()) &&
    !selectedParents.find(sp => sp.id === p.id) // Don't show already selected parents
  ).slice(0, 5); // Limit results shown


  // --- Render Logic ---
  return (
    <div className="space-y-6">
      {/* Page Title */}
      {/* <h2 className="text-2xl font-semibold text-gray-800">Send Alert or Message</h2> */}

      {/* Main Form Container */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">

        {/* Success/Error Messages */}
        {sendSuccess && <div className="mb-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded-md">{sendSuccess}</div>}
        {sendError && <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md">{sendError}</div>}

        <form onSubmit={(e) => e.preventDefault()} className="space-y-8">

          {/* Step 1: Alert Type */}
          <fieldset>
            <legend className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">Step 1: Alert Type</legend>
            <div className="flex flex-wrap gap-4">
              {(['emergency', 'general', 'friendly']).map(type => {
                const typeInfo = {
                  emergency: { label: 'Emergency', icon: faExclamationTriangle, color: 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200', selectedColor: 'ring-2 ring-red-500 ring-offset-1' },
                  general: { label: 'General Update', icon: faInfoCircle, color: 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200', selectedColor: 'ring-2 ring-yellow-500 ring-offset-1' },
                  friendly: { label: 'Friendly Message', icon: faCheckCircle, color: 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200', selectedColor: 'ring-2 ring-green-500 ring-offset-1' }
                }[type];
                return (
                  <label key={type} className={`flex items-center px-4 py-2 border rounded-lg cursor-pointer transition duration-150 ${typeInfo.color} ${alertType === type ? typeInfo.selectedColor : ''}`}>
                    <input
                      type="radio"
                      name="alertType"
                      value={type}
                      checked={alertType === type}
                      onChange={(e) => setAlertType(e.target.value)}
                      className="sr-only" // Hide actual radio button
                    />
                    <FontAwesomeIcon icon={typeInfo.icon} className="mr-2" />
                    <span className="text-sm font-medium">{typeInfo.label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* Step 2: Target Audience */}
          <fieldset>
            <legend className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">Step 2: Target Audience</legend>
            <div className="space-y-4">
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full sm:w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Parents</option>
                <option value="grades">Specific Grade(s)</option>
                <option value="individuals">Individual Parent(s)</option>
                <option value="staff">Staff Only</option>
              </select>

              {/* Conditional Inputs based on Audience */}
              {audience === 'grades' && (
                <div className="p-4 border rounded-md bg-gray-50">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Grades:</label>
                  <div className="flex flex-wrap gap-2">
                    {MOCK_GRADES.map(grade => (
                      <label key={grade} className={`flex items-center px-3 py-1 border rounded-full text-xs cursor-pointer ${selectedGrades.includes(grade) ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}>
                        <input
                          type="checkbox"
                          checked={selectedGrades.includes(grade)}
                          onChange={() => handleGradeSelect(grade)}
                          className="mr-1.5 h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        {grade}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {audience === 'individuals' && (
                 <div className="p-4 border rounded-md bg-gray-50 space-y-3">
                    <label htmlFor="parent-search" className="block text-sm font-medium text-gray-700">Search & Select Parents:</label>
                    <div className="relative">
                        <input
                            id="parent-search"
                            type="text"
                            value={parentSearch}
                            onChange={handleParentSearch}
                            placeholder="Search by name..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        {/* Search Results Dropdown (Basic Example) */}
                        {parentSearch && filteredMockParents.length > 0 && (
                            <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                {filteredMockParents.map(parent => (
                                    <li
                                        key={parent.id}
                                        onClick={() => handleSelectParent(parent)}
                                        className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer"
                                    >
                                        {parent.name}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    {/* Display Selected Parents */}
                    {selectedParents.length > 0 && (
                        <div className="mt-2 space-x-1 space-y-1">
                             <span className="text-xs font-medium text-gray-600 mr-1">Selected:</span>
                            {selectedParents.map(parent => (
                                <span key={parent.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {parent.name}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveParent(parent.id)}
                                        className="ml-1.5 flex-shrink-0 text-blue-600 hover:text-blue-800 focus:outline-none"
                                    >
                                        &times;
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                 </div>
              )}
            </div>
          </fieldset>

          {/* Step 3: Message Content */}
          <fieldset>
             <legend className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">Step 3: Message Content</legend>
             <div className="space-y-4">
                <div>
                   <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject / Title</label>
                   <input
                      id="subject" type="text" value={subject} onChange={(e) => setSubject(e.target.value)} required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter a clear subject line"
                   />
                </div>
                <div>
                   <label htmlFor="messageBody" className="block text-sm font-medium text-gray-700 mb-1">Message Body</label>
                   <textarea
                      id="messageBody" rows="6" value={messageBody} onChange={(e) => setMessageBody(e.target.value)} required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Type your message here..."
                   ></textarea>
                   {/* Add simple formatting buttons later if needed */}
                </div>
                {/* Optional Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                       <label htmlFor="attachment" className="block text-sm font-medium text-gray-700 mb-1">Attach File <span className="text-xs text-gray-500">(Optional)</span></label>
                       <div className="flex items-center">
                           <FontAwesomeIcon icon={faPaperclip} className="text-gray-400 mr-2" />
                           <input id="attachment" type="file" onChange={handleFileChange} className="text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                       </div>
                        {attachment && <p className="text-xs text-gray-500 mt-1">Selected: {attachment.name}</p>}
                    </div>
                    <div>
                       <label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-1">Add Quick Link <span className="text-xs text-gray-500">(Optional)</span></label>
                       <div className="flex items-center">
                            <FontAwesomeIcon icon={faLink} className="text-gray-400 mr-2" />
                            <input
                                id="link" type="url" value={link} onChange={(e) => setLink(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                placeholder="https://example.com"
                            />
                       </div>
                    </div>
                </div>
             </div>
          </fieldset>

          {/* Step 4: Delivery Options */}
          <fieldset>
             <legend className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">Step 4: Delivery Options</legend>
             <div className="space-y-4">
                {/* Delivery Methods */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Send Via:</label>
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                        <label className="flex items-center cursor-pointer">
                            <input type="checkbox" name="app" checked={deliveryMethods.app} onChange={handleDeliveryChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
                            <FontAwesomeIcon icon={faBell} className="mx-1.5 text-blue-600"/>
                            <span className="ml-1 text-sm text-gray-800">In-App Notification</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input type="checkbox" name="email" checked={deliveryMethods.email} onChange={handleDeliveryChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
                             <FontAwesomeIcon icon={faEnvelope} className="mx-1.5 text-gray-600"/>
                            <span className="ml-1 text-sm text-gray-800">Email</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input type="checkbox" name="sms" checked={deliveryMethods.sms} onChange={handleDeliveryChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
                             <FontAwesomeIcon icon={faMobileAlt} className="mx-1.5 text-green-600"/>
                            <span className="ml-1 text-sm text-gray-800">SMS Text</span>
                            <span className="ml-1 text-xs text-gray-400">(Integration Required)</span>
                        </label>
                    </div>
                </div>
                 {/* Scheduling */}
                 <div>
                     <label className="flex items-center cursor-pointer">
                        <input type="checkbox" checked={scheduleLater} onChange={(e) => setScheduleLater(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
                        <FontAwesomeIcon icon={faCalendarAlt} className="mx-1.5 text-purple-600"/>
                        <span className="ml-1 text-sm text-gray-800">Schedule for Later</span>
                     </label>
                     {scheduleLater && (
                         <div className="mt-2 pl-8">
                             <input
                                type="datetime-local"
                                value={scheduledDateTime}
                                onChange={(e) => setScheduledDateTime(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                             />
                         </div>
                     )}
                 </div>
             </div>
          </fieldset>

          {/* Step 5: Confirmation / Actions */}
          <div className="pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-end items-center gap-4">
             <button
                type="button"
                onClick={handlePreview}
                className="px-5 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center justify-center w-full sm:w-auto"
             >
                 <FontAwesomeIcon icon={faEye} className="mr-2"/> Preview
             </button>
             <button
                type="button"
                onClick={handleSend}
                disabled={isSending}
                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-full sm:w-auto"
             >
                 {isSending ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2"/> : <FontAwesomeIcon icon={faPaperPlane} className="mr-2"/>}
                 {isSending ? 'Sending...' : (scheduleLater && scheduledDateTime ? 'Schedule Alert' : 'Send Now')}
             </button>
          </div>

        </form>
      </div>

      {/* Preview Modal */}
      {showPreview && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center p-4 border-b">
                    <h4 className="text-lg font-semibold">Alert Preview</h4>
                    <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                </div>
                <div className="p-6 space-y-4">
                    <div><strong className="text-gray-600">Type:</strong> <span className="capitalize">{alertType}</span></div>
                    <div><strong className="text-gray-600">Audience:</strong> <span className="capitalize">{audience}</span>
                        {audience === 'grades' && ` (${selectedGrades.join(', ') || 'None Selected'})`}
                        {audience === 'individuals' && ` (${selectedParents.map(p=>p.name).join(', ') || 'None Selected'})`}
                    </div>
                    <hr/>
                    <div><strong className="text-gray-600">Subject:</strong> {subject}</div>
                    <div><strong className="text-gray-600">Message:</strong><br/><pre className="whitespace-pre-wrap font-sans text-sm mt-1 p-3 bg-gray-50 rounded border">{messageBody}</pre></div>
                    {link && <div><strong className="text-gray-600">Link:</strong> <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{link}</a></div>}
                    {attachment && <div><strong className="text-gray-600">Attachment:</strong> {attachment.name}</div>}
                    <hr/>
                    <div><strong className="text-gray-600">Delivery:</strong>
                        {deliveryMethods.app && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">App</span>}
                        {deliveryMethods.email && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">Email</span>}
                        {deliveryMethods.sms && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">SMS</span>}
                    </div>
                    {scheduleLater && scheduledDateTime && <div><strong className="text-gray-600">Scheduled Time:</strong> {new Date(scheduledDateTime).toLocaleString()}</div>}
                </div>
                 <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                     <button onClick={() => setShowPreview(false)} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Close Preview</button>
                     <button
                        type="button"
                        onClick={handleSend}
                        disabled={isSending}
                        className="px-5 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                     >
                         {isSending ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2"/> : <FontAwesomeIcon icon={faPaperPlane} className="mr-2"/>}
                         {isSending ? 'Sending...' : (scheduleLater && scheduledDateTime ? 'Confirm Schedule' : 'Confirm & Send')}
                     </button>
                 </div>
            </div>
         </div>
      )}

    </div>
  );
}

export default AdminSendAlertPage;
