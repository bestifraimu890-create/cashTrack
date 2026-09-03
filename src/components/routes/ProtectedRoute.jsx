import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { isSignupPending } from "../../lib/auth.js";

function LoadingSpinner() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-paper">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-700" />
    </div>
  );
}

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

export function RoleProtectedRoute({ allowedRole, children }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  // Verification gate: an unverified signup can never reach a dashboard.
  if (isSignupPending()) return <Navigate to="/signup" replace />;
  if (role && role !== allowedRole) {
    const base = role === "parent" ? "/parent" : role === "admin" ? "/admin" : "/student";
    return <Navigate to={base} replace />;
  }
  return children;
}

export function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  // A transient session from signUp (before the magic link is clicked)
  // must not bounce the user into the app.
  if (user && !isSignupPending()) return <Navigate to="/app" replace />;
  return children;
}
