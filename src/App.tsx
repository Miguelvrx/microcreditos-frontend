import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AuditoriaPage from './components/AuditoriaPage';
import ClienteList from './components/ClienteList';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import NotFound from './components/NotFound';
import RutaPrivada from './components/RutaPrivada';
import UsuariosPage from './components/UsuariosPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <RutaPrivada>
                <ClienteList />
              </RutaPrivada>
            }
          />
          <Route
            path="/dashboard"
            element={
              <RutaPrivada>
                <Dashboard />
              </RutaPrivada>
            }
          />
          <Route
            path="/usuarios"
            element={
              <RutaPrivada rolRequerido="ADMIN">
                <UsuariosPage />
              </RutaPrivada>
            }
          />
          <Route
            path="/auditoria"
            element={
              <RutaPrivada rolRequerido="ADMIN">
                <AuditoriaPage />
              </RutaPrivada>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;