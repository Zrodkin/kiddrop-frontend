import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Keep useNavigate for Edit button

function Dashboard() {
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  // FIX: Initialize message state to null
  const [message, setMessage] = useState(null);

  // REMOVED: Redundant auth check useEffect - ProtectedRoute handles this

  // useEffect to fetch children data on component mount
  useEffect(() => {
    const fetchChildren = async () => {
      // Reset message state on new fetch attempt
      setMessage(null);
      try {
        const token = localStorage.getItem("authToken");
        // console.log("Fetching children with token:", token); // Keep logs for debugging if needed

        // Ensure token exists before fetching
        if (!token) {
          console.error("No token found, cannot fetch children.");
          // Optional: navigate('/login'); // Or rely on ProtectedRoute
          return;
        }

        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        // console.log("Using API URL:", apiUrl);

        const res = await fetch(`${apiUrl}/api/parent/children`, {
          headers: {
            // Ensure the header key is exactly 'Authorization'
            'Authorization': `Bearer ${token}`,
          },
        });

        // console.log("Response status:", res.status);

        // Handle potential non-JSON responses for errors
        if (!res.ok) {
          let errorMsg = `HTTP error! status: ${res.status}`;
          try {
            const errorData = await res.json();
            errorMsg = errorData.message || JSON.stringify(errorData);
          } catch (jsonError) {
            // If response is not JSON, use status text
            errorMsg = res.statusText || errorMsg;
          }
          throw new Error(errorMsg);
        }

        const data = await res.json();
        // console.log("Response data:", data);
        setChildren(data);

      } catch (err) {
        console.error("Fetch children error:", err);
        // Use the showMessage function to display errors
        showMessage(`❌ Error fetching children: ${err.message}`, false);
        // Optional: Clear children if fetch fails?
        // setChildren([]);
      }
    };

    fetchChildren();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Function to handle dropoff/pickup actions
  const handleAction = async (studentId, action) => {
    // Reset message before new action
    setMessage(null);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem("authToken");

      if (!token) {
         throw new Error("Authentication token not found.");
      }

      const res = await fetch(`${apiUrl}/api/log/${action}/${studentId}`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          // Content-Type might be needed if backend expects it, even for empty body
          // 'Content-Type': 'application/json'
        },
        // Add empty body if needed by backend/middleware
        // body: JSON.stringify({})
      });

      if (!res.ok) {
         let errorMsg = `HTTP error! status: ${res.status}`;
         try {
            const errorData = await res.json();
            errorMsg = errorData.message || JSON.stringify(errorData);
         } catch (jsonError) {
            errorMsg = res.statusText || errorMsg;
         }
         throw new Error(errorMsg);
      }

      const data = await res.json();

      // Update the specific child's status in the local state
      setChildren(prevChildren =>
        prevChildren.map(child =>
          child._id === studentId ? { ...child, status: data.newStatus, lastActivity: new Date() } : child // Also update lastActivity locally if desired
        )
      );

      // Show success message
      showMessage(`✅ ${action === "dropoff" ? "Dropped off" : "Picked up"} successfully at ${new Date().toLocaleTimeString()}.`);

    } catch (err) {
      console.error(`Error during ${action}:`, err);
      showMessage(`❌ ${err.message}`, false);
    }
  };

  // Function to show temporary messages
  const showMessage = (text, isSuccess = true) => {
    // FIX: Set state to an object
    setMessage({ text, isSuccess });
    // FIX: Clear state back to null
    setTimeout(() => setMessage(null), 3500);
  };

  // JSX Rendering
  return (
    // REMOVED: Outer div with background - App.js or index.css should handle base background
    // REMOVED: Manual <header> - Navbar is rendered by App.js route definition

    // Wrapper div to allow placing message above main content if needed
    <div>
      {/* Message Display Area */}
      {/* FIX: Check if message object exists before accessing properties */}
      {message && (
        <div className="container mx-auto px-4 pt-4 md:pt-6"> {/* Position message */}
          <div className="max-w-3xl mx-auto">
            <div
              id="confirmation-message-content"
              className={`p-4 border rounded-lg shadow-md ${message.isSuccess ? "bg-green-100 text-green-900 border-green-300" : "bg-red-100 text-red-900 border-red-300"}`}
            >
              {message.text}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="container mx-auto px-4 py-8">
        {/* Centered Content Container */}
        <div className="w-full max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8 space-y-6 border border-gray-200">
          <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-gray-800 text-center md:text-left">Your Children</h2>

          {/* Children List */}
          <div className="space-y-5">
            {/* Handle loading state */}
            {/* {isLoading && <p>Loading children...</p>} */}

            {/* Handle case where children array is empty */}
            {children.length === 0 && !message && ( // Avoid showing if there's an error message
              <p className="text-center text-gray-500">No children found for this account.</p>
            )}

            {/* Map over children array */}
            {children.map(child => (
              <div
                key={child._id}
                className="border rounded-lg p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between"
              >
                {/* Child Info */}
                <div className="mb-4 md:mb-0 md:mr-4 flex-grow">
                  <h3 className="text-lg font-semibold text-gray-900">{child.name}</h3>
                  <p className="text-base text-gray-600">Grade {child.grade}</p>
                  <div className="mt-2 status-indicator">
                    {/* Status Badge */}
                    <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full border ${
                      child.status === "checked-in"
                        ? "bg-green-100 text-green-800 border-green-200"
                        : child.status === "checked-out"
                          ? "bg-red-100 text-red-800 border-red-200"
                          : "bg-gray-100 text-gray-800 border-gray-200" // Style for 'awaiting'
                    }`}>
                      <i className={`fas mr-1.5 ${
                        child.status === "checked-in" ? "fa-check-circle" :
                        child.status === "checked-out" ? "fa-sign-out-alt" :
                        "fa-hourglass-start" // Icon for 'awaiting'
                      }`}></i>
                      {/* Capitalize status text */}
                      {child.status.charAt(0).toUpperCase() + child.status.slice(1).replace('-', ' ')}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col md:flex-row gap-3 flex-shrink-0 w-full md:w-auto">
                  {/* Dropoff/Pickup Button */}
                  <button
                    className={`log-button ${
                      child.status === "checked-in"
                        ? "bg-blue-500 hover:bg-blue-600" // Pickup is blue
                        : "bg-green-500 hover:bg-green-600" // Dropoff is green
                    } text-white transition duration-200 ease-in-out flex items-center justify-center w-full md:w-auto px-4 py-2 rounded-lg text-sm font-medium shadow-sm`}
                    onClick={() => handleAction(child._id, child.status === "checked-in" ? "pickup" : "dropoff")}
                    // Disable button based on status if needed (e.g., disable dropoff if already checked in?)
                    // disabled={child.status === 'awaiting'} // Example: disable if status is 'awaiting'
                  >
                    <i className={`fas ${
                      child.status === "checked-in" ? "fa-arrow-up" : "fa-arrow-down"
                    } mr-2`}></i>
                    {child.status === "checked-in" ? "Log Pick-up" : "Log Drop-off"}
                  </button>

                  {/* Edit Info Button */}
                  <button
                    onClick={() => navigate(`/edit-child/${child._id}`)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200 ease-in-out shadow-sm flex items-center justify-center w-full md:w-auto"
                  >
                    <i className="fas fa-user-edit mr-2"></i>Edit Info
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Log History Link - Fixed */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <a
              href="#" // Replace with actual link later
              className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition duration-150"
            >
              View Full Log History
            </a>
          </div>
        </div>
      </main>

      {/* REMOVED: Manual Footer - Let App.js or index handle global footer if needed */}
    </div>
  );
}

export default Dashboard;
