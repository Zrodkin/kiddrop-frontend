import React from 'react';
// Import Link for sidebar navigation and Outlet for rendering child routes
import { Link, Outlet } from 'react-router-dom';
// Import Font Awesome library and specific icons (ensure Font Awesome is set up in your project)
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTachometerAlt, faCar, faUserGraduate, faUserFriends, faChartLine, faComments, faCog, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

// Define the AdminLayout functional component
function AdminLayout() {

  // In a real app, you'd fetch the admin user's name here, maybe from context or auth state
  const adminUserName = "Admin User"; // Placeholder

  // Placeholder function for logout - implement actual logout logic later
  const handleLogout = () => {
    console.log("Logout triggered - implement logic here!");
    // Example: clear token, redirect to login
    alert('Logout logic needed!');
  };

  // This is the JSX structure that defines what the component renders
  return (
    // Main container: Uses Flexbox to arrange sidebar and main content side-by-side, takes full screen height
    <div className="flex h-screen bg-gray-100">

      {/* Sidebar */}
      {/* Fixed width, white background, shadow, stays fixed on the left, handles its own scrolling if content overflows */}
      <aside className="w-64 bg-white shadow-md flex flex-col fixed inset-y-0 left-0 z-30 overflow-y-auto">
          {/* Logo/Brand Area */}
          <div className="p-4 border-b flex items-center justify-center">
              {/* Link to the main admin dashboard page */}
              <Link to="/admin" className="text-xl font-semibold text-gray-700 hover:text-blue-600 transition duration-150 flex items-center">
                 {/* Using Font Awesome icon */}
                 <FontAwesomeIcon icon={faTachometerAlt} className="mr-2 text-blue-500" />
                 Admin Panel
              </Link>
          </div>

          {/* Navigation Links */}
          {/* flex-1 allows this nav section to grow and fill available space */}
          {/* px-2 py-4 adds padding, space-y-1 adds vertical space between links */}
          {/* TODO: Add active link highlighting logic based on current route */}
          <nav className="flex-1 px-2 py-4 space-y-1">
              {/* Each Link navigates to a specific admin route */}
              <Link to="/admin" className="sidebar-link group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                  <FontAwesomeIcon icon={faTachometerAlt} className="fa-fw mr-3 text-gray-400 group-hover:text-gray-500 sidebar-icon" />
                  Dashboard
              </Link>
              <Link to="/admin/dismissal" className="sidebar-link group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                  <FontAwesomeIcon icon={faCar} className="fa-fw mr-3 text-gray-400 group-hover:text-gray-500 sidebar-icon" />
                  Dismissal/Pickup
              </Link>
              <Link to="/admin/students" className="sidebar-link group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                  <FontAwesomeIcon icon={faUserGraduate} className="fa-fw mr-3 text-gray-400 group-hover:text-gray-500 sidebar-icon" />
                  Students
              </Link>
              <Link to="/admin/parents" className="sidebar-link group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                  <FontAwesomeIcon icon={faUserFriends} className="fa-fw mr-3 text-gray-400 group-hover:text-gray-500 sidebar-icon" />
                  Parents
              </Link>
              <Link to="/admin/reports" className="sidebar-link group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                   <FontAwesomeIcon icon={faChartLine} className="fa-fw mr-3 text-gray-400 group-hover:text-gray-500 sidebar-icon" />
                  Reports
              </Link>
               <Link to="/admin/messages" className="sidebar-link group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                  <FontAwesomeIcon icon={faComments} className="fa-fw mr-3 text-gray-400 group-hover:text-gray-500 sidebar-icon" />
                  Messages {/* Add badge logic later */}
              </Link>
               <Link to="/admin/settings" className="sidebar-link group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                  <FontAwesomeIcon icon={faCog} className="fa-fw mr-3 text-gray-400 group-hover:text-gray-500 sidebar-icon" />
                  Settings
              </Link>
          </nav>

          {/* User Info & Logout at bottom */}
          {/* mt-auto pushes this section to the bottom */}
          <div className="p-4 border-t mt-auto">
               <div className="mt-2 pt-2">
                  {/* Display logged-in admin user's name (placeholder) */}
                  <p className="text-sm font-medium text-gray-700">{adminUserName}</p>
                  {/* Logout Button */}
                  <button onClick={handleLogout} className="text-xs text-red-600 hover:underline mt-1">
                     <FontAwesomeIcon icon={faSignOutAlt} className="mr-1"/> Logout
                  </button>
               </div>
          </div>
      </aside>

      {/* Main Content Area */}
      {/* flex-1 allows this area to grow and take remaining space */}
      {/* ml-64 offsets the width of the fixed sidebar */}
      {/* overflow-y-auto allows this area to scroll independently if content is tall */}
      {/* p-6 adds padding around the content */}
      <main className="flex-1 ml-64 overflow-y-auto p-6 bg-gray-100">
        {/* Outlet Component from React Router DOM */}
        {/* This is the placeholder where the content of the nested child routes */}
        {/* (e.g., the Admin Dashboard component, Student list component, Settings component) */}
        {/* will be rendered based on the current URL path. */}
        <Outlet />
      </main>

    </div>
  );
}

// Export the component for use in other files
export default AdminLayout;

