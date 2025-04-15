// src/routes.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import Appointments from './pages/Appointments';
import Clients from './pages/Clients';
import Colaboradores from './pages/Colaboradores';
import ClientDetail from './pages/ClientDetail';
import ProjectDetail from "./components/ProjectDetail";
import Calls from './pages/Calls'; // <-- importação adicionada
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
        <Route index element={<Navigate to="/projects" />} />
        <Route path="projects" element={<Projects />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="clients" element={<Clients />} />
        <Route path="colaboradores" element={<Colaboradores />} />
        <Route path="clients/:id" element={<ClientDetail />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="calls" element={<Calls />} /> {/* <-- rota de chamados */}
        <Route path="/calls/:callId" element={<CallDetails />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
