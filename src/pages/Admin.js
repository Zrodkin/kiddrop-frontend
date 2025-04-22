import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Chart from "chart.js/auto";
import ManualLogEntry from "../components/ManualLogEntry"; // Assuming this component exists
import { jwtDecode } from 'jwt-decode'; // Corrected import for jwtDecode
import Select from "react-select";


// Font Awesome Imports - Added all potentially used icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTachometerAlt, faCar, faUserGraduate, faUserFriends, faChartLine,
  faHistory, faCog, faSignOutAlt, faExclamationTriangle, faSpinner,
  faSchool, faCheckCircle, faHourglassStart, faPlus, faEdit, faTrash,
  faBullhorn, faSearch, faFilter, faChevronDown, faFileDownload,
  faArrowUp, faArrowDown, faInfoCircle, faTimes // Added faTimes for modal close
} from '@fortawesome/free-solid-svg-icons';

function Admin() {
  const [activeSection, setActiveSection] = useState("dashboard-content");
  const [pageTitle, setPageTitle] = useState("Dashboard Overview");
  const [stats, setStats] = useState({ checkedIn: 0, checkedOut: 0, totalStudents: 0, alerts: 0 });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(""); // For general page load errors
  const [message, setMessage] = useState(null); // For temporary feedback messages { text, isSuccess }
  const [searchQuery, setSearchQuery] = useState("");
  const [logs, setLogs] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState("addStudent"); // 'addStudent', 'editStudent', 'logEntry'
  const [selectedStudent, setSelectedStudent] = useState(null); // Student object for editing
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const year = new Date().getFullYear(); // NOTE: This variable is declared but never used.
  const navigate = useNavigate();
  const chartInstanceRef = useRef(null);
  const canvasRef = useRef(null);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // --- Show Temporary Messages ---
  const showAppMessage = useCallback((text, isSuccess = true) => {
    setMessage({ text, isSuccess });
    const timer = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(timer); // Cleanup timer on unmount or if called again
  }, []); // Empty dependency array - this function doesn't change

  // --- Fetch Initial Data ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    setMessage(null); // Clear messages on fetch
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login"); // Redirect if no token
      return;
    }

    // Verify role from token
    try {
      const decoded = jwtDecode(token);
      if (decoded.role !== 'admin') {
        console.warn("Non-admin user attempted to access admin area.");
        navigate("/dashboard"); // Redirect non-admin users
        return;
      }
    } catch (err) {
      console.error("Token decode error on mount:", err);
      handleLogout(); // Use logout function to clear storage and redirect
      return;
    }

    try {
      // Fetch stats, students, and logs in parallel
      const [statsRes, studentsRes, logsRes] = await Promise.all([
        fetch(`${apiUrl}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/api/admin/students`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/api/admin/logs?limit=5`, { headers: { Authorization: `Bearer ${token}` } })
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
        setFilteredStudents(studentsData);
      } else {
        setStudents([]);
        setFilteredStudents([]);
        console.warn("Unexpected student data format");
      }

      // Process Logs
      if (!logsRes.ok) throw new Error(`Logs Error: ${logsRes.statusText}`);
      const logsData = await logsRes.json();
      setLogs(logsData.logs || []);

    } catch (err) {
      console.error("Error fetching admin data:", err);
      setError(`Failed to load data: ${err.message}`);
      if (err.message?.includes('401') || err.message?.includes('403')) {
        handleLogout(); // Logout if unauthorized during fetch
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, apiUrl]); // NOTE: handleLogout should technically be a dependency if defined outside useCallback, but it's defined with useCallback below and has navigate as its dep, which is already here. So this is fine.

  // NOTE: Removed comment "// Removed duplicate handleApproval function" as there's only one handleApproval function here.

  // --- Handle Logout ---
  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    navigate("/login");
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]); // Correct: Fetch data on mount and when fetchData changes

  // --- Chart Rendering ---
  useEffect(() => {
    if (loading || error || !stats.totalStudents) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
      return;
    }

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
          {
            label: 'Checked In',
            data: [checkedIn],
            backgroundColor: 'rgba(16, 185, 129, 0.7)',
            borderColor: 'rgba(16, 185, 129, 1)',
            borderWidth: 1
          },
          {
            label: 'Checked Out',
            data: [checkedOut],
            backgroundColor: 'rgba(239, 68, 68, 0.7)',
            borderColor: 'rgba(239, 68, 68, 1)',
            borderWidth: 1
          },
          {
            label: 'Awaiting',
            data: [remaining],
            backgroundColor: 'rgba(209, 213, 219, 0.7)',
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
            title: {
              display: true,
              text: 'Number of Students'
            }
          },
          y: {
            stacked: true
          }
        },
        plugins: {
          legend: {
            position: 'bottom'
          },
          title: {
            display: false
          }
        }
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [loading, error, stats]); // Correct dependencies

  // --- Student Filtering ---
  useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    setFilteredStudents(
      students.filter(student =>
        student.name?.toLowerCase().includes(lowerCaseQuery) ||
        student.grade?.toLowerCase().includes(lowerCaseQuery)
      )
    ); // Fixed the closing parenthesis here (as noted in original comment)
  }, [searchQuery, students]); // Correct dependencies

  // Add this function right after the useEffect for student filtering in the Admin component
  // --- Student Approval ---
  const handleApproval = async (studentId, approvalStatus) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/admin/students/${studentId}/approval`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ approvalStatus })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update approval");
      }

      showAppMessage(`✅ Student ${approvalStatus}`);
      fetchData(); // Refresh list
    } catch (err) {
      console.error("Approval error:", err);
      showAppMessage(`❌ ${err.message}`, false);
    }
  };

  // --- Delete Student ---
  const handleDeleteStudent = async (id) => {
    if (!window.confirm("Are you sure you want to remove this student? This will also delete their logs.")) return;
    try {
      // NOTE: Removed comment "// FIX: Use 'token' consistently" as the code below correctly uses 'token'.
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/admin/students/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      // Handle non-JSON error responses from delete
      if (!res.ok) {
          let errorMsg = `HTTP error! status: ${res.status}`;
          try { const errorData = await res.json(); errorMsg = errorData.message || JSON.stringify(errorData); }
          catch (jsonError) { errorMsg = res.statusText || errorMsg; } // Use statusText as fallback if JSON parsing fails
          throw new Error(errorMsg);
      }
      // NOTE: Removed comment "// FIX: Use message state for feedback..." as the code below correctly uses showAppMessage.
      showAppMessage("✅ Student deleted successfully");
      fetchData(); // Refetch data after delete
    } catch (err) {
      console.error("Delete student error:", err);
      showAppMessage(`❌ ${err.message}`, false); // Show error using message state
    }
  };

  // --- Edit Student Modal Trigger ---
  const handleEditStudent = (student) => {
    setSelectedStudent(student); // Set the student to be edited
    setModalContent("editStudent"); // Set modal content type
    setShowModal(true); // Show the modal
  };

  // --- Add Student Modal Trigger ---
  const handleAddStudent = () => {
    setSelectedStudent(null); // Clear selected student for adding new
    setModalContent("addStudent");
    setShowModal(true);
  };

  // --- Manual Log Modal Trigger ---
  const handleLogStudentAction = () => {
    setModalContent("logEntry");
    setShowModal(true);
  };

  // --- Switch Active Section ---
  const switchSection = (sectionId, title) => {
    setActiveSection(sectionId);
    setPageTitle(title);
    setIsSidebarOpen(false); // Close sidebar on navigation
  };

  // --- Get Activity Feed Styles ---
  const getActivityStyles = (type) => {
    switch (type) {
      case "dropoff": return { icon: faArrowDown, style: "bg-green-50 border-green-400 text-green-600" };
      case "pickup": return { icon: faArrowUp, style: "bg-red-50 border-red-400 text-red-600" };
      default: return { icon: faInfoCircle, style: "bg-gray-50 border-gray-400 text-gray-600" };
    }
  };

  // --- Helper to get Status Badge Info ---
  const getStatusInfo = (status) => {
    switch (status) {
      case "checked-in": return { text: "Checked In", icon: faCheckCircle, style: "bg-green-100 text-green-800" };
      case "checked-out": return { text: "Checked Out", icon: faSignOutAlt, style: "bg-red-100 text-red-800" };
      default: return { text: "Awaiting", icon: faHourglassStart, style: "bg-yellow-100 text-yellow-800" };
    }
  };

  // --- Helper to format date/time ---
  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try { return new Date(dateString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit'}); }
    catch (e) { console.error("Invalid date format:", dateString); return 'Invalid Date'; }
  };


  // ========================================================================
  // == MODAL COMPONENT (NOTE: Consider moving to components/Modal.js) ==
  // ========================================================================
  const Modal = ({ show, onClose, title, children }) => {
    if (!show) return null;

    // Handle closing modal on Escape key press
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    return (
      // Outer overlay
      <div
        className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300"
        onClick={onClose} // Close on overlay click
      >
        {/* Modal Content */}
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
          onClick={e => e.stopPropagation()} // Prevent closing modal when clicking inside content
        >
          {/* Modal Header */}
          <div className="flex justify-between items-center border-b p-4">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              aria-label="Close modal"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          {/* Modal Body */}
          <div className="p-4 sm:p-6">
            {children}
          </div>
        </div>
        {/* NOTE: Inline styles for animation could be moved to CSS */}
        <style>{`
          @keyframes fade-in-scale {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-fade-in-scale { animation: fade-in-scale 0.2s ease-out forwards; }
        `}</style>
      </div>
    );
  };

  // ========================================================================
  // == ADD/EDIT STUDENT FORM COMPONENT (NOTE: Consider moving to components/AddEditStudentForm.js) ==
  // ========================================================================
  // This form handles both adding (studentData is null) and editing (studentData has data)
  const AddEditStudentForm = ({ studentData, onFormSubmit, onClose }) => { // Added onClose prop
    const [formData, setFormData] = useState({
      name: "", // Initialize empty
      grade: "",
      parentId: "",
      status: "awaiting"
    });
    const [parents, setParents] = useState([]); // To populate parent dropdown
    const [loadingParents, setLoadingParents] = useState(false);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [formError, setFormError] = useState("");

    // Fetch parent list for dropdown - Runs once on mount
    useEffect(() => {
      const fetchParents = async () => {
        setLoadingParents(true);
        setFormError(""); // Clear previous errors
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${apiUrl}/api/admin/parents`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error("Failed to fetch parents");
          const data = await res.json();

          // NOTE: console.log for debugging, consider removing for production.
          console.log("Parent data:", data);

          // ✅ Safely sort by name (handles missing values)
          const sorted = [...data].sort((a, b) =>
            (a.name || "").localeCompare(b.name || "")
          );
          setParents(sorted);
        } catch (err) {
          console.error("Error fetching parents:", err);
          setFormError("Could not load parent list. Please try again.");
        } finally {
          setLoadingParents(false);
        }
      };

      fetchParents();
    }, [apiUrl]); // Dependency is correct, only depends on apiUrl

    // Update form if selected student changes (for editing)
    useEffect(() => {
      setFormData({
        name: studentData?.name || "",
        grade: studentData?.grade || "",
        parentId: studentData?.parentId || "", // Assuming parentId is just the ID string
        status: studentData?.status || "awaiting"
      });
      setFormError(""); // Clear errors when student data changes
    }, [studentData]);


    const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSelectChange = (selectedOption) => {
       setFormData((prev) => ({
           ...prev,
           parentId: selectedOption ? selectedOption.value : "",
       }));
    };


    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoadingSubmit(true);
      setFormError("");

      if (!formData.name || !formData.grade) {
        setFormError("Student Name and Grade are required.");
        setLoadingSubmit(false);
        return;
      }

      try {
        // NOTE: Removed comment "// FIX: Use 'token' consistently" as the code below correctly uses 'token'.
        const token = localStorage.getItem("token");
        const method = studentData ? "PUT" : "POST"; // Determine method based on if editing
        const url = studentData
          ? `${apiUrl}/api/admin/students/${studentData._id}`
          : `${apiUrl}/api/admin/students`;

        // Prepare payload - ensure parentId is sent if selected, otherwise omit or send null if backend handles it
        const payload = { ...formData };
        if (!payload.parentId) {
          delete payload.parentId; // Don't send empty string if 'Not Assigned' selected
        } else {
           // Ensure parentId is just the ID string if it comes from an object
           if (typeof payload.parentId === 'object' && payload.parentId !== null) {
               payload.parentId = payload.parentId._id || payload.parentId.value || ''; // Adjust based on actual parentId structure
           }
        }


        const res = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          let errorMsg = `Error: ${res.status}`;
          try {
              const errorData = await res.json(); errorMsg = errorData.message || JSON.stringify(errorData);
          } catch(jsonErr) { errorMsg = res.statusText || errorMsg; }
          throw new Error(errorMsg);
        }

        // Call the callback passed from Admin component to close modal and refresh data
        onFormSubmit(studentData ? "updated" : "added");

      } catch (err) {
        console.error("Save student error:", err);
        setFormError(err.message || "Failed to save student.");
      } finally {
        setLoadingSubmit(false);
      }
    };

    // Prepare options for react-select, memoize if performance becomes an issue
    const parentOptions = parents.map((parent) => ({
        value: parent._id,
        label: `${parent.name} (${parent.email || 'No Email'})`, // Handle potentially missing email
        isNew: parent.createdAt && (new Date() - new Date(parent.createdAt) < 7 * 24 * 60 * 60 * 1000),
    }));

    // Find the selected parent option for the Select component's value prop
    const selectedParentOption = parentOptions.find(p => p.value === formData.parentId) || null;


    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error Display */}
        {formError && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">
            {formError}
          </div>
        )}

        {/* Name Input */}
        <div>
          <label htmlFor="student-name" className="block text-sm font-medium text-gray-700 mb-1">Student Name</label>
          <input
            id="student-name" type="text" name="name" value={formData.name} onChange={handleChange} required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 shadow-sm"
          />
        </div>

        {/* Grade Select */}
        <div>
          <label htmlFor="student-grade" className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
          <select
            id="student-grade" name="grade" value={formData.grade} onChange={handleChange} required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 shadow-sm"
          >
            <option value="">Select Grade</option>
            <option value="K">Kindergarten</option>
            <option value="1">Grade 1</option>
            <option value="2">Grade 2</option>
            <option value="3">Grade 3</option>
            <option value="4">Grade 4</option>
            <option value="5">Grade 5</option>
            {/* Add more grades if needed */}
          </select>
        </div>

        {/* Parent Select */}
        <div>
          <label htmlFor="student-parent" className="block text-sm font-medium text-gray-700 mb-1">
            Assign Parent/Guardian
          </label>
          <Select
            id="student-parent"
            className="react-select-container"
            classNamePrefix="react-select"
            isClearable
            isLoading={loadingParents}
            placeholder="Select or search parent..."
            value={selectedParentOption}
            onChange={handleSelectChange} // Use specific handler for react-select
            options={parentOptions}
            styles={{
              option: (base, state) => ({
                ...base,
                fontWeight: state.data.isNew ? "bold" : "normal",
                color: state.data.isNew ? "#065f46" : base.color, // Dark green for new parents
              }),
            }}
            noOptionsMessage={() => loadingParents ? 'Loading...' : 'No parents found'}
          />
        </div>

        {/* Status Select */}
        <div>
          <label htmlFor="student-status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            id="student-status" name="status" value={formData.status} onChange={handleChange} required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 shadow-sm"
          >
            <option value="awaiting">Awaiting</option>
            <option value="checked-out">Checked Out</option>
            <option value="checked-in">Checked In</option>
            {/* Consider adding 'pending-approval' if admins can set this */}
          </select>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose} // Use the onClose prop passed from Admin
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loadingSubmit || loadingParents} // Also disable if parents are loading
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
          >
            {loadingSubmit && <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />}
            {studentData ? "Update Student" : "Add Student"}
          </button>
        </div>
      </form>
    );
  };

  // Main return statement for the Admin component
  return (
    <div className="flex flex-col lg:flex-row min-h-screen w-full bg-gray-100 overflow-x-hidden">
      {/* Sidebar */}
      <aside className={`bg-white shadow-md flex flex-col z-30 overflow-y-auto
        fixed inset-y-0 left-0 transform transition-transform duration-300 ease-in-out
        w-64 lg:static lg:translate-x-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Sidebar Content... */}
         <div className="p-4 border-b">
           <a href="#dashboard" onClick={(e) => { e.preventDefault(); switchSection('dashboard-content', 'Dashboard Overview'); }} className="text-xl font-semibold text-gray-700 hover:text-blue-600 transition duration-150 flex items-center">
             <FontAwesomeIcon icon={faSchool} className="mr-3 text-blue-500 text-2xl" /> KidDrop Admin
           </a>
         </div>
         <nav className="flex-1 px-2 py-4 space-y-1">
            {[
              { id: 'dashboard-content', title: 'Dashboard', icon: faTachometerAlt },
              { id: 'dismissal-content', title: 'Dismissal/Pickup', icon: faCar },
              { id: 'students-content', title: 'Student Roster', icon: faUserGraduate },
              { id: 'parents-content', title: 'Parents/Guardians', icon: faUserFriends }, // Placeholder section
              { id: 'reports-content', title: 'Reports', icon: faChartLine }, // Placeholder section
              { id: 'logs-content', title: 'Activity Logs', icon: faHistory } // Placeholder section
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
             <a href="#settings" className={`sidebar-link group flex items-center px-3 py-2.5 text-sm font-medium rounded-md ${activeSection === 'settings-content' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`} onClick={(e) => { e.preventDefault(); switchSection('settings-content', 'Settings'); }} >
                <FontAwesomeIcon icon={faCog} className={`fa-fw mr-3 ${activeSection === 'settings-content' ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}`} /> Settings
             </a>
             <div className="pt-2 border-t">
                <p className="text-sm font-medium text-gray-700">Admin Portal</p>
                <button onClick={handleLogout} className="text-xs text-red-600 hover:underline mt-1 w-full text-left flex items-center">
                    <FontAwesomeIcon icon={faSignOutAlt} className="mr-1" /> Logout
                </button>
            </div>
         </div>
      </aside>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
         {/* Sticky Header */}
         <header className="bg-white shadow-sm p-4 border-b sticky top-0 z-20">
           <div className="flex flex-wrap justify-between items-center gap-2 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
             {/* Hamburger button for mobile */}
             <button
               className="lg:hidden text-gray-600 focus:outline-none mr-4"
               onClick={() => setIsSidebarOpen(!isSidebarOpen)}
             >
               <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
               </svg>
             </button>

             <h1 id="page-title" className="text-xl font-semibold text-gray-800">{pageTitle}</h1>
             <div className="space-x-2 flex items-center flex-wrap"> {/* Added flex-wrap */}
               {/* Show Add Student only on Student Roster page */}
               {activeSection === 'students-content' && (
                   <button onClick={handleAddStudent} className="bg-green-500 hover:bg-green-600 text-white font-medium py-1.5 px-3 rounded-md text-xs sm:text-sm transition duration-150 shadow-sm inline-flex items-center">
                       <FontAwesomeIcon icon={faPlus} className="mr-1" /> Add Student
                   </button>
               )}
               <button onClick={handleLogStudentAction} className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-1.5 px-3 rounded-md text-xs sm:text-sm transition duration-150 shadow-sm inline-flex items-center">
                 <FontAwesomeIcon icon={faPlus} className="mr-1" /> Manual Log
               </button>
               <button onClick={() => navigate('/admin/send-alert')} className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-1.5 px-3 rounded-md text-xs sm:text-sm transition duration-150 shadow-sm inline-flex items-center">
                 <FontAwesomeIcon icon={faBullhorn} className="mr-1" /> Send Alert
               </button>
             </div>
           </div>
         </header>

         {/* Scrollable Main Content */}
         <main id="main-content" className="flex-1 overflow-y-auto bg-gray-100">
           {/* Centered Container with Max Width and Padding */}
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
             {/* Temporary Message Display */}
             {message && (
                 <div className={`p-4 mb-4 rounded-md text-sm ${message.isSuccess ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                     {message.text}
                 </div>
             )}

             {/* Display loading or error for initial data fetch */}
             {loading ? (
               <div className="text-center text-gray-600 py-16"> <FontAwesomeIcon icon={faSpinner} spin size="3x" className="text-blue-500 mb-3" /> <p>Loading dashboard data...</p> </div>
             ) : error ? (
               <div className="text-center text-red-600 py-16 bg-red-50 p-4 rounded-md border border-red-300 max-w-xl mx-auto"> <FontAwesomeIcon icon={faExclamationTriangle} size="2x" className="mb-3"/> <p className="font-semibold">Failed to load data:</p> <p className="text-sm">{error}</p> </div>
             ) : (
               // Container for conditional sections - RENDER BASED ON activeSection STATE
               <>
                 {/* Dashboard Section */}
                 <div id="dashboard-content" className={`content-section ${activeSection !== 'dashboard-content' ? 'hidden' : ''}`}>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                        {/* Stat Cards ... */}
                         <div className="bg-white p-5 rounded-lg shadow border border-gray-200 flex items-center"> <div className="bg-green-100 p-3 rounded-full"><FontAwesomeIcon icon={faCheckCircle} className="text-2xl text-green-600" /></div> <div className="ml-4"><p className="text-sm font-medium text-gray-500">Checked In</p><p className="text-3xl font-semibold text-green-700 mt-1">{stats.checkedIn} / {stats.totalStudents}</p><p className="text-xs text-gray-400 mt-1">Currently in school</p></div></div>
                         <div className="bg-white p-5 rounded-lg shadow border border-gray-200 flex items-center"> <div className="bg-red-100 p-3 rounded-full"><FontAwesomeIcon icon={faSignOutAlt} className="text-2xl text-red-600" /></div> <div className="ml-4"><p className="text-sm font-medium text-gray-500">Checked Out</p><p className="text-3xl font-semibold text-red-700 mt-1">{stats.checkedOut}</p><p className="text-xs text-gray-400 mt-1">{Math.max(0, stats.totalStudents - (stats.checkedIn || 0) - (stats.checkedOut || 0))} Awaiting</p></div></div>
                         <div className="bg-white p-5 rounded-lg shadow border border-gray-200 flex items-center"> <div className="bg-blue-100 p-3 rounded-full"><FontAwesomeIcon icon={faUserGraduate} className="text-2xl text-blue-600" /></div> <div className="ml-4"><p className="text-sm font-medium text-gray-500">Total Students</p><p className="text-3xl font-semibold text-blue-700 mt-1">{stats.totalStudents}</p><p className="text-xs text-gray-400 mt-1">Active Roster</p></div></div>
                         <div className="bg-white p-5 rounded-lg shadow border border-red-300 flex items-center">
                           <div className="bg-red-100 p-3 rounded-full">
                             <FontAwesomeIcon icon={faExclamationTriangle} className={`text-2xl text-red-600 ${stats.alerts > 0 ? 'animate-pulse' : ''}`}/>
                           </div>
                           <div className="ml-4">
                             <p className="text-sm font-medium text-red-600">Active Alerts</p>
                             <p className="text-3xl font-semibold text-red-700 mt-1">{stats.alerts}</p>
                             <p
                               onClick={() => navigate('/admin/send-alert')}
                               className="text-xs text-red-500 mt-1 hover:underline cursor-pointer"
                             >
                               Send New Alert
                             </p>
                           </div>
                         </div>
                    </div>
                    {/* Chart & Activity Feed */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                         <div className="lg:col-span-2 bg-white p-5 rounded-lg shadow border border-gray-200">
                             <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Student Status</h3>
                             <div className="relative" style={{ height: "300px" }}> <canvas ref={canvasRef} id="statusChart"></canvas> </div>
                         </div>
                         <div className="bg-white p-5 rounded-lg shadow border border-gray-200 flex flex-col">
                             <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
                             <div className="activity-feed flex-1 overflow-y-auto space-y-3 pr-2" style={{ maxHeight: "300px" }}>
                                 {logs.length === 0 ? ( <p className="text-center text-gray-500 py-4">No recent activity</p> ) : ( logs.map((log) => { const styleInfo = getActivityStyles(log.type); const time = formatDateTime(log.timestamp); const studentName = log.studentId?.name ?? "N/A"; const parentName = log.parentId?.name ?? "System"; return ( <div key={log._id} className={`text-sm p-3 rounded ${styleInfo.style} border-l-4`}> <div className="flex items-start"> <FontAwesomeIcon icon={styleInfo.icon} className="mt-1 mr-2 flex-shrink-0" /> <div className="flex-1 min-w-0"> {/* Added min-w-0 for flex truncation */} <p className="font-medium truncate">{log.type === "dropoff" ? "Drop-off" : log.type === "pickup" ? "Pick-up" : "Log Event"}:</p> <p className="truncate">{studentName} {log.type !== 'manual-log' ? `by ${parentName}` : ''}</p> <p className="text-xs opacity-75 mt-1">{time}</p> </div> </div> </div> ); }) )}
                             </div>
                             <button onClick={() => switchSection('logs-content', 'Activity Logs')} className="mt-3 text-sm text-blue-600 hover:text-blue-800 hover:underline text-center w-full" > View all activity </button>
                         </div>
                    </div>
                    {/* Recent Students Table */}
                    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                         <h3 className="text-lg font-semibold text-gray-800 p-4 border-b">Recently Active Students</h3>
                         <div className="overflow-x-auto">
                           <table className="min-w-full divide-y divide-gray-200">
                             <thead className="bg-gray-50">
                               <tr>
                                 <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                 <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                                 <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                 <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                               </tr>
                             </thead>
                             <tbody className="bg-white divide-y divide-gray-200">
                               {students.slice(0, 5).map((student) => {
                                   const { text: statusText, icon: statusIcon, style: statusStyle } = getStatusInfo(student.status);
                                   return (
                                     <tr key={student._id} className="hover:bg-gray-50">
                                       <td className="px-4 py-3 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{student.name}</div></td>
                                       <td className="px-4 py-3 whitespace-nowrap"><div className="text-sm text-gray-500">{student.grade}</div></td>
                                       <td className="px-4 py-3 whitespace-nowrap"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle}`}><FontAwesomeIcon icon={statusIcon} className="mr-1" />{statusText}</span></td>
                                       <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDateTime(student.lastActivity)}</td>
                                     </tr>
                                   );
                               })}
                               {students.length === 0 && (
                                   <tr><td colSpan="4" className="text-center py-4 text-gray-500">No students found.</td></tr>
                               )}
                             </tbody>
                           </table>
                         </div>
                    </div>
                 </div>

                 {/* Dismissal Section */}
                 <div id="dismissal-content" className={`content-section ${activeSection !== 'dismissal-content' ? 'hidden' : ''}`}>
                     <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
                         <h3 className="text-lg font-medium mb-4">Manual Check-in/Check-out</h3>
                         <p className="text-sm text-gray-600 mb-4"> Use this form to manually log student arrivals and departures. Select the student and action type. </p>
                         {/* Render ManualLogEntry directly here if preferred over modal */}
                         <ManualLogEntry students={students} onLogSuccess={() => { showAppMessage('✅ Manual log successful!'); fetchData(); }} />
                     </div>
                      {/* NOTE: Add other dismissal management components here (Car Line, Bus Lists etc) */}
                 </div>

                 {/* Students Section */}
                 <div id="students-content" className={`content-section ${activeSection !== 'students-content' ? 'hidden' : ''}`}>
                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                         <div>
                            {/* Title is set by switchSection */}
                            <p className="text-gray-600 text-sm">Manage all students in the system.</p>
                         </div>
                         <button onClick={handleAddStudent} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center self-end sm:self-center" > <FontAwesomeIcon icon={faPlus} className="mr-2" /> Add Student </button>
                     </div>

                     {/* Pending Approval Section (Moved inside Students section) */}
                     <div className="bg-white rounded-lg shadow border border-yellow-300 mb-6">
                         <div className="p-4 border-b border-yellow-300 bg-yellow-50">
                             <h3 className="text-lg font-semibold text-yellow-800 flex items-center">
                                 <FontAwesomeIcon icon={faHourglassStart} className="mr-2" /> Pending Approvals
                             </h3>
                             <p className="text-sm text-yellow-700 mt-1">These students were added by parents and await approval.</p>
                         </div>
                         <div className="overflow-x-auto">
                             <table className="min-w-full divide-y divide-gray-200 text-sm">
                                 <thead className="bg-yellow-100 text-yellow-900">
                                     <tr>
                                         <th scope="col" className="px-4 py-2 text-left text-xs font-medium uppercase">Name</th>
                                         <th scope="col" className="px-4 py-2 text-left text-xs font-medium uppercase">Grade</th>
                                         <th scope="col" className="px-4 py-2 text-left text-xs font-medium uppercase">Parent</th>
                                         <th scope="col" className="px-4 py-2 text-left text-xs font-medium uppercase">Added On</th>
                                         <th scope="col" className="px-4 py-2 text-center text-xs font-medium uppercase">Actions</th>
                                     </tr>
                                 </thead>
                                 <tbody className="bg-white divide-y divide-gray-100">
                                     {students.filter(s => s.approvalStatus === "pending").length === 0 ? (
                                         <tr><td colSpan="5" className="text-center py-4 text-gray-500">No students pending approval.</td></tr>
                                     ) : (
                                         students
                                             .filter(s => s.approvalStatus === "pending")
                                             .map(student => (
                                                 <tr key={student._id} className="hover:bg-yellow-50">
                                                     <td className="px-4 py-2 whitespace-nowrap">{student.name}</td>
                                                     <td className="px-4 py-2 whitespace-nowrap">{student.grade}</td>
                                                     <td className="px-4 py-2 whitespace-nowrap">{student.parentId?.name || 'N/A'}</td> {/* Show parent name if available */}
                                                     <td className="px-4 py-2 whitespace-nowrap text-gray-600">{student.createdAt ? new Date(student.createdAt).toLocaleDateString() : '-'}</td>
                                                     <td className="px-4 py-2 text-center space-x-2 whitespace-nowrap">
                                                         <button
                                                             onClick={() => handleApproval(student._id, "approved")}
                                                             className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-xs"
                                                         >
                                                             Approve
                                                         </button>
                                                         <button
                                                             onClick={() => handleApproval(student._id, "rejected")}
                                                             className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-xs"
                                                         >
                                                             Reject
                                                         </button>
                                                         <button
                                                             onClick={() => handleEditStudent(student)}
                                                             className="text-indigo-600 hover:text-indigo-900 px-1 py-1 text-xs" title="Edit before approving"
                                                         >
                                                            <FontAwesomeIcon icon={faEdit} />
                                                         </button>
                                                     </td>
                                                 </tr>
                                             ))
                                     )}
                                 </tbody>
                             </table>
                         </div>
                     </div>


                     {/* Main Student Roster Table */}
                     <div className="bg-white rounded-lg shadow border border-gray-200 mb-6">
                         <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                             <div className="relative w-full sm:w-64">
                                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"> <FontAwesomeIcon icon={faSearch} className="text-gray-400" /> </div>
                                 <input type="text" placeholder="Search students..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm" />
                             </div>
                             <div className="flex items-center space-x-3">
                                 {/* NOTE: Filter/Export buttons are placeholders */}
                                 <button className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 flex items-center disabled:opacity-50" disabled> <FontAwesomeIcon icon={faFilter} className="mr-2" /> Filter <FontAwesomeIcon icon={faChevronDown} className="ml-2 text-xs" /> </button>
                                 <button className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 flex items-center disabled:opacity-50" disabled> <FontAwesomeIcon icon={faFileDownload} className="mr-2" /> Export </button>
                             </div>
                         </div>
                         <div className="overflow-x-auto">
                             <table className="min-w-full divide-y divide-gray-200 text-sm">
                                 <thead className="bg-gray-50"> <tr> <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th> <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th> <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th> <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th> <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th> </tr> </thead>
                                 <tbody className="bg-white divide-y divide-gray-200">
                                     {filteredStudents.filter(s => s.approvalStatus !== 'pending').length > 0 ? filteredStudents.filter(s => s.approvalStatus !== 'pending').map((student) => {
                                         const { text: statusText, icon: statusIcon, style: statusStyle } = getStatusInfo(student.status);
                                         return (
                                           <tr key={student._id} className="hover:bg-gray-50">
                                             <td className="px-4 py-3 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{student.name}</div></td>
                                             <td className="px-4 py-3 whitespace-nowrap"><div className="text-sm text-gray-500">{student.grade}</div></td>
                                             <td className="px-4 py-3 whitespace-nowrap"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle}`}> <FontAwesomeIcon icon={statusIcon} className="mr-1" /> {statusText} </span></td>
                                             <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDateTime(student.lastActivity)}</td>
                                             <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                                 <div className="flex justify-center space-x-4">
                                                     <button onClick={() => handleEditStudent(student)} className="text-indigo-600 hover:text-indigo-900" title="Edit"> <FontAwesomeIcon icon={faEdit} /> </button>
                                                     <button onClick={() => handleDeleteStudent(student._id)} className="text-red-600 hover:text-red-900" title="Delete"> <FontAwesomeIcon icon={faTrash} /> </button>
                                                 </div>
                                             </td>
                                           </tr>
                                         );
                                     }) : (<tr><td colSpan="5" className="text-center py-10 text-gray-500">{searchQuery ? 'No approved students match your search.' : 'No approved students found.'}</td></tr>)}
                                 </tbody>
                             </table>
                         </div>
                         <div className="p-4 border-t border-gray-200 text-sm text-gray-600 flex flex-col sm:flex-row justify-between items-center gap-2">
                             <div> Showing {filteredStudents.filter(s => s.approvalStatus !== 'pending').length} of {students.filter(s => s.approvalStatus !== 'pending').length} approved students </div>
                             {/* NOTE: Add real pagination controls later */}
                             <div className="flex space-x-1"> <button className="px-3 py-1 border border-gray-300 rounded-md bg-white text-gray-500 text-xs" disabled>Previous</button> <button className="px-3 py-1 border border-gray-300 rounded-md bg-blue-50 text-blue-600 font-medium text-xs">1</button> <button className="px-3 py-1 border border-gray-300 rounded-md bg-white text-gray-500 text-xs" disabled>Next</button> </div>
                         </div>
                     </div>
                      {/* NOTE: Removed comment "// Removed StudentManager component instance" */}
                 </div>


                 {/* Other Placeholder Sections */}
                 <div id="parents-content" className={`content-section ${activeSection !== 'parents-content' ? 'hidden' : ''}`}> <h2 className="text-2xl font-semibold mb-4 text-gray-800">Parent/Guardian Management</h2> <div className="bg-white p-5 rounded-lg shadow border border-gray-200"> <p className="text-gray-600">Parent management functionality will be implemented here. (e.g., View parents, assigned students, add/edit/delete parents).</p> </div> </div>
                 <div id="reports-content" className={`content-section ${activeSection !== 'reports-content' ? 'hidden' : ''}`}> <h2 className="text-2xl font-semibold mb-4 text-gray-800">Reports</h2> <div className="bg-white p-5 rounded-lg shadow border border-gray-200"> <p className="text-gray-600">Reporting functionality will be implemented here. (e.g., Attendance reports, log exports by date range).</p> </div> </div>
                 <div id="logs-content" className={`content-section ${activeSection !== 'logs-content' ? 'hidden' : ''}`}> <h2 className="text-2xl font-semibold mb-4 text-gray-800">Activity Logs</h2> <div className="bg-white p-5 rounded-lg shadow border border-gray-200"> <p className="text-gray-600">Full log history will be displayed here, likely with filtering and pagination.</p> {/* TODO: Implement full log viewer */} </div> </div>
                 <div id="settings-content" className={`content-section ${activeSection !== 'settings-content' ? 'hidden' : ''}`}> <h2 className="text-2xl font-semibold mb-4 text-gray-800">Settings</h2> <div className="bg-white p-5 rounded-lg shadow border border-gray-200"> <p className="text-gray-600">System settings will be configured here. (e.g., School hours, API keys, notification preferences).</p> </div> </div>
               </>
             )}
           </div>
         </main>
      </div>

      {/* Modal for Add/Edit Student or Manual Log */}
      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        title={
          modalContent === "addStudent" ? "Add New Student" :
          modalContent === "editStudent" ? `Edit Student: ${selectedStudent?.name || ''}` :
          "Manual Log Entry"
        }
      >
        {/* Conditionally render form based on modalContent */}
        {modalContent === "logEntry" ? (
          <ManualLogEntry students={students} onLogSuccess={() => { setShowModal(false); fetchData(); showAppMessage('✅ Manual log successful!'); }} />
        ) : ( // Render Add/Edit form
          <AddEditStudentForm
              studentData={selectedStudent} // Pass selected student for editing, null for adding
              onFormSubmit={(action) => { // Callback to close modal and refresh data
                  setShowModal(false);
                  fetchData(); // Refresh stats and student list
                  showAppMessage(`✅ Student ${action} successfully!`, true);
              }}
              onClose={() => setShowModal(false)} // **FIXED: Pass onClose handler**
          />
        )}
      </Modal>
    </div>
  );
}

export default Admin;