// frontend/src/components/PickUpForm.js
import React, { useState } from "react";

function PickUpForm({ student, onActionComplete }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handlePickUp = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/log/pickup/${student._id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onActionComplete("checked-out");
      setMessage("✅ Pick-up successful!");
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start">
      <button
        onClick={handlePickUp}
        disabled={loading}
        className="log-button bg-blue-500 hover:bg-blue-600 text-white font-medium transition duration-200 ease-in-out flex items-center px-4 py-2 rounded-lg"
      >
        <i className="fas fa-arrow-up mr-2"></i>
        {loading ? "Processing..." : "Log Pick-up"}
      </button>
      {message && <p className="text-sm mt-2 text-gray-700">{message}</p>}
    </div>
  );
}

export default PickUpForm;