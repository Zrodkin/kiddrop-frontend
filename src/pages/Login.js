import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // Added useLocation

function Login() {
  // State hooks for form inputs and messages
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  // Hooks for navigation and getting location state (for redirect after login)
  const navigate = useNavigate();
  const location = useLocation();

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default page reload
    setMessage(""); // Clear previous messages

    // Inside handleSubmit in Login.js
    try {
      // Make API call - ensure REACT_APP_API_URL is set in your .env file for frontend
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'; // Fallback if env var not set
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      // --- Logging for verification ---
      console.log("Login Success! Data received:", data); // Log the received data
      console.log("Attempting to save token:", data.token);
      localStorage.setItem("token", data.token); // Use the correct key "token"
      console.log("Token SAVED to localStorage"); // Confirm save call happened

      console.log("Attempting to save role:", data.user.role);
      localStorage.setItem("userRole", data.user.role); // Use the correct key "userRole"
      console.log("Role SAVED to localStorage"); // Confirm save call happened

      localStorage.setItem("userId", data.user.id);
      // --- End Logging ---

      setMessage("✅ Login successful! Redirecting...");

      // Determine where to redirect based on role or previous location
      const destination = location.state?.from?.pathname || (data.user.role === "admin" ? "/admin" : "/dashboard");
      console.log(`Navigating to: ${destination}`); // Log before navigating

      navigate(destination, { replace: true }); // Navigate after setting items
      console.log("✅ Should be redirecting to:", destination);
      console.log("🔧 Using API URL:", `${apiUrl}/api/auth/login`);


    } catch (err) {
      // Handle errors during fetch or login logic
      setMessage(`❌ ${err.message}`);
      console.error("Login Catch Block Error:", err);
      // Clear potentially stored items on failure
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
    }
  }; // <--- Added the missing closing brace for handleSubmit here!

  // JSX for the login form component
  return (
    <div className="antialiased flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 space-y-6 border border-gray-200">
        {/* Form Header */}
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Parent Login</h1>
          <p className="text-gray-600 mt-1">Access your school check-in dashboard.</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {/* Show/Hide Password Toggle */}
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
              </span>
            </div>
          </div>

          {/* Remember Me & Forgot Password Links */}
          <div className="flex items-center justify-between">
            <label htmlFor="remember-me" className="flex items-center">
              <input id="remember-me" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
              <span className="ml-2 text-sm text-gray-800">Remember me</span>
            </label>
            <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
              Forgot your password?
            </a>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
          >
            Log In
          </button>

          {/* Display Success/Error Messages */}
          {message && (
             <p className={`text-sm mt-2 text-center ${message.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
                {message}
             </p>
          )}
        </form>

        {/* Link to Signup Page */}
        <div className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <a href="/signup" className="font-medium text-blue-600 hover:text-blue-700 hover:underline">
            Sign up here
          </a>
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-gray-400 mt-6">
          &copy; {new Date().getFullYear()} School Check-in System.
        </footer>
      </div>
    </div>
  );

} // <--- The closing brace for the Login component function

export default Login;