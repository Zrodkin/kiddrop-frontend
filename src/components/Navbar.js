import React from 'react';
// Import navigation components from React Router
import { Link, useNavigate } from 'react-router-dom';
// Import Font Awesome components and icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSchool, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

function Navbar() {
  const navigate = useNavigate();

  // Logout handler
  const handleLogout = () => {
    console.log("Logging out...");
    localStorage.removeItem("authToken"); // Use the correct key
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    navigate("/login"); // Redirect to login page
  };

  return (
    // Navbar container: Still white for contrast, slightly more padding, softer shadow
    <nav className="bg-white shadow w-full py-4 px-4 sm:px-6 border-b border-gray-200">
      {/* Max-width container matching other pages */}
      <div className="container mx-auto flex justify-between items-center max-w-5xl">

        {/* Left side: Logo/Brand Link */}
        <div className="flex items-center">
          <Link
            to="/dashboard" // Link to parent dashboard
            // Adjusted text size, weight, and hover effect for refinement
            className="flex items-center text-xl font-bold text-slate-800 hover:text-blue-700 transition duration-150 ease-in-out"
          >
            {/* Adjusted icon color and size */}
            <FontAwesomeIcon icon={faSchool} className="mr-2 text-blue-600 text-2xl" />
            School Check-in
          </Link>
        </div>

        {/* Right side: Logout Button */}
        <div>
          <button
            onClick={handleLogout}
            // Slightly adjusted styles for consistency (padding, shadow)
            className="bg-red-500 hover:bg-red-600 text-white py-2 px-5 rounded-lg transition duration-200 text-sm font-medium shadow hover:shadow-md flex items-center"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="mr-1.5 hidden sm:inline" />
            Logout
          </button>
        </div>

      </div>
    </nav>
  );
}

export default Navbar;
