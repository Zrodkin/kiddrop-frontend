import React from 'react';
// Import navigation components from React Router
import { Link, useNavigate } from 'react-router-dom'; // Removed NavLink and useLocation as they are no longer needed for just the brand link
// Import Font Awesome components and icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSchool, faSignOutAlt } from '@fortawesome/free-solid-svg-icons'; // Removed faHome

function Navbar() {
  const navigate = useNavigate();

  // Logout handler - more specific than localStorage.clear()
  const handleLogout = () => {
    console.log("Logging out...");
    localStorage.removeItem("token"); // Remove specific items
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    navigate("/login"); // Redirect to login page
  };

  // Removed getNavLinkClass function as NavLink is no longer used

  return (
    // Navbar container - no longer fixed position
    <nav className="bg-white shadow-sm border-b border-gray-200 w-full py-3 px-4">
      <div className="container mx-auto flex justify-between items-center max-w-5xl">
        {/* Left side: Logo/Brand Link Only */}
        <div className="flex items-center">
          {/* Brand/Logo Link */}
          <Link
            to="/dashboard" // Link to parent dashboard (or appropriate default logged-in page)
            className="flex items-center text-xl font-semibold text-gray-700 hover:text-blue-600 transition duration-150"
          >
            <FontAwesomeIcon icon={faSchool} className="mr-2 text-blue-500" />
            School Check-in
          </Link>
          {/* Removed the div containing the NavLinks */}
        </div>

        {/* Right side: Logout Button */}
        <div>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition duration-200 text-sm font-medium shadow-sm hover:shadow-md flex items-center"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="mr-1 hidden sm:inline" />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;