import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Page Components
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard"; // Parent Dashboard
import AdminPage from "./pages/Admin"; // Assuming this is the Admin Dashboard Overview page
import UpdateChildForm from "./pages/UpdateChildForm";
// Import other admin page components as needed
// import AdminStudentList from './pages/AdminStudentList';
// import AdminSettings from './pages/AdminSettings';

// Layout/Shared Components
import Navbar from "./components/Navbar"; // Navbar for Parent sections
import AdminLayout from "./components/AdminLayout"; // Admin Layout with Sidebar
import ProtectedRoute from "./components/ProtectedRoute"; // Import the ProtectedRoute component

// Base CSS
import "./index.css";

function App() {
  // Authentication state/logic would ideally live in a Context or state management library
  // ProtectedRoute component currently reads directly from localStorage for simplicity

  return (
    <Router>
      <Routes>
        {/* Public Routes - Accessible to everyone */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Parent Routes - Require authentication, but no specific role */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute> {/* Wrap element content */}
              <>
                <Navbar />
                <Dashboard />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-child/:id"
          element={
            <ProtectedRoute> {/* Wrap element content */}
              <>
                <Navbar />
                <UpdateChildForm />
              </>
            </ProtectedRoute>
          }
        />

        {/* Admin Routes - Require authentication AND 'admin' role */}
        {/* We protect the main AdminLayout route. If the user doesn't have the admin role, */}
        {/* they won't even see the layout or any nested routes. */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin"> {/* Wrap layout, require 'admin' role */}
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          {/* Child routes render inside AdminLayout's <Outlet /> IF the ProtectedRoute allows it */}
          <Route index element={<AdminPage />} /> {/* Default component for /admin */}
          {/* Add routes for other admin sections here */}
          {/* Example:
          <Route path="students" element={<AdminStudentList />} />
          <Route path="parents" element={<div>Admin Parents Page Placeholder</div>} />
          <Route path="reports" element={<div>Admin Reports Page Placeholder</div>} />
          <Route path="messages" element={<div>Admin Messages Page Placeholder</div>} />
          <Route path="settings" element={<div>Admin Settings Page Placeholder</div>} />
          <Route path="dismissal" element={<div>Admin Dismissal Page Placeholder</div>} />
          */}
           <Route path="*" element={<Navigate to="/admin" />} /> {/* Or show a 404 specific to admin */}
        </Route>

        {/* Catch-all for top-level routes not matched */}
        {/* Redirect to login if route doesn't exist and user isn't logged in, */}
        {/* or maybe to dashboard if they are logged in? Needs auth check here too ideally. */}
        {/* For simplicity, redirecting to login for now. */}
        <Route path="*" element={<Navigate to="/login" />} />

      </Routes>
    </Router>
  );
}

export default App;
