import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSchool, faSignOutAlt, faBell } from '@fortawesome/free-solid-svg-icons';

function Navbar() {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        
        if (!token) {
          console.log("No token found");
          setLoading(false);
          return;
        }
        
        // Use the full Heroku URL instead of relative path
        const apiUrl = process.env.REACT_APP_API_URL || 'https://kiddrop-7652818b8f01.herokuapp.com';
        const res = await fetch(`${apiUrl}/api/parent/notifications`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (!res.ok) {
          console.log(`API responded with status: ${res.status}`);
          setLoading(false);
          return;
        }

        const data = await res.json();
        
        if (Array.isArray(data)) {
          const unread = data.filter(n => !n.read).length;
          setUnreadCount(unread);
          console.log(`Found ${unread} unread notifications`);
        } else {
          console.error("API response is not an array:", data);
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUnread();
    
    // Set up polling interval for refreshing notification count
    const interval = setInterval(fetchUnread, 60000); // check every minute
    
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow w-full py-4 px-4 sm:px-6 border-b border-gray-200">
      <div className="container mx-auto flex justify-between items-center max-w-5xl">
        {/* Left side: Brand */}
        <div className="flex items-center">
          <Link
            to="/dashboard"
            className="flex items-center text-xl font-bold text-slate-800 hover:text-blue-700 transition duration-150 ease-in-out"
          >
            <FontAwesomeIcon icon={faSchool} className="mr-2 text-blue-600 text-2xl" />
            School Check-in
          </Link>
        </div>

        {/* Right side: Inbox + Logout */}
        <div className="flex items-center space-x-4">
          {/* Inbox Icon */}
          <Link to="/inbox" className="relative text-gray-700 hover:text-blue-600 transition">
            <FontAwesomeIcon icon={faBell} className="text-xl" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </Link>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
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