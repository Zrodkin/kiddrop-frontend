import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

function UpdateChildForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    name: "",
    grade: "",
    emergencyName: "",
    emergencyPhone: "",
    emergencyRelation: "",
    allergies: "",
    authorizedPickup: "",
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Check authentication and role
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");

    console.log("Checking auth...");
    console.log("Token exists:", !!token);
    console.log("User role:", role);

    if (!token || role !== "parent") {
      console.warn("Unauthorized access - redirecting to login");
      navigate("/login");
    }
  }, [navigate]);

  // Fetch child data
  useEffect(() => {
    const fetchChild = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.log("No authentication token found");
          setError("Please log in again.");
          navigate("/login");
          return;
        }

        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/parent/child/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("Fetch response status:", res.status);

        if (res.status === 401) {
          console.warn("Session expired - redirecting to login");
          setError("Session expired. Please log in again.");
          localStorage.clear();
          navigate("/login");
          return;
        }

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        setFormData({
          name: data.name || "",
          grade: data.grade || "",
          emergencyName: data.emergencyName || "",
          emergencyPhone: data.emergencyPhone || "",
          emergencyRelation: data.emergencyRelation || "",
          allergies: data.allergies || "",
          authorizedPickup: data.authorizedPickup || "",
        });
      } catch (err) {
        console.error("Error fetching child:", err);
        setError(`Failed to load child: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchChild();
  }, [id, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/parent/child/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert("✅ Child information updated successfully!");
      navigate("/dashboard");
    } catch (err) {
      alert(`❌ Update failed: ${err.message}`);
      setError(`Update failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="antialiased min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading child information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="antialiased min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
        <header className="bg-white text-gray-800 p-4 shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="container mx-auto flex justify-between items-center max-w-5xl">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-blue-600 hover:text-blue-800 transition duration-150"
            >
              <i className="fas fa-arrow-left mr-2"></i>Back to Dashboard
            </button>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-700 hidden sm:block">Error</h1>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 md:py-12">
          <div className="w-full max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8 border border-gray-200">
            <div className="text-center">
              <i className="fas fa-exclamation-circle text-red-500 text-4xl mb-4"></i>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Error Loading Child Information</h2>
              <p className="text-red-600 mb-6">{error}</p>
              <button
                onClick={() => navigate("/dashboard")}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg transition duration-150"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="antialiased min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      <header className="bg-white text-gray-800 p-4 shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto flex justify-between items-center max-w-5xl">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-blue-600 hover:text-blue-800 transition duration-150"
          >
            <i className="fas fa-arrow-left mr-2"></i>Back to Dashboard
          </button>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-700 hidden sm:block">Update Child Info</h1>
          <button
            onClick={() => {
              localStorage.clear();
              navigate("/login");
            }}
            className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition duration-200 text-sm font-medium shadow-sm hover:shadow-md"
          >
            <i className="fas fa-sign-out-alt mr-1 hidden sm:inline"></i> Logout
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="w-full max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8 border border-gray-200">
          <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-gray-800 text-center">
            Editing Information for: <span className="text-blue-600">{formData.name}</span>
          </h2>
          <p className="text-center text-gray-500 text-sm mb-6">
            Keep your child's information up-to-date for school records and safety.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <fieldset className="border rounded-lg p-4 pt-2">
              <legend className="text-lg font-medium text-gray-700 px-2">Basic Information</legend>
              <div className="space-y-4 mt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Child's Name</label>
                  <input
                    type="text"
                    readOnly
                    value={formData.name}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed shadow-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Name changes usually require contacting the school office.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Grade</label>
                  <select
                    name="grade"
                    value={formData.grade}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Grade</option>
                    <option value="K">Kindergarten</option>
                    <option value="1">Grade 1</option>
                    <option value="2">Grade 2</option>
                    <option value="3">Grade 3</option>
                    <option value="4">Grade 4</option>
                    <option value="5">Grade 5</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Update Child's Photo <span className="text-xs text-gray-500">(Optional)</span></label>
                  <input
                    type="file"
                    accept="image/png, image/jpeg"
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-gray-300 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                  />
                  <p className="text-xs text-gray-500 mt-1">Upload a recent clear photo (JPG or PNG).</p>
                </div>
              </div>
            </fieldset>

            {/* Emergency Contact */}
            <fieldset className="border rounded-lg p-4 pt-2">
              <legend className="text-lg font-medium text-gray-700 px-2">Emergency Contact</legend>
              <div className="space-y-4 mt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                  <input
                    type="text"
                    name="emergencyName"
                    value={formData.emergencyName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Full Name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    name="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Relationship to Child</label>
                  <input
                    type="text"
                    name="emergencyRelation"
                    value={formData.emergencyRelation}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Mother, Grandparent, Guardian"
                    required
                  />
                </div>
              </div>
            </fieldset>

            {/* Medical Info */}
            <fieldset className="border rounded-lg p-4 pt-2">
              <legend className="text-lg font-medium text-gray-700 px-2">Medical Information</legend>
              <div className="space-y-4 mt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Allergies or Medical Conditions</label>
                  <textarea
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="List any known allergies or important conditions"
                  ></textarea>
                </div>
              </div>
            </fieldset>

            {/* Authorized Pickup */}
            <fieldset className="border rounded-lg p-4 pt-2">
              <legend className="text-lg font-medium text-gray-700 px-2">Authorized Pick-up Persons</legend>
              <div className="space-y-4 mt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">List of Authorized Persons</label>
                  <textarea
                    name="authorizedPickup"
                    value={formData.authorizedPickup}
                    onChange={handleChange}
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="List names & phone numbers of authorized persons"
                  ></textarea>
                  <p className="text-xs text-gray-500 mt-1">
                    School staff may ask for ID from anyone on this list.
                  </p>
                </div>
              </div>
            </fieldset>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200 mt-6">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="text-gray-600 hover:text-gray-800 font-medium transition duration-150"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </main>

      <footer className="text-center text-gray-700 text-sm mt-10 pb-6">
        &copy; {new Date().getFullYear()} School Check-in System. All rights reserved.
      </footer>
    </div>
  );
}

export default UpdateChildForm;