// src/routes.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import Calls from './pages/Calls';
import CallDetails from './pages/CallDetails';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/calls" />} />
        <Route path="calls" element={<Calls />} />
        <Route path="calls/:callId" element={<CallDetails />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
