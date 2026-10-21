import { useEffect, useMemo, useState } from 'react';
import { CssBaseline, GlobalStyles, ThemeProvider } from '@mui/material';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import { MODULOS } from './auth/roles';
import Administracion from './pages/Administracion';
import Sucursales from './pages/Sucursales';
import Usuarios from './pages/Usuarios';
import CorteCaja from './pages/CorteCaja';
import EnConstruccion from './pages/EnConstruccion';
import Historial from './pages/Historial';
import HistorialDia from './pages/HistorialDia';
import Inicio from './pages/Inicio';
import Login from './pages/Login';
import Pos from './pages/Pos';
import { crearTema, VARIABLES_CSS } from './theme';
import { guardarModo, ModoColorContext, modoInicial } from './hooks/useModoColor';

const PENDIENTES = [
  { path: '/inventario', titulo: 'Recepción de Inventario', modulo: 'inventario' },
  { path: '/precios', titulo: 'Consulta de Precios', modulo: 'precios' },
];

function App() {
  // Modo día / noche: variables CSS en <html data-tema> + tema de MUI
  const [modo, setModo] = useState(modoInicial);
  const tema = useMemo(() => crearTema(modo), [modo]);
  const modoColor = useMemo(() => ({ modo, alternar: () => setModo((m) => (m === 'oscuro' ? 'claro' : 'oscuro')) }), [modo]);

  useEffect(() => {
    document.documentElement.dataset.tema = modo;
    guardarModo(modo);
  }, [modo]);

  return (
    <ModoColorContext.Provider value={modoColor}>
      <ThemeProvider theme={tema}>
        <CssBaseline />
        <GlobalStyles styles={VARIABLES_CSS} />
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/inicio" element={<Inicio />} />
                {/* Cada módulo solo para los roles de MODULOS (auth/roles.js); el resto vuelve a Inicio */}
                <Route element={<ProtectedRoute roles={MODULOS.pos} />}>
                  <Route path="/pos" element={<Pos />} />
                </Route>
                <Route element={<ProtectedRoute roles={MODULOS.corte} />}>
                  <Route path="/corte" element={<CorteCaja />} />
                </Route>
                <Route element={<ProtectedRoute roles={MODULOS.historial} />}>
                  <Route path="/historial" element={<Historial />} />
                  <Route path="/historial/:fecha" element={<HistorialDia />} />
                </Route>
                <Route element={<ProtectedRoute roles={MODULOS.admin} />}>
                  <Route path="/admin" element={<Administracion />} />
                  <Route path="/admin/sucursales" element={<Sucursales />} />
                  <Route path="/admin/usuarios" element={<Usuarios />} />
                </Route>
                {PENDIENTES.map(({ path, titulo, modulo }) => (
                  <Route key={path} element={<ProtectedRoute roles={MODULOS[modulo]} />}>
                    <Route path={path} element={<EnConstruccion titulo={titulo} />} />
                  </Route>
                ))}
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/inicio" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </ModoColorContext.Provider>
  );
}

export default App;
