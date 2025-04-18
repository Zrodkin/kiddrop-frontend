// frontend/src/components/DropOffForm.js
import React, { useState } from "react";

function DropOffForm({ student, onActionComplete }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleDropOff = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/log/dropoff/${student._id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onActionComplete("checked-in");
      setMessage("✅ Drop-off successful!");
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start">
      <button
        onClick={handleDropOff}
        disabled={loading}
        className="log-button bg-green-500 hover:bg-green-600 text-white font-medium transition duration-200 ease-in-out flex items-center px-4 py-2 rounded-lg"
      >
        <i className="fas fa-arrow-down mr-2"></i>
        {loading ? "Processing..." : "Log Drop-off"}
      </button>
      {message && <p className="text-sm mt-2 text-gray-700">{message}</p>}
    </div>
  );
}

export default DropOffForm;