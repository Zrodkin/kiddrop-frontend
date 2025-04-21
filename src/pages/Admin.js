import React, { useEffect, useState, useRef, useCallback } from "react"; // Added useRef, useCallback
import { useNavigate } from "react-router-dom";
import Chart from "chart.js/auto";
import ManualLogEntry from "../components/ManualLogEntry"; // Assuming these exist
import StudentManager from "../components/StudentManager"; // Assuming these exist
import { jwtDecode } from 'jwt-decode';
// Import Font Awesome icons if needed for UI elements
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTachometerAlt, faCar, faUserGraduate, faUserFriends, faChartLine, faHistory, faCog, faSignOutAlt, faExclamationTriangle, faSpinner, faSchool } from '@fortawesome/free-solid-svg-icons'; // Added faSchool back


function Admin() {
  const [activeSection, setActiveSection] = useState("dashboard-content");
  const [pageTitle, setPageTitle] = useState("Dashboard Overview");
  const [stats, setStats] = useState({ checkedIn: 0, checkedOut: 0, totalStudents: 0, alerts: 0 });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true); // Combined loading state
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [logs, setLogs] = useState([]);
  // const [logsLoading, setLogsLoading] = useState(true); // Can use combined loading state
  const [filteredStudents, setFilteredStudents] = useState([]);
  const year = new Date().getFullYear();
  const navigate = useNavigate();
  const chartInstanceRef = useRef(null); // Ref to store chart instance
  const canvasRef = useRef(null); // Ref for the canvas element

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // --- Fetch Initial Data ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(""); // Clear previous errors
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }
    // Verify role from token
    try {
        const decoded = jwtDecode(token);
        if (decoded.role !== 'admin') {
            navigate("/login"); // Or to an unauthorized page
            return;
        }
    } catch (err) {
        console.error("Token decode error:", err);
        localStorage.clear(); // Clear bad token
        navigate("/login");
        return;
    }


    try {
      // Fetch stats, students, and logs in parallel
      const [statsRes, studentsRes, logsRes] = await Promise.all([
        fetch(`${apiUrl}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/api/admin/students`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/api/admin/logs?limit=5`, { headers: { Authorization: `Bearer ${token}` } }) // Fetch initial logs for feed
      ]);

      // Process Stats
      if (!statsRes.ok) throw new Error(`Stats Error: ${statsRes.statusText}`);
      const statsData = await statsRes.json();
      setStats(statsData);

      // Process Students
      if (!studentsRes.ok) throw new Error(`Students Error: ${studentsRes.statusText}`);
      const studentsData = await studentsRes.json();
      if (Array.isArray(studentsData)) {
        setStudents(studentsData);
        setFilteredStudents(studentsData); // Initialize filter
      } else {
        setStudents([]);
        setFilteredStudents([]);
        console.warn("Unexpected student data format");
      }

      // Process Logs
      if (!logsRes.ok) throw new Error(`Logs Error: ${logsRes.statusText}`);
      const logsData = await logsRes.json();
      setLogs(logsData.logs || []); // Ensure logs is an array

    } catch (err) {
      console.error("Error fetching admin data:", err);
      setError(`Failed to load data: ${err.message}`);
      // Handle specific errors like 401/403 if needed
      if (err.message?.includes('401') || err.message?.includes('403')) {
          handleLogout(); // Logout if unauthorized
      }
    } finally {
      setLoading(false);
      // setLogsLoading(false); // No longer needed if using combined loading
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, apiUrl]); // Added navigate, apiUrl to dependencies

  useEffect(() => {
    fetchData();
  }, [fetchData]); // Run fetch data once on mount

  // --- Chart Rendering ---
  useEffect(() => {
    if (loading || error || !stats.totalStudents) {
       if (chartInstanceRef.current) {
           chartInstanceRef.current.destroy();
           chartInstanceRef.current = null;
       }
       return;
    };

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;

    const ctx = canvasElement.getContext('2d');
    const checkedIn = stats.checkedIn || 0;
    const checkedOut = stats.checkedOut || 0;
    const remaining = Math.max(0, stats.totalStudents - checkedIn - checkedOut);

    chartInstanceRef.current = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Current Status'],
            datasets: [
                { label: 'Checked In', data: [checkedIn], backgroundColor: 'rgba(16, 185, 129, 0.7)', borderColor: 'rgba(16, 185, 129, 1)', borderWidth: 1 },
                { label: 'Checked Out', data: [checkedOut], backgroundColor: 'rgba(239, 68, 68, 0.7)', borderColor: 'rgba(239, 68, 68, 1)', borderWidth: 1 },
                { label: 'Awaiting/Other', data: [remaining], backgroundColor: 'rgba(209, 213, 219, 0.7)', borderColor: 'rgba(209, 213, 219, 1)', borderWidth: 1 }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: { x: { stacked: true, title: { display: true, text: 'Number of Students' } }, y: { stacked: true } },
            plugins: { legend: { position: 'bottom' }, title: { display: false } }
        }
    });

    return () => {
        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
            chartInstanceRef.current = null;
        }
    };
  }, [loading, error, stats]);


  // --- Student Filtering ---
  useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    setFilteredStudents(
      students.filter(student =>
        student.name.toLowerCase().includes(lowerCaseQuery) ||
        student.grade.toLowerCase().includes(lowerCaseQuery)
      )
    );
  }, [searchQuery, students]);


  // --- Delete Student ---
  const handleDeleteStudent = async (id) => {
    if (!window.confirm("Are you sure you want to remove this student? This will also delete their logs.")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/admin/students/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Delete failed");
      alert("✅ Student deleted successfully");
      // Refetch data to update lists and stats
      fetchData();
    } catch (err) {
      console.error("Delete student error:", err);
      alert(`❌ ${err.message}`);
    }
  };

  // --- Logout ---
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  // --- Switch Active Section ---
  const switchSection = (sectionId, title) => {
    setActiveSection(sectionId);
    setPageTitle(title);
  };

  // --- Get Activity Feed Styles ---
  const getActivityStyles = (type) => {
    switch (type) {
      case "dropoff": return { icon: "arrow-down", style: "bg-green-50 border-green-400 text-green-600" };
      case "pickup": return { icon: "arrow-up", style: "bg-red-50 border-red-400 text-red-600" };
      default: return { icon: "info-circle", style: "bg-gray-50 border-gray-400 text-gray-600" };
    }
  };

   // --- Helper to get Status Badge Info ---
   // Added this helper for consistency in student table status display
   const getStatusInfo = (status) => {
    switch (status) {
      case "checked-in": return { text: "Checked In", icon: faCheckCircle, style: "bg-green-100 text-green-800" };
      case "checked-out": return { text: "Checked Out", icon: faSignOutAlt, style: "bg-red-100 text-red-800" };
      default: return { text: "Awaiting", icon: faHourglassStart, style: "bg-yellow-100 text-yellow-800" }; // Changed awaiting style
    }
  };

   // --- Helper to format date/time ---
   // Added this helper for consistency
   const formatDateTime = (dateString) => {
      if (!dateString) return '-';
      try {
          return new Date(dateString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit'});
      } catch (e) { return 'Invalid Date'; }
  };


  // --- Render Logic ---
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col fixed inset-y-0 left-0 z-30 overflow-y-auto">
        {/* Sidebar Content (Logo, Nav, User/Logout) */}
        <div className="p-4 border-b">
           <a href="#dashboard" onClick={(e) => { e.preventDefault(); switchSection('dashboard-content', 'Dashboard Overview'); }} className="text-xl font-semibold text-gray-700 hover:text-blue-600 transition duration-150 flex items-center">
               {/* Fixed icon reference */}
               <FontAwesomeIcon icon={faSchool} className="mr-3 text-blue-500 text-2xl" /> KidDrop Admin
           </a>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
            {/* Simplified Nav Link Structure */}
            {[
                { id: 'dashboard-content', title: 'Dashboard', icon: faTachometerAlt },
                { id: 'dismissal-content', title: 'Dismissal/Pickup Mgmt', icon: faCar },
                { id: 'students-content', title: 'Student Roster', icon: faUserGraduate },
                { id: 'parents-content', title: 'Parents/Guardians', icon: faUserFriends },
                { id: 'reports-content', title: 'Reports', icon: faChartLine },
                { id: 'logs-content', title: 'Activity Logs', icon: faHistory }
            ].map(item => (
                 <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`sidebar-link group flex items-center px-3 py-2.5 text-sm font-medium rounded-md ${activeSection === item.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}
                    onClick={(e) => { e.preventDefault(); switchSection(item.id, item.title); }}
                 >
                    <FontAwesomeIcon icon={item.icon} className={`fa-fw mr-3 ${activeSection === item.id ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
                    {item.title}
                 </a>
            ))}
        </nav>
        <div className="p-4 border-t mt-auto space-y-2">
            <a
                href="#settings"
                className={`sidebar-link group flex items-center px-3 py-2.5 text-sm font-medium rounded-md ${activeSection === 'settings-content' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}
                onClick={(e) => { e.preventDefault(); switchSection('settings-content', 'Settings'); }}
            >
                <FontAwesomeIcon icon={faCog} className={`fa-fw mr-3 ${activeSection === 'settings-content' ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
                Settings
            </a>
            <div className="pt-2 border-t">
                <p className="text-sm font-medium text-gray-700">Admin Portal</p>
                <button onClick={handleLogout} className="text-xs text-red-600 hover:underline mt-1 w-full text-left">
                    <FontAwesomeIcon icon={faSignOutAlt} className="mr-1" /> Logout
                </button>
            </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col ml-64"> {/* Offset for sidebar */}
        {/* Sticky Header within Main Area */}
        <header className="bg-white shadow-sm p-4 border-b sticky top-0 z-20">
          {/* Use max-width and padding consistent with main content area */}
          <div className="flex justify-between items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 id="page-title" className="text-xl font-semibold text-gray-800">{pageTitle}</h1>
            {/* Header Actions */}
            <div className="space-x-2">
              <button className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-1.5 px-3 rounded-md text-xs sm:text-sm transition duration-150 shadow-sm">
                <i className="fas fa-plus mr-1"></i> Manual Log
              </button>
              <button className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-1.5 px-3 rounded-md text-xs sm:text-sm transition duration-150 shadow-sm">
                <i className="fas fa-bullhorn mr-1"></i> Send Alert
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Main Content */}
        {/* Removed p-6 from here */}
        <main id="main-content" className="flex-1 overflow-y-auto bg-gray-100">
          {/* Centered Container with Max Width and Padding - THIS IS THE FIX */}
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="text-center text-gray-600 py-16">
                  <FontAwesomeIcon icon={faSpinner} spin size="3x" className="text-blue-500 mb-3" />
                  <p>Loading dashboard data...</p>
              </div>
            ) : error ? (
              <div className="text-center text-red-600 py-16 bg-red-50 p-4 rounded-md border border-red-300 max-w-xl mx-auto">
                  <FontAwesomeIcon icon={faExclamationTriangle} size="2x" className="mb-3"/>
                  <p className="font-semibold">Failed to load data:</p>
                  <p className="text-sm">{error}</p>
              </div>
            ) : (
              // Container for conditional sections
              <>
                {/* Dashboard Content */}
                <div id="dashboard-content" className={`content-section ${activeSection !== 'dashboard-content' ? 'hidden' : ''}`}>
                  {/* Stats Grid */}
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                       {/* Stat Cards ... */}
                         <div className="bg-white p-4 rounded-lg shadow border border-gray-200"> <p className="text-sm font-medium text-gray-500">Checked In Today</p> <p className="text-3xl font-semibold text-green-700 mt-1">{stats.checkedIn} / {stats.totalStudents}</p> <p className="text-xs text-gray-400 mt-1">5 Late Arrivals</p> </div>
                         <div className="bg-white p-4 rounded-lg shadow border border-gray-200"> <p className="text-sm font-medium text-gray-500">Checked Out</p> <p className="text-3xl font-semibold text-red-700 mt-1">{stats.checkedOut}</p> <p className="text-xs text-gray-400 mt-1">{Math.max(0, stats.totalStudents - stats.checkedIn - stats.checkedOut)} Awaiting</p> </div>
                         <div className="bg-white p-4 rounded-lg shadow border border-gray-200"> <p className="text-sm font-medium text-gray-500">Total Students</p> <p className="text-3xl font-semibold text-blue-700 mt-1">{stats.totalStudents}</p> <p className="text-xs text-gray-400 mt-1">Active Roster</p> </div>
                         <div className="bg-white p-4 rounded-lg shadow border border-red-300"> <p className="text-sm font-medium text-red-600 flex items-center"><FontAwesomeIcon icon={faExclamationTriangle} className="mr-1 animate-pulse"/> Active Alerts</p> <p className="text-3xl font-semibold text-red-700 mt-1">{stats.alerts}</p> <p className="text-xs text-red-500 mt-1 hover:underline cursor-pointer">View Alerts</p> </div>
                   </div>
                   {/* Chart & Activity Feed */}
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                       <div className="lg:col-span-2 bg-white p-5 rounded-lg shadow border border-gray-200">
                           <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Student Status</h3>
                           <div className="relative" style={{ height: "300px" }}>
                               <canvas ref={canvasRef} id="statusChart"></canvas>
                           </div>
                       </div>
                       <div className="bg-white p-5 rounded-lg shadow border border-gray-200 flex flex-col">
                           <h3 className="text-lg font-semibold text-gray-800 mb-4">Activity Feed</h3>
                           <div className="activity-feed flex-1 overflow-y-auto space-y-3 pr-2" style={{ maxHeight: "300px" }}>
                               {logs.length === 0 ? ( <p className="text-center text-gray-500 py-4">No recent activity</p> ) : (
                                   logs.map((log) => { /* ... log mapping ... */
                                       const styleInfo = getActivityStyles(log.type);
                                       const time = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                       const studentName = log.studentId?.name ?? "N/A";
                                       const parentName = log.parentId?.name ?? "";
                                       return ( <div key={log._id} className={`text-sm p-2 rounded ${styleInfo.style} border-l-4`}> <p> <i className={`fas fa-${styleInfo.icon} mr-1`}></i> <strong>{log.type === "dropoff" ? "Drop-off:" : "Pick-up:"}</strong> {" "}{studentName}{parentName ? ` by ${parentName}` : ""} <span className="text-gray-500 text-xs float-right">{time}</span> </p> </div> );
                                   })
                               )}
                           </div>
                           <button onClick={() => switchSection('logs-content', 'Activity Logs')} className="mt-3 text-sm text-blue-600 hover:text-blue-800 hover:underline text-center w-full" > View all activity </button>
                       </div>
                   </div>
                </div>

                {/* Dismissal Content */}
                <div id="dismissal-content" className={`content-section ${activeSection !== 'dismissal-content' ? 'hidden' : ''}`}>
                    {/* Added h2 matching others */}
                    <h2 className="text-2xl font-semibold mb-4 text-gray-800">Dismissal & Pickup Management</h2>
                    <p className="text-gray-600 mb-4">Manage afternoon dismissal process and track student pickups.</p>
                    {/* Assuming ManualLogEntry is a component you have */}
                    <ManualLogEntry students={students} />
                </div>

                {/* Students Content */}
                <div id="students-content" className={`content-section ${activeSection !== 'students-content' ? 'hidden' : ''}`}>
                     {/* Added h2 matching others */}
                     <h2 className="text-2xl font-semibold mb-4 text-gray-800">Student Roster</h2>
                     {/* Student Roster Table and Search */}
                     <div className="flex justify-between items-center mb-4">
                         <p className="text-gray-600">Manage all students in the system</p> {/* Removed text-lg */}
                         <input
                           type="text"
                           placeholder="Search students..."
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                           className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                         />
                     </div>
                     <div className="bg-white rounded-lg shadow overflow-x-auto border border-gray-200">
                         <table className="w-full min-w-[640px]"> {/* Added min-w */}
                             <thead className="bg-gray-50">
                                 <tr>
                                     {/* Adjusted widths slightly, added padding */}
                                     <th className="w-auto text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                                     <th className="w-1/6 text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                                     <th className="w-1/4 text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                     <th className="w-1/4 text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                                     <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Actions</th>
                                 </tr>
                             </thead>
                             <tbody className="bg-white divide-y divide-gray-200">
                                 {filteredStudents.map((student) => (
                                     <tr key={student._id} className="hover:bg-gray-50">
                                         <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                                         <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{student.grade}</td>
                                         <td className="px-4 py-3 whitespace-nowrap">
                                             {/* Status Badge Logic using helper */}
                                             <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusInfo(student.status).style}`}>
                                                 <FontAwesomeIcon icon={getStatusInfo(student.status).icon} className="mr-1" />
                                                 {getStatusInfo(student.status).text}
                                             </span>
                                         </td>
                                         <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDateTime(student.lastActivity)}</td>
                                         <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                             {/* Centered action buttons */}
                                             <div className="flex justify-center gap-3">
                                                 <button onClick={() => alert(`Edit ${student.name}`)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                                 <button onClick={() => handleDeleteStudent(student._id)} className="text-red-600 hover:text-red-900">Delete</button>
                                             </div>
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                         <div className="p-4 border-t border-gray-200 text-sm text-gray-600">
                             Showing {filteredStudents.length} of {students.length} students.
                         </div>
                     </div>
                     {/* Placeholder for Add/Manage Student component */}
                     {/* <StudentManager /> */}
                </div>

                {/* Other Placeholder Sections */}
                 <div id="parents-content" className={`content-section ${activeSection !== 'parents-content' ? 'hidden' : ''}`}> <h2 className="text-2xl font-semibold mb-4 text-gray-800">Parent/Guardian Management</h2> <div className="bg-white p-5 rounded-lg shadow border border-gray-200"> <p className="text-gray-600">Parent management functionality will be implemented here.</p> </div> </div>
                 <div id="reports-content" className={`content-section ${activeSection !== 'reports-content' ? 'hidden' : ''}`}> <h2 className="text-2xl font-semibold mb-4 text-gray-800">Reports</h2> <div className="bg-white p-5 rounded-lg shadow border border-gray-200"> <p className="text-gray-600">Reporting functionality will be implemented here.</p> </div> </div>
                 <div id="logs-content" className={`content-section ${activeSection !== 'logs-content' ? 'hidden' : ''}`}> <h2 className="text-2xl font-semibold mb-4 text-gray-800">Activity Logs</h2> <div className="bg-white p-5 rounded-lg shadow border border-gray-200"> <p className="text-gray-600">Full log history will be displayed here.</p> </div> </div>
                 <div id="settings-content" className={`content-section ${activeSection !== 'settings-content' ? 'hidden' : ''}`}> <h2 className="text-2xl font-semibold mb-4 text-gray-800">Settings</h2> <div className="bg-white p-5 rounded-lg shadow border border-gray-200"> <p className="text-gray-600">System settings will be configured here.</p> </div> </div>
              </>
            )}
          </div> {/* End max-width container */}
        </main>

        {/* Removed Footer */}
      </div> {/* End main content flex container */}
    </div> // End main flex container
  );
}

export default Admin;
