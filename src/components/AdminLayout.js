// frontend/src/components/AdminLayout.js
import React from 'react';
// Import Link/Outlet for routing, useNavigate for button actions
import { Link, Outlet, useNavigate } from 'react-router-dom';
// Import Font Awesome library and specific icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTachometerAlt, faCar, faUserGraduate, faUserFriends, faChartLine,
  faHistory, faCog, faSignOutAlt, faSchool, faPlus, faBullhorn // Added faPlus, faBullhorn
} from '@fortawesome/free-solid-svg-icons';

function AdminLayout() {
  const navigate = useNavigate(); // Hook for navigation

  // --- Placeholder User Info & Logout ---
  const adminUserName = "Admin User"; // Replace with actual user data later
  const handleLogout = () => {
    console.log("Logging out...");
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  // --- Navigation Handlers for Header Buttons ---
  const goToManualLog = () => {
    // TODO: Update '/admin/manual-log' to your actual route for this page
    console.log("Navigating to Manual Log...");
    // navigate('/admin/manual-log');
    alert("Manual Log page route not defined yet."); // Placeholder action
  };

  const goToSendAlert = () => {
    console.log("Navigating to Send Alert...");
    navigate('/admin/send-alert'); // Navigate to the route defined in App.js
  };


  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col fixed inset-y-0 left-0 z-30 overflow-y-auto">
         {/* Sidebar Logo */}
         <div className="p-4 border-b flex items-center justify-center">
             <Link to="/admin" className="text-xl font-semibold text-gray-700 hover:text-blue-600 transition duration-150 flex items-center">
                <FontAwesomeIcon icon={faSchool} className="mr-2 text-blue-500" /> Admin Panel
             </Link>
         </div>
         {/* Sidebar Navigation */}
         <nav className="flex-1 px-2 py-4 space-y-1">
            {/* Use NavLink here later for active styling if needed */}
            <Link to="/admin" className="sidebar-link group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900"> <FontAwesomeIcon icon={faTachometerAlt} className="fa-fw mr-3 text-gray-400 group-hover:text-gray-500 sidebar-icon" /> Dashboard </Link>
            <Link to="/admin/dismissal" className="sidebar-link group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900"> <FontAwesomeIcon icon={faCar} className="fa-fw mr-3 text-gray-400 group-hover:text-gray-500 sidebar-icon" /> Dismissal/Pickup </Link>
            <Link to="/admin/students" className="sidebar-link group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900"> <FontAwesomeIcon icon={faUserGraduate} className="fa-fw mr-3 text-gray-400 group-hover:text-gray-500 sidebar-icon" /> Students </Link>
            <Link to="/admin/parents" className="sidebar-link group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900"> <FontAwesomeIcon icon={faUserFriends} className="fa-fw mr-3 text-gray-400 group-hover:text-gray-500 sidebar-icon" /> Parents </Link>
            <Link to="/admin/reports" className="sidebar-link group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900"> <FontAwesomeIcon icon={faChartLine} className="fa-fw mr-3 text-gray-400 group-hover:text-gray-500 sidebar-icon" /> Reports </Link>
            <Link to="/admin/logs" className="sidebar-link group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900"> <FontAwesomeIcon icon={faHistory} className="fa-fw mr-3 text-gray-400 group-hover:text-gray-500 sidebar-icon" /> Activity Logs </Link>
            {/* Add a link for Send Alert if desired in sidebar too */}
            <Link to="/admin/send-alert" className="sidebar-link group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900"> <FontAwesomeIcon icon={faBullhorn} className="fa-fw mr-3 text-gray-400 group-hover:text-gray-500 sidebar-icon" /> Send Alert </Link>
         </nav>
         {/* Sidebar Settings & Logout */}
         <div className="p-4 border-t mt-auto space-y-2">
            <Link to="/admin/settings" className="sidebar-link group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900"> <FontAwesomeIcon icon={faCog} className="fa-fw mr-3 text-gray-400 group-hover:text-gray-500 sidebar-icon" /> Settings </Link>
            <div className="pt-2 border-t"> <p className="text-sm font-medium text-gray-700">{adminUserName}</p> <button onClick={handleLogout} className="text-xs text-red-600 hover:underline mt-1 w-full text-left"> <FontAwesomeIcon icon={faSignOutAlt} className="mr-1"/> Logout </button> </div>
         </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Sticky Header within Main Area */}
        <header className="bg-white shadow-sm p-4 border-b sticky top-0 z-20">
          <div className="flex justify-between items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Page Title - This will be updated by the child component via context or props later */}
            <h1 id="page-title" className="text-xl font-semibold text-gray-800">Admin Dashboard</h1>
            {/* Header Action Buttons */}
            <div className="space-x-2">
              <button
                 onClick={goToManualLog} // Added onClick
                 className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-1.5 px-3 rounded-md text-xs sm:text-sm transition duration-150 shadow-sm"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-1" /> Manual Log
              </button>
              <button
                 onClick={goToSendAlert} // Added onClick
                 className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-1.5 px-3 rounded-md text-xs sm:text-sm transition duration-150 shadow-sm"
              >
                <FontAwesomeIcon icon={faBullhorn} className="mr-1" /> Send Alert
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Main Content - Renders child routes */}
        <main id="main-content" className="flex-1 overflow-y-auto bg-gray-100">
          {/* Container for consistent padding and max-width */}
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {/* Child route component renders here */}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
