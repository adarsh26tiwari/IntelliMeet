import { useAuth } from "../hooks/useAuth";
import { FaSpinner } from "react-icons/fa";
import {Navigate}  from 'react-router-dom'
import { ROUTES } from "../utils/constants";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin h-12 w-12 text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }


  if(!isAuthenticated){
    return <Navigate to={ROUTES.HOME} replace/>
  }


  return children;
}



export default ProtectedRoute;