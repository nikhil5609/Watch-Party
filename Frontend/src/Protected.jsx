import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import Loading from "./Page/Loading/Loading"
export const ProtectedRoute = ({ children }) => {
  const { user, loggedIn, loading } = useSelector((state) => state.user);
  const location = useLocation();

  if (loading) return <Loading />

  if (!loggedIn) {
    if (location.pathname !== "/login") {
      sessionStorage.setItem("redirectAfterLogin", location.pathname);
    }
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};
