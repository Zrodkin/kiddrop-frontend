import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Import the decoder

// --- Real Authentication Functions ---

const checkAuthStatus = () => {
  // 1. Get the token from localStorage (or wherever you store it)
  const token = localStorage.getItem('authToken');

  // 2. Check if token exists
  if (!token) {
    console.log("AuthCheck: No token found.");
    return false; // Not authenticated
  }

  try {
    // 3. Decode the token to check expiration
    const decodedToken = jwtDecode(token);
    // console.log("Decoded Token:", decodedToken); // For debugging

    // 4. Get current time in seconds
    const currentTime = Date.now() / 1000;

    // 5. Compare expiration time (exp is in seconds) with current time
    if (decodedToken.exp < currentTime) {
      console.log("AuthCheck: Token expired.");
      localStorage.removeItem('authToken'); // Optional: Clear expired token
      localStorage.removeItem('userRole'); // Optional: Clear related items
      return false; // Token is expired
    }

    // If token exists and is not expired
    // console.log("AuthCheck: Token valid.");
    return true; // Authenticated

  } catch (error) {
    // If token is invalid or decoding fails
    console.error("AuthCheck: Error decoding token:", error);
    localStorage.removeItem('authToken'); // Clear invalid token
    localStorage.removeItem('userRole');
    return false; // Not authenticated
  }
};

const getUserRole = () => {
  // 1. Get the token
  const token = localStorage.getItem('authToken');

  if (!token) {
    return null; // No token, no role
  }

  try {
    // 2. Decode the token
    const decodedToken = jwtDecode(token);

    // 3. Return the role from the token payload (assuming it's stored as 'role')
    // console.log("GetUserRole: Role is", decodedToken.role); // For debugging
    return decodedToken.role || null; // Return role or null if not present

  } catch (error) {
    console.error("GetUserRole: Error decoding token:", error);
    return null; // Invalid token
  }
};
// --- End Authentication Functions ---


// The ProtectedRoute component (logic remains the same, uses the real functions now)
function ProtectedRoute({ children, requiredRole }) {
  const location = useLocation();
  const isAuthenticated = checkAuthStatus();
  const userRole = getUserRole();
  const hasRequiredRole = requiredRole ? userRole === requiredRole : true;

  if (!isAuthenticated) {
    console.log("ProtectedRoute: Not authenticated, redirecting to login.");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasRequiredRole) {
    console.log(`ProtectedRoute: Role mismatch (User: ${userRole}, Required: ${requiredRole}), redirecting.`);
    return <Navigate to={userRole === 'parent' ? '/dashboard' : '/login'} replace />;
  }
  
  console.log("🔒 Authenticated:", isAuthenticated);
  console.log("👤 Role from token:", userRole);
  console.log("🔐 Required role:", requiredRole);
  
  // console.log("ProtectedRoute: Authorized, rendering children.");
  return children;
}

export default ProtectedRoute;
