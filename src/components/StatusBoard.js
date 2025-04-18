// frontend/src/components/StatusBoard.js
import React from "react";

function StatusBoard({ stats }) {
  const tiles = [
    {
      icon: "check-circle",
      label: "Checked In",
      value: stats.checkedIn || 0,
      color: "green"
    },
    {
      icon: "sign-out-alt",
      label: "Checked Out",
      value: stats.checkedOut || 0,
      color: "red"
    },
    {
      icon: "users",
      label: "Total Students",
      value: stats.totalStudents || 0,
      color: "blue"
    },
    {
      icon: "exclamation-triangle",
      label: "Alerts Today",
      value: stats.alerts || 0,
      color: "yellow",
      pulse: true
    }
  ];

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Dashboard Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((tile, i) => (
          <div key={i} className={`bg-white p-5 rounded-lg shadow border border-${tile.color}-200 flex items-center space-x-4`}>
            <div className={`bg-${tile.color}-100 p-3 rounded-full ${tile.pulse ? "animate-pulse" : ""}`}>
              <i className={`fas fa-${tile.icon} text-2xl text-${tile.color}-600`}></i>
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">{tile.label}</p>
              <p className={`text-2xl font-semibold ${tile.color === "yellow" ? "text-yellow-700" : "text-gray-900"}`}>{tile.value}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default StatusBoard;