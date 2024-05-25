import { Navigate, Outlet } from "react-router-dom";

const PrivateComponent = ({ path, element }) => {
  const isAuthenticated = localStorage.getItem("access") ? true : false;
  return isAuthenticated ? <Outlet /> : <Navigate to="/" />;
};

export default PrivateComponent;
