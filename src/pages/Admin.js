// frontend/src/pages/Admin.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Chart from "chart.js/auto";
import ManualLogEntry from "../components/ManualLogEntry";
import StudentManager from "../components/StudentManager";

function Admin() {
  const [activeSection, setActiveSection] = useState("dashboard-content");
  const [pageTitle, setPageTitle] = useState("Dashboard Overview");
  const [stats, setStats] = useState({
    checkedIn: 0,
    checkedOut: 0,
    totalStudents: 0,
    alerts: 0
  });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const year = new Date().getFullYear();
  const navigate = useNavigate();

  // Initialize chart reference
  const chartRef = React.useRef(null);
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "admin") {
      navigate("/login");
      return;
    }

    const fetchStats = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setStats(data);
      } catch (err) {
        setError(err.message);
      }
    };

    const fetchStudents = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/students`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setStudents(data);
        setFilteredStudents(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    fetchStudents();
    fetchLogs();
  }, [navigate]);

  // Effect for initializing and updating chart
  useEffect(() => {
    if (loading || activeSection !== "dashboard-content") return;
    
    // Destroy previous chart if it exists
    if (chartRef.current) {
      chartRef.current.destroy();
    }
    
    const statusCtx = document.getElementById('statusChart')?.getContext('2d');
    if (!statusCtx) return;
    
    chartRef.current = new Chart(statusCtx, {
      type: 'bar',
      data: {
        labels: ['Current Status'],
        datasets: [
          {
            label: 'Checked In',
            data: [stats.checkedIn],
            backgroundColor: 'rgba(16, 185, 129, 0.7)', // green
            borderColor: 'rgba(16, 185, 129, 1)',
            borderWidth: 1
          },
          {
            label: 'Checked Out / Dismissed',
            data: [stats.checkedOut],
            backgroundColor: 'rgba(239, 68, 68, 0.7)', // red
            borderColor: 'rgba(239, 68, 68, 1)',
            borderWidth: 1
          },
          {
            label: 'Absent / Not Arrived',
            data: [stats.totalStudents - stats.checkedIn - stats.checkedOut],
            backgroundColor: 'rgba(209, 213, 219, 0.7)', // gray
            borderColor: 'rgba(209, 213, 219, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            title: { display: true, text: 'Number of Students' }
          },
          y: {
            stacked: true
          }
        },
        plugins: {
          legend: { position: 'bottom' },
          title: { display: false }
        }
      }
    });
    
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [loading, stats, activeSection]);

  // Search handler
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student => 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.grade.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.status.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  }, [searchQuery, students]);

  const handleDeleteStudent = async (id) => {
    const confirmed = window.confirm("Are you sure you want to remove this student from the system?");
    if (!confirmed) return;

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/students/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert("✅ Student deleted successfully");

      setStudents(prev => prev.filter((s) => s._id !== id));
    } catch (err) {
      alert(`❌ ${err.message}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  const fetchLogs = async () => {
    try {
      setLogsLoading(true);
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/logs?limit=5`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setLogs(data.logs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLogsLoading(false);
    }
  };

  const switchSection = (sectionId, title) => {
    setActiveSection(sectionId);
    setPageTitle(title);
  };

  // Get icon and style for activity feed item
  const getActivityStyles = (type) => {
    switch (type) {
      case "dropoff":
        return { icon: "arrow-down", bgColor: "bg-green-50", borderColor: "border-green-400", textColor: "text-green-600" };
      case "pickup":
        return { icon: "arrow-up", bgColor: "bg-red-50", borderColor: "border-red-400", textColor: "text-red-600" };
      default:
        return { icon: "info-circle", bgColor: "bg-gray-50", borderColor: "border-gray-400", textColor: "text-gray-600" };
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col fixed inset-y-0 left-0 z-30 overflow-y-auto">
        <div className="p-4 border-b">
          <a href="#" className="text-2xl font-semibold text-gray-700 hover:text-blue-600 transition duration-150 flex items-center">
            <i className="fas fa-school mr-3 text-blue-500 text-3xl"></i> KidDrop
          </a>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          <a 
            href="#dashboard" 
            className={`sidebar-link group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900 ${activeSection === 'dashboard-content' ? 'bg-blue-50 text-blue-700 font-semibold' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              switchSection('dashboard-content', 'Dashboard Overview');
            }}
          >
            <i className={`fas fa-tachometer-alt fa-fw mr-3 ${activeSection === 'dashboard-content' ? 'text-blue-700' : 'text-gray-400'}`}></i>
            Dashboard
          </a>
          <a 
            href="#dismissal" 
            className={`sidebar-link group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900 ${activeSection === 'dismissal-content' ? 'bg-blue-50 text-blue-700 font-semibold' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              switchSection('dismissal-content', 'Dismissal & Pickup Management');
            }}
          >
            <i className={`fas fa-car fa-fw mr-3 ${activeSection === 'dismissal-content' ? 'text-blue-700' : 'text-gray-400'}`}></i>
            Dismissal/Pickup Mgmt
          </a>
          <a 
            href="#students" 
            className={`sidebar-link group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900 ${activeSection === 'students-content' ? 'bg-blue-50 text-blue-700 font-semibold' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              switchSection('students-content', 'Student Roster');
            }}
          >
            <i className={`fas fa-user-graduate fa-fw mr-3 ${activeSection === 'students-content' ? 'text-blue-700' : 'text-gray-400'}`}></i>
            Student Roster
          </a>
          <a 
            href="#parents" 
            className={`sidebar-link group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900 ${activeSection === 'parents-content' ? 'bg-blue-50 text-blue-700 font-semibold' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              switchSection('parents-content', 'Parents/Guardians');
            }}
          >
            <i className={`fas fa-user-friends fa-fw mr-3 ${activeSection === 'parents-content' ? 'text-blue-700' : 'text-gray-400'}`}></i>
            Parents/Guardians
          </a>
          <a 
            href="#reports" 
            className={`sidebar-link group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900 ${activeSection === 'reports-content' ? 'bg-blue-50 text-blue-700 font-semibold' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              switchSection('reports-content', 'Reports');
            }}
          >
            <i className={`fas fa-chart-line fa-fw mr-3 ${activeSection === 'reports-content' ? 'text-blue-700' : 'text-gray-400'}`}></i>
            Reports
          </a>
          <a 
            href="#logs" 
            className={`sidebar-link group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900 ${activeSection === 'logs-content' ? 'bg-blue-50 text-blue-700 font-semibold' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              switchSection('logs-content', 'Activity Logs');
            }}
          >
            <i className={`fas fa-history fa-fw mr-3 ${activeSection === 'logs-content' ? 'text-blue-700' : 'text-gray-400'}`}></i>
            Activity Logs
          </a>
        </nav>

        <div className="p-4 border-t mt-auto">
          <a 
            href="#settings" 
            className={`sidebar-link group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900 ${activeSection === 'settings-content' ? 'bg-blue-50 text-blue-700 font-semibold' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              switchSection('settings-content', 'Settings');
            }}
          >
            <i className={`fas fa-cog fa-fw mr-3 ${activeSection === 'settings-content' ? 'text-blue-700' : 'text-gray-400'}`}></i>
            Settings
          </a>
          <div className="mt-2 pt-2 border-t">
            <p className="text-sm font-medium text-gray-700">Admin Portal</p>
            <button 
              onClick={handleLogout}
              className="text-xs text-red-600 hover:underline mt-1"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-64">
        <header className="bg-white shadow-sm p-4 border-b sticky top-0 z-20">
          <div className="flex justify-between items-center">
            <h1 id="page-title" className="text-xl font-semibold text-gray-800">{pageTitle}</h1>
            <div>
              <button className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg text-sm transition duration-150 shadow-sm mr-2">
                <i className="fas fa-clipboard-check mr-1"></i> Manual Log Entry
              </button>
              <button className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-lg text-sm transition duration-150 shadow-sm">
                <i className="fas fa-bullhorn mr-1"></i> Send Alert
              </button>
            </div>
          </div>
        </header>

        <main id="main-content" className="flex-1 p-6 overflow-y-auto bg-gray-100">
          {loading ? (
            <p className="text-center text-gray-600 py-8">Loading dashboard data...</p>
          ) : error ? (
            <p className="text-center text-red-600 py-8">{error}</p>
          ) : (
            <>
              {/* Dashboard Content */}
              <div id="dashboard-content" className={`content-section ${activeSection !== 'dashboard-content' ? 'hidden' : ''}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                  <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                    <p className="text-sm font-medium text-gray-500">Checked In Today</p>
                    <p className="text-3xl font-semibold text-green-700 mt-1">{stats.checkedIn} / {stats.totalStudents}</p>
                    <p className="text-xs text-gray-400 mt-1">Updated in real-time</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                    <p className="text-sm font-medium text-gray-500">Checked Out</p>
                    <p className="text-3xl font-semibold text-red-700 mt-1">{stats.checkedOut}</p>
                    <p className="text-xs text-gray-400 mt-1">{stats.totalStudents - stats.checkedOut} Remaining</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                    <p className="text-sm font-medium text-gray-500">Total Students</p>
                    <p className="text-3xl font-semibold text-blue-700 mt-1">{stats.totalStudents}</p>
                    <p className="text-xs text-gray-400 mt-1">In School Database</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow border border-red-300">
                    <p className="text-sm font-medium text-red-600 flex items-center">
                      <i className="fas fa-exclamation-triangle mr-1 animate-pulse"></i> Active Alerts
                    </p>
                    <p className="text-3xl font-semibold text-red-700 mt-1">{stats.alerts}</p>
                    <p className="text-xs text-red-500 mt-1 hover:underline cursor-pointer">View Alerts</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  <div className="lg:col-span-2 bg-white p-5 rounded-lg shadow border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Student Status</h3>
                    <div style={{ height: "300px" }}>
                      <canvas id="statusChart"></canvas>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-lg shadow border border-gray-200 flex flex-col">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Activity Feed</h3>
                    <div className="activity-feed flex-1 overflow-y-auto space-y-3 pr-2" style={{ maxHeight: "300px" }}>
                      {logsLoading ? (
                        <p className="text-center text-gray-500 py-4">Loading activity logs...</p>
                      ) : logs.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">No recent activity</p>
                      ) : (
                        logs.map((log) => {
                          const style = getActivityStyles(log.type);
                          const time = new Date(log.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          });
                          
                          // Safely access student and parent names
                          const studentName = log.studentId && typeof log.studentId === 'object' ? log.studentId.name : "Unknown Student";
                          const parentName = log.parentId && typeof log.parentId === 'object' ? log.parentId.name : "";
                          
                          return (
                            <div key={log._id} className={`text-sm p-2 rounded ${style.bgColor} border-l-4 ${style.borderColor}`}>
                              <p>
                                <i className={`fas fa-${style.icon} ${style.textColor} mr-1`}></i>
                                <strong>
                                  {log.type === "dropoff" ? "Drop-off:" : "Pick-up:"}
                                </strong>
                                {" "}
                                {studentName}
                                {parentName ? ` by ${parentName}` : ""}
                                <span className="text-gray-500 text-xs float-right">{time}</span>
                              </p>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <button 
                      onClick={() => switchSection('logs-content', 'Activity Logs')}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-800 hover:underline text-center"
                    >
                      View all activity
                    </button>
                  </div>
                </div>
              </div>

              {/* Dismissal Content */}
              <div id="dismissal-content" className={`content-section ${activeSection !== 'dismissal-content' ? 'hidden' : ''}`}>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Dismissal & Pickup Management</h2>
                <p className="text-gray-600 mb-4">Manage afternoon dismissal process and track student pickups.</p>
                
                <ManualLogEntry students={students} />
              </div>

              {/* Students Content */}
              <div id="students-content" className={`content-section ${activeSection !== 'students-content' ? 'hidden' : ''}`}>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Student Roster</h2>
                
                <div className="flex justify-between items-center mb-4">
                  <p className="text-gray-600">Manage all students in the system</p>
                  <div>
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                  <table className="w-full table-fixed">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="w-1/4 text-left px-4 py-2">Student Name</th>
                        <th className="w-1/6 text-left px-4 py-2">Grade</th>
                        <th className="w-1/4 text-left px-4 py-2">Status</th>
                        <th className="w-1/3 text-left px-4 py-2">Last Activity Time</th>
                        <th className="text-left px-4 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student) => (
                        <tr key={student._id} className="hover:bg-blue-50">
                          <td className="px-4 py-2">{student.name}</td>
                          <td className="px-4 py-2">{student.grade}</td>
                          <td className="px-4 py-2">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                student.status === "checked-in"
                                  ? "bg-green-100 text-green-800"
                                  : student.status === "checked-out"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              <i
                                className={`fas ${
                                  student.status === "checked-in"
                                    ? "fa-check-circle"
                                    : student.status === "checked-out"
                                    ? "fa-sign-out-alt"
                                    : "fa-clock"
                                } mr-1`}
                              ></i>
                              {student.status.replace("-", " ")}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            {student.lastActivity
                              ? new Date(student.lastActivity).toLocaleTimeString()
                              : "-"}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex gap-3">
                              <button 
                                onClick={() => switchSection('logs-content', 'Activity Logs')}
                                className="text-blue-600 hover:underline text-sm"
                              >
                                View Log
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(student._id)}
                                className="text-red-600 hover:underline text-sm"
                              >
                                Delete
                              </button>
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
                
                <div className="mt-6">
                  <StudentManager />
                </div>
              </div>

              {/* Parents Content */}
              <div id="parents-content" className={`content-section ${activeSection !== 'parents-content' ? 'hidden' : ''}`}>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Parent/Guardian Management</h2>
                <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
                  <p className="text-gray-600">Parent management functionality will be implemented here.</p>
                </div>
              </div>

              {/* Reports Content */}
              <div id="reports-content" className={`content-section ${activeSection !== 'reports-content' ? 'hidden' : ''}`}>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Reports</h2>
                <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
                  <p className="text-gray-600">Reporting functionality will be implemented here.</p>
                </div>
              </div>

              {/* Logs Content */}
              <div id="logs-content" className={`content-section ${activeSection !== 'logs-content' ? 'hidden' : ''}`}>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Activity Logs</h2>
                <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
                  <p className="text-gray-600">Full log history will be displayed here.</p>
                </div>
              </div>

              {/* Settings Content */}
              <div id="settings-content" className={`content-section ${activeSection !== 'settings-content' ? 'hidden' : ''}`}>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Settings</h2>
                <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
                  <p className="text-gray-600">System settings will be configured here.</p>
                </div>
              </div>
            </>
          )}
        </main>

        <footer className="text-center text-gray-500 text-sm py-4 bg-white border-t">
          &copy; {year} KidDrop School Check-in System | Admin Portal
        </footer>
      </div>
    </div>
  );
}

export default Admin;