import { CssBaseline, ThemeProvider } from '@mui/material';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import CorteCaja from './pages/CorteCaja';
import EnConstruccion from './pages/EnConstruccion';
import Historial from './pages/Historial';
import HistorialDia from './pages/HistorialDia';
import Inicio from './pages/Inicio';
import Login from './pages/Login';
import Pos from './pages/Pos';
import { theme } from './theme';

const PENDIENTES = [
  { path: '/inventario', titulo: 'Recepción de Inventario' },
  { path: '/precios', titulo: 'Consulta de Precios' },
];

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/inicio" element={<Inicio />} />
              <Route path="/pos" element={<Pos />} />
              <Route path="/corte" element={<CorteCaja />} />
              <Route path="/historial" element={<Historial />} />
              <Route path="/historial/:fecha" element={<HistorialDia />} />
              {PENDIENTES.map(({ path, titulo }) => (
                <Route key={path} path={path} element={<EnConstruccion titulo={titulo} />} />
              ))}
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/inicio" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
