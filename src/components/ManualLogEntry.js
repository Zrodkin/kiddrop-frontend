// frontend/src/components/ManualLogEntry.js
import React, { useState } from "react";

function ManualLogEntry({ students }) {
  const [selectedId, setSelectedId] = useState("");
  const [action, setAction] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!selectedId || !action) {
      setMessage("Please select a student and an action.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/log/${action}/${selectedId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to log action");

      setMessage(`✅ ${action} successful for selected student.`);
      setSelectedId("");
      setAction("");
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow border mt-4">
      <h3 className="text-lg font-semibold mb-4">Manual Log Entry</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="">-- Choose a student --</option>
            {students.map((s) => (
              <option key={s._id} value={s._id}>{s.name} ({s.grade})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="">-- Select action --</option>
            <option value="dropoff">Drop-off</option>
            <option value="pickup">Pick-up</option>
          </select>
        </div>

        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm"
        >
          Submit Log
        </button>

        {message && (
          <p className="mt-2 text-sm">
            {message}
          </p>
        )}
      </form>
    </div>
  );
}

export default ManualLogEntry;
