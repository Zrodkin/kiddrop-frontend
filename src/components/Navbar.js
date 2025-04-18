// frontend/src/components/Navbar.js
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <nav className="bg-white text-gray-800 p-4 shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto flex justify-between items-center max-w-5xl">
        <div className="flex items-center space-x-6">
          <a
            href="/dashboard"
            className="text-xl font-semibold text-gray-700 hover:text-blue-600 transition duration-150"
          >
            <i className="fas fa-school mr-2 text-blue-500"></i> School Check-in
          </a>

          <div className="hidden md:flex items-center space-x-4">
            <a
              href="/dashboard"
              className={`text-gray-600 hover:text-blue-600 transition duration-150 ${
                location.pathname === "/dashboard" ? "nav-link-active" : ""
              }`}
            >
              <i className="fas fa-home mr-1"></i> Home
            </a>
            {/* You can add more links here later if needed */}
          </div>
        </div>

        <div>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition duration-200 text-sm font-medium shadow-sm hover:shadow-md"
          >
            <i className="fas fa-sign-out-alt mr-1 hidden sm:inline"></i> Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
