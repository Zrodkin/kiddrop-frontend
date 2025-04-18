import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "parent") {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/parent/children`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setChildren(data);
      } catch (err) {
        setMessage(`❌ ${err.message}`);
      }
    };
    fetchChildren();
  }, []);

  const handleAction = async (studentId, action) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/log/${action}/${studentId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setChildren(prev =>
        prev.map(child =>
          child._id === studentId ? { ...child, status: data.newStatus } : child
        )
      );
      showMessage(`${action === "dropoff" ? "Dropped off" : "Picked up"} successfully at ${new Date().toLocaleTimeString()}.`);
    } catch (err) {
      showMessage(err.message, false);
    }
  };

  const showMessage = (text, isSuccess = true) => {
    setMessage({ text, isSuccess });
    setTimeout(() => setMessage(""), 3500);
  };

  return (
    <div className="antialiased min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      <header className="bg-white text-gray-800 p-4 shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto flex justify-between items-center max-w-5xl">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-700">School Check-in</h1>
          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("role");
              localStorage.removeItem("userId");
              navigate("/login");
            }}
            className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition duration-200 text-sm font-medium shadow-sm hover:shadow-md"
          >
            <i className="fas fa-sign-out-alt mr-1 hidden sm:inline"></i> Logout
          </button>
        </div>
      </header>

      {message && (
        <div className="show" id="confirmation-message-container">
          <div className="max-w-3xl mx-auto">
            <div
              id="confirmation-message-content"
              className={`mt-4 p-4 border rounded-lg shadow-md ${message.isSuccess ? "bg-green-100 text-green-900 border-green-300" : "bg-red-100 text-red-900 border-red-300"}`}
            >
              {message.text}
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="w-full max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8 space-y-6 border border-gray-200">
          <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-gray-800 text-center md:text-left">Your Children</h2>

          <div className="space-y-5">
            {children.map(child => (
              <div
                key={child._id}
                className="border rounded-lg p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between"
              >
                <div className="mb-4 md:mb-0 md:mr-4 flex-grow">
                  <h3 className="text-lg font-semibold text-gray-900">{child.name}</h3>
                  <p className="text-base text-gray-600">Grade {child.grade}</p>
                  <div className="mt-2 status-indicator">
                    <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full border ${
                      child.status === "checked-in"
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-red-100 text-red-800 border-red-200"
                    }`}>
                      <i className={`fas mr-1.5 ${
                        child.status === "checked-in" ? "fa-check-circle" : "fa-sign-out-alt"
                      }`}></i>
                      {child.status === "checked-in" ? "Checked In" : "Checked Out"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-3 flex-shrink-0 w-full md:w-auto">
                  <button
                    className={`log-button ${
                      child.status === "checked-in"
                        ? "bg-blue-500 hover:bg-blue-600"
                        : "bg-green-500 hover:bg-green-600"
                    } text-white transition duration-200 ease-in-out flex items-center justify-center w-full md:w-auto px-4 py-2 rounded-lg`}
                    onClick={() => handleAction(child._id, child.status === "checked-in" ? "pickup" : "dropoff")}
                  >
                    <i className={`fas ${
                      child.status === "checked-in" ? "fa-arrow-up" : "fa-arrow-down"
                    } mr-2`}></i>
                    {child.status === "checked-in" ? "Log Pick-up" : "Log Drop-off"}
                  </button>

                  <button
                    onClick={() => navigate(`/edit-child/${child._id}`)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200 ease-in-out"
                  >
                    <i className="fas fa-user-edit mr-2"></i>Edit Info
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <a
              href="#"
              className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition duration-150"
            >
              View Full Log History
            </a>
          </div>
        </div>
      </main>

      <footer className="text-center text-gray-700 text-sm mt-10 pb-6">
        &copy; {new Date().getFullYear()} School Check-in System. All rights reserved.
      </footer>
    </div>
  );
}

export default Dashboard;
