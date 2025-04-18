function ChildCard({ student, onStatusChange }) {
    const [status, setStatus] = useState(student.status);
    const [loading, setLoading] = useState(false);
  
    const handleAction = async (action) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/log/${action}/${student._id}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await res.json();
        if (res.ok) {
          setStatus(data.newStatus);
          onStatusChange(student._id, data.newStatus);
        } else {
          alert(data.message || "Something went wrong.");
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
  
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">{student.name}</h3>
          <p className="text-gray-600">Grade {student.grade}</p>
          <p className={`mt-2 font-medium ${
            status === "checked-in" ? "text-green-600" : "text-red-600"
          }`}>
            {status === "checked-in" ? "Checked In" : "Checked Out"}
          </p>
        </div>
        <div className="flex space-x-2">
          {status === "checked-out" ? (
            <button className="bg-green-500 text-white rounded px-4 py-2" onClick={() => handleAction("dropoff")} disabled={loading}>
              Drop-off
            </button>
          ) : (
            <button className="bg-blue-500 text-white rounded px-4 py-2" onClick={() => handleAction("pickup")} disabled={loading}>
              Pick-up
            </button>
          )}
        </div>
      </div>
    );
  }
  