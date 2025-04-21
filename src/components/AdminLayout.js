import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';

function AdminLayout() {
  const navigate = useNavigate();
  const adminUserName = localStorage.getItem('userName') || "Admin User"; // Use stored user name if available

  const handleLogout = () => {
    // Clear all authentication-related items from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    
    // Navigate to login page
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col fixed inset-y-0 left-0 z-30 overflow-y-auto">
        {/* Logo/Brand Area */}
        <div className="p-4 border-b flex items-center justify-center">
          <Link to="/admin" className="text-xl font-semibold text-gray-700 hover:text-blue-600 transition duration-150 flex items-center">
            <i className="fas fa-tachometer-alt mr-2 text-blue-500"></i>
            Admin Panel
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          <Link to="/admin" className="sidebar-link group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900">
            <i className="fas fa-tachometer-alt fa-fw mr-3 text-gray-400 group-hover:text-gray-500"></i>
            Dashboard
          </Link>
          <Link to="/admin/dismissal" className="sidebar-link group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900">
            <i className="fas fa-car fa-fw mr-3 text-gray-400 group-hover:text-gray-500"></i>
            Dismissal/Pickup
          </Link>
          <Link to="/admin/students" className="sidebar-link group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900">
            <i className="fas fa-user-graduate fa-fw mr-3 text-gray-400 group-hover:text-gray-500"></i>
            Students
          </Link>
          <Link to="/admin/parents" className="sidebar-link group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900">
            <i className="fas fa-user-friends fa-fw mr-3 text-gray-400 group-hover:text-gray-500"></i>
            Parents
          </Link>
          <Link to="/admin/reports" className="sidebar-link group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900">
            <i className="fas fa-chart-line fa-fw mr-3 text-gray-400 group-hover:text-gray-500"></i>
            Reports
          </Link>
          <Link to="/admin/messages" className="sidebar-link group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900">
            <i className="fas fa-comments fa-fw mr-3 text-gray-400 group-hover:text-gray-500"></i>
            Messages
          </Link>
          <Link to="/admin/settings" className="sidebar-link group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900">
            <i className="fas fa-cog fa-fw mr-3 text-gray-400 group-hover:text-gray-500"></i>
            Settings
          </Link>
        </nav>

        {/* User Info & Logout at bottom */}
        <div className="p-4 border-t mt-auto">
          <div className="mt-2 pt-2">
            <p className="text-sm font-medium text-gray-700">{adminUserName}</p>
            <button onClick={handleLogout} className="text-xs text-red-600 hover:underline mt-1">
              <i className="fas fa-sign-out-alt mr-1"></i> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 overflow-y-auto p-6 bg-gray-100">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;