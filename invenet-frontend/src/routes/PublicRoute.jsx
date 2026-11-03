import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Cargando Invenet...
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}