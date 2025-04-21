import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';

function AddChildForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "", grade: "", emergencyName: "", emergencyPhone: "",
    emergencyRelation: "", allergies: "", authorizedPickup: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); }
    // Add role check if needed, though ProtectedRoute should handle it
  }, [navigate]);

  // Show message helper
  const showMessage = useCallback((text, isSuccess = true) => {
    setMessage({ text, isSuccess });
    const timer = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(timer);
  }, []);

  // Input change handler
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (!formData.name || !formData.grade) {
        showMessage("❌ Child's Name and Grade are required.", false);
        setSaving(false);
        return;
    }

    let res; // Define res outside try block to access status in catch
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      res = await fetch(`${apiUrl}/api/parent/child`, { // Assign to outer res
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      // Check if response is ok FIRST
      if (!res.ok) {
        let errorMsg = `Error: ${res.status} ${res.statusText}`; // Default error
        try {
          // Try to parse potential JSON error response from backend
          const errorData = await res.json();
          errorMsg = errorData.message || JSON.stringify(errorData);
        } catch (jsonError) {
          // If response wasn't JSON (like a 404 HTML page), use the status text
          console.log("Response was not JSON, using status text.");
        }
        // Throw the error to be caught by the catch block
        throw new Error(errorMsg);
      }

      // Only attempt to parse JSON if response was ok (e.g., 201 Created)
      const data = await res.json();

      showMessage("✅ Child added successfully! Redirecting...", true);
      setTimeout(() => { navigate("/dashboard"); }, 1500);

    } catch (err) {
      console.error("Add child error:", err);
      // Show the error message (which might be from backend or fetch failure)
      showMessage(`❌ Failed to add child: ${err.message}`, false);
    } finally {
      setSaving(false);
    }
  };

  return (
    // Use consistent page background
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 py-8">
       {/* Message Display Area */}
       {message && (
        <div className="container mx-auto px-4 mb-6">
          <div className="max-w-3xl mx-auto">
            <div className={`p-4 border-l-4 rounded-md shadow-md flex items-center ${message.isSuccess ? "bg-green-50 border-green-500 text-green-800" : "bg-red-50 border-red-500 text-red-800"}`}>
              <FontAwesomeIcon icon={message.isSuccess ? faCheckCircle : faExclamationCircle} className="mr-3 flex-shrink-0" />
              <span className="font-medium">{message.text}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="container mx-auto px-4">
        {/* Centered Content Container */}
        <div className="w-full max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8 border border-gray-200">
          {/* Form Header */}
          <div className="text-center border-b border-gray-200 pb-4 mb-6">
              <h2 className="text-2xl md:text-3xl font-semibold text-gray-800">
                Add New Child Information
              </h2>
              <p className="text-gray-500 text-sm mt-1">Enter the details for the new student.</p>
          </div>

          {/* Add Child Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Fieldsets and Inputs (same as before) */}
            {/* Basic Info */}
            <fieldset className="border rounded-lg p-4 pt-2">
              <legend className="text-lg font-medium text-gray-700 px-2">Basic Information</legend>
              <div className="space-y-4 mt-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Child's Full Name</label>
                  <input id="name" type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="e.g., Jane Doe"/>
                </div>
                <div>
                  <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                  <select id="grade" name="grade" value={formData.grade} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Select Grade</option>
                    <option value="K">Kindergarten</option>
                    <option value="1">Grade 1</option>
                    <option value="2">Grade 2</option>
                    <option value="3">Grade 3</option>
                    <option value="4">Grade 4</option>
                    <option value="5">Grade 5</option>
                  </select>
                </div>
              </div>
            </fieldset>
            {/* Emergency Contact */}
            <fieldset className="border rounded-lg p-4 pt-2">
               <legend className="text-lg font-medium text-gray-700 px-2">Emergency Contact</legend>
               <div className="space-y-4 mt-2">
                  <div><label htmlFor="emergencyName" className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label><input id="emergencyName" type="text" name="emergencyName" value={formData.emergencyName} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., John Smith"/></div>
                  <div><label htmlFor="emergencyPhone" className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label><input id="emergencyPhone" type="tel" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="(555) 123-4567"/></div>
                  <div><label htmlFor="emergencyRelation" className="block text-sm font-medium text-gray-700 mb-1">Relationship</label><input id="emergencyRelation" type="text" name="emergencyRelation" value={formData.emergencyRelation} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Father, Guardian"/></div>
               </div>
            </fieldset>
             {/* Medical & Pickup */}
             <fieldset className="border rounded-lg p-4 pt-2">
               <legend className="text-lg font-medium text-gray-700 px-2">Medical & Pickup</legend>
               <div className="space-y-4 mt-2">
                  <div><label htmlFor="allergies" className="block text-sm font-medium text-gray-700 mb-1">Allergies or Conditions <span className="text-xs text-gray-500">(Optional)</span></label><textarea id="allergies" name="allergies" value={formData.allergies} onChange={handleChange} rows="2" className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="List any known allergies or important conditions. Write 'None' if applicable."></textarea></div>
                  <div><label htmlFor="authorizedPickup" className="block text-sm font-medium text-gray-700 mb-1">Authorized Pickup Persons <span className="text-xs text-gray-500">(Optional)</span></label><textarea id="authorizedPickup" name="authorizedPickup" value={formData.authorizedPickup} onChange={handleChange} rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="List names & phone #s of others authorized to pick up (e.g., Grandma Sue - 555-111-2222). Staff may ask for ID."></textarea></div>
               </div>
            </fieldset>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200 mt-6">
              <button type="button" onClick={() => navigate("/dashboard")} className="px-6 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                {saving ? (<FontAwesomeIcon icon={faSpinner} spin className="mr-2" />) : null}
                {saving ? "Saving..." : "Add Child"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default AddChildForm;
/* There is no additional code required at $PLACEHOLDER$. 
The file might appear green because it has been recently modified or staged for commit in your version control system (e.g., Git). 
Check your Git status or your editor's color legend for clarification. */