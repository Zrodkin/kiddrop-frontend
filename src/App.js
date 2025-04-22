import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Page Components
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard"; // Parent Dashboard
import AdminPage from "./pages/Admin"; // Admin Dashboard
import UpdateChildForm from "./pages/UpdateChildForm";
import AddChildForm from "./pages/AddChildForm.js"; // ✅ New import
import AdminSendAlertPage from './pages/AdminSendAlertPage';
import ParentInbox from "./pages/ParentInbox";
// ...

// Ensure this route is inside the <Routes> component
// ...

// Layout/Shared Components
import Navbar from "./components/Navbar";
import AdminLayout from "./components/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// Base CSS
import "./index.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
    

        {/* Parent Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
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
            <ProtectedRoute>
              <>
                <Navbar />
                <UpdateChildForm />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-child"
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <AddChildForm />
              </>
            </ProtectedRoute>
          }
        />
        <Route
  path="/inbox"
  element={
    <ProtectedRoute>
      <>
        <Navbar />
        <ParentInbox />
      </>
    </ProtectedRoute>
  }
/>


        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminPage />} />
          <Route path="send-alert" element={<AdminSendAlertPage />} />
          <Route path="*" element={<Navigate to="/admin" />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
