import React, { useState, useEffect } from "react";

function StudentManager() {
  const [students, setStudents] = useState([]);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      // Check if the response is ok
      if (!res.ok) {
        console.error("API error:", data);
        if (res.status === 401) {
          // Token expired or invalid - redirect to login
          localStorage.removeItem("token");
          localStorage.removeItem("userRole");
          localStorage.removeItem("userId");
          window.location.href = '/login';
          return;
        }
        setMessage(`❌ ${data.message || 'Failed to fetch students'}`);
        setStudents([]);
        return;
      }
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setStudents(data);
      } else {
        console.error("Expected array but got:", data);
        setStudents([]);
        setMessage("❌ Unexpected data format from server");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setMessage(`❌ ${err.message}`);
      setStudents([]); // Set to empty array to prevent map error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!name || !grade) {
      setMessage("Name and grade required.");
      return;
    }

    const token = localStorage.getItem("token");
    const url = editId
      ? `${process.env.REACT_APP_API_URL}/api/admin/students/${editId}`
      : `${process.env.REACT_APP_API_URL}/api/admin/students`;

    const method = editId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, grade }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessage(editId ? "✅ Student updated" : "✅ Student added");
      setName("");
      setGrade("");
      setEditId(null);
      fetchStudents();
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    }
  };

  const handleEdit = (student) => {
    setName(student.name);
    setGrade(student.grade);
    setEditId(student._id);
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/students/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessage("🗑️ Student deleted");
      fetchStudents();
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow mt-6 border">
      <h3 className="text-lg font-semibold mb-4">Manage Students</h3>

      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Student Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-gray-300 px-3 py-2 rounded text-sm w-full"
          />
          <input
            type="text"
            placeholder="Grade"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="border border-gray-300 px-3 py-2 rounded text-sm w-full"
          />
        </div>
        <button
          type="submit"
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded text-sm font-medium"
        >
          {editId ? "Update Student" : "Add Student"}
        </button>
        {message && <p className="text-sm mt-2">{message}</p>}
      </form>

      {loading ? (
        <div className="text-center py-4">Loading students...</div>
      ) : (
        <table className="w-full table-auto text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Grade</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(students) && students.length > 0 ? (
              students.map((s) => (
                <tr key={s._id} className="border-t">
                  <td className="px-4 py-2">{s.name}</td>
                  <td className="px-4 py-2">{s.grade}</td>
                  <td className="px-4 py-2 space-x-2">
                    <button
                      onClick={() => handleEdit(s)}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(s._id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="px-4 py-2 text-center text-gray-500">
                  {message || "No students found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default StudentManager;