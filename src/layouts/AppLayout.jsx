import { useEffect, useState } from 'react';
import { Avatar, Box, Button, Chip, Divider, Drawer, IconButton, Tooltip, Typography } from '@mui/material';
import {
  AdminPanelSettingsOutlined,
  Close,
  DarkModeOutlined,
  HistoryOutlined,
  LightModeOutlined,
  LockOutlined,
  Menu as MenuIcon,
  PointOfSale,
  ReceiptLongOutlined,
} from '@mui/icons-material';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import logoConitos from '../assets/logo-conitos.png';
import { puedeEntrar } from '../auth/roles';
import { clearSession, getSession } from '../auth/session';
import { refrescarSesion } from '../services/authService';
import { TERMINAL } from '../data/dummy';
import useClock from '../hooks/useClock';
import useModoColor from '../hooks/useModoColor';
import { COLORS, safe } from '../theme';
import { formatLongDate, formatTime } from '../utils/format';
import ChecklistObligatorio from '../pages/inicio/ChecklistObligatorio';

const YEAR = new Date().getFullYear();

// Vistas que usan todo el ancho/alto disponible y manejan su propio scroll
const PANTALLA_COMPLETA = ['/pos'];

const NAV_ITEMS = [
  { to: '/pos', label: 'Terminal POS', modulo: 'pos', icono: <PointOfSale /> },
  { to: '/corte', label: 'Corte de Caja', modulo: 'corte', icono: <ReceiptLongOutlined /> },
  { to: '/historial', label: 'Historial', modulo: 'historial', icono: <HistoryOutlined /> },
  { to: '/admin', label: 'Administración', modulo: 'admin', icono: <AdminPanelSettingsOutlined /> },
];

// Ancho del riel lateral (siempre visible)
const ANCHO_RIEL = { xs: 60, md: 72 };
const ANCHO_MENU = 300;

// Estilo común de los botones sobre el azul de la marca
const BOTON_MARCA = {
  color: COLORS.brandText,
  backgroundColor: COLORS.brandSoft,
  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.26)' },
};

const ESTILO_ACTIVO = {
  backgroundColor: COLORS.brandActive,
  color: COLORS.brandActiveText,
  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.18)',
  '&:hover': { backgroundColor: COLORS.brandActive },
};

const navPermitida = () => NAV_ITEMS.filter((item) => puedeEntrar(getSession(), item.modulo));

const Reloj = () => {
  const now = useClock();
  return (
    <Box sx={{ p: 1.5, borderRadius: 2.5, backgroundColor: COLORS.brandSoft, lineHeight: 1.2 }}>
      <Typography sx={{ fontWeight: 600, fontSize: '1.5rem', fontVariantNumeric: 'tabular-nums', color: COLORS.brandText }}>
        {formatTime(now)}
      </Typography>
      <Typography sx={{ fontSize: '0.75rem', color: COLORS.brandText, opacity: 0.85, textTransform: 'capitalize' }}>
        {formatLongDate(now)}
      </Typography>
    </Box>
  );
};

/* ---------------- RIEL LATERAL (siempre visible, solo íconos) ---------------- */

const RielLateral = ({ onAbrirMenu, onBloquear }) => {
  const { modo, alternar } = useModoColor();
  const oscuro = modo === 'oscuro';
  const user = getSession();

  // Los botones del riel no deben abrir el menú al hacer clic
  const sinPropagar = (fn) => (e) => {
    e.stopPropagation();
    fn?.();
  };

  const tamBoton = { width: { xs: 44, md: 48 }, height: { xs: 44, md: 48 }, borderRadius: 2.5 };

  return (
    <Box
      component="aside"
      aria-label="Menú lateral"
      onClick={onAbrirMenu}
      sx={{
        flexShrink: 0,
        width: ANCHO_RIEL,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        pt: safe('top', 12),
        pb: safe('bottom', 12),
        pl: safe('left', 0),
        cursor: 'pointer',
        zIndex: (theme) => theme.zIndex.appBar,
        backgroundColor: COLORS.brand,
        boxShadow: '2px 0 8px rgba(15, 23, 42, 0.12)',
        overflowY: 'auto',
      }}
    >
      <Tooltip title="Abrir menú" placement="right">
        <IconButton aria-label="Abrir menú" onClick={sinPropagar(onAbrirMenu)} sx={{ ...tamBoton, ...BOTON_MARCA }}>
          <MenuIcon />
        </IconButton>
      </Tooltip>

      <Avatar
        src={logoConitos}
        alt="Conitos Central"
        sx={{ width: 40, height: 40, my: 0.5, backgroundColor: '#fff', border: '2px solid rgba(255, 255, 255, 0.6)', '& img': { objectFit: 'contain', p: 0.25 } }}
      />

      <Divider flexItem sx={{ mx: 1.5, borderColor: 'rgba(255, 255, 255, 0.25)' }} />

      {/* Accesos directos a cada módulo */}
      <Box component="nav" sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        {navPermitida().map((item) => (
          <Tooltip key={item.to} title={item.label} placement="right">
            <IconButton
              component={NavLink}
              to={item.to}
              aria-label={item.label}
              onClick={(e) => e.stopPropagation()}
              sx={{ ...tamBoton, color: COLORS.brandText, '&:hover': { backgroundColor: COLORS.brandSoft }, '&.active': ESTILO_ACTIVO }}
            >
              {item.icono}
            </IconButton>
          </Tooltip>
        ))}
      </Box>

      <Box sx={{ flex: 1 }} />

      <Tooltip title={oscuro ? 'Cambiar a modo día' : 'Cambiar a modo noche'} placement="right">
        <IconButton aria-label={oscuro ? 'Cambiar a modo día' : 'Cambiar a modo noche'} onClick={sinPropagar(alternar)} sx={{ ...tamBoton, ...BOTON_MARCA }}>
          {oscuro ? <LightModeOutlined /> : <DarkModeOutlined />}
        </IconButton>
      </Tooltip>

      <Tooltip title="Bloquear terminal" placement="right">
        <IconButton aria-label="Bloquear terminal" onClick={sinPropagar(onBloquear)} sx={{ ...tamBoton, ...BOTON_MARCA }}>
          <LockOutlined />
        </IconButton>
      </Tooltip>

      <Tooltip title={`${user?.nombre ?? ''} · ${user?.rol ?? ''}`} placement="right">
        <Avatar src={logoConitos} alt={user?.nombre} sx={{ width: 36, height: 36, mt: 0.5, backgroundColor: '#fff', '& img': { objectFit: 'contain' } }} />
      </Tooltip>
    </Box>
  );
};

/* ---------------- MENÚ COMPLETO (se abre al tocar el riel) ---------------- */

const MenuPrincipal = ({ abierto, onCerrar, onBloquear }) => {
  const { modo, alternar } = useModoColor();
  const oscuro = modo === 'oscuro';
  const user = getSession();

  const botonFila = {
    minHeight: 48,
    px: 2,
    justifyContent: 'flex-start',
    gap: 1.5,
    borderRadius: 2.5,
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.92rem',
  };

  return (
    <Drawer
      anchor="left"
      open={abierto}
      onClose={onCerrar}
      slotProps={{
        paper: {
          sx: {
            width: ANCHO_MENU,
            maxWidth: '85vw',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            pt: safe('top', 16),
            pb: safe('bottom', 16),
            pl: safe('left', 16),
            pr: 2,
            color: COLORS.brandText,
            backgroundColor: COLORS.brand,
            borderTopRightRadius: 16,
            borderBottomRightRadius: 16,
          },
        },
      }}
    >
      {/* Marca */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
        <Avatar
          src={logoConitos}
          alt="Conitos Central"
          sx={{ width: 44, height: 44, backgroundColor: '#fff', border: '2px solid rgba(255, 255, 255, 0.6)', '& img': { objectFit: 'contain', p: 0.25 } }}
        />
        <Box sx={{ flex: 1, minWidth: 0, lineHeight: 1.2 }}>
          <Typography noWrap sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
            Conitos Central
          </Typography>
          <Typography noWrap sx={{ fontSize: '0.72rem', opacity: 0.85 }}>
            {user?.sucursal ?? `Terminal #${TERMINAL.numero}`}
          </Typography>
        </Box>
        <IconButton aria-label="Cerrar menú" onClick={onCerrar} sx={{ width: 40, height: 40, borderRadius: 2, ...BOTON_MARCA }}>
          <Close />
        </IconButton>
      </Box>

      <Chip
        size="small"
        icon={<Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: COLORS.yellow }} />}
        label="En Línea • Conectado"
        sx={{ alignSelf: 'flex-start', pl: 0.75, backgroundColor: COLORS.brandSoft, color: COLORS.brandText, fontSize: '0.72rem' }}
      />

      <Reloj />

      {/* Usuario */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, p: 1.25, borderRadius: 2.5, backgroundColor: COLORS.brandSoft }}>
        <Avatar src={logoConitos} alt={user?.nombre} sx={{ width: 40, height: 40, backgroundColor: '#fff', '& img': { objectFit: 'contain' } }} />
        <Box sx={{ minWidth: 0, lineHeight: 1.2 }}>
          <Typography noWrap sx={{ fontWeight: 600, fontSize: '0.92rem' }}>
            {user?.nombre}
          </Typography>
          <Typography sx={{ fontWeight: 600, fontSize: '0.75rem', opacity: 0.85 }}>{user?.rol}</Typography>
        </Box>
      </Box>

      {/* Navegación */}
      <Box>
        <Typography sx={{ px: 1, mb: 0.75, fontSize: '0.7rem', fontWeight: 700, letterSpacing: 0.8, opacity: 0.8 }}>MÓDULOS</Typography>
        <Box component="nav" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {navPermitida().map((item) => (
            <Button
              key={item.to}
              component={NavLink}
              to={item.to}
              onClick={onCerrar}
              startIcon={item.icono}
              sx={{
                ...botonFila,
                color: COLORS.brandText,
                '& .MuiButton-startIcon': { m: 0 },
                '&:hover': { backgroundColor: COLORS.brandSoft },
                '&.active': ESTILO_ACTIVO,
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>
      </Box>

      <Box sx={{ flex: 1 }} />

      {/* Acciones */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        <Button onClick={alternar} startIcon={oscuro ? <LightModeOutlined /> : <DarkModeOutlined />} sx={{ ...botonFila, ...BOTON_MARCA, '& .MuiButton-startIcon': { m: 0 } }}>
          {oscuro ? 'Modo día' : 'Modo noche'}
        </Button>
        <Button onClick={onBloquear} startIcon={<LockOutlined />} sx={{ ...botonFila, ...BOTON_MARCA, '& .MuiButton-startIcon': { m: 0 } }}>
          Bloquear terminal
        </Button>
      </Box>

      {/* Estado del equipo (antes en el pie de página) */}
      <Box sx={{ pt: 1.5, borderTop: '1px solid rgba(255, 255, 255, 0.25)', fontSize: '0.7rem', opacity: 0.85, display: 'grid', gap: 0.25 }}>
        <span>Conitos POS {TERMINAL.version}</span>
        <span>Impresora Térmica: Lista · Gaveta: Conectada</span>
        <span>© {YEAR} Conitos Central</span>
      </Box>
    </Drawer>
  );
};

/* ---------------- LAYOUT ---------------- */

const AppLayout = () => {
  // Rol y nombre al día al entrar: si cambiaron, el menú y los permisos se ajustan sin volver a iniciar sesión
  const [, setVersionSesion] = useState(0);
  useEffect(() => {
    refrescarSesion()
      .then(() => setVersionSesion((v) => v + 1))
      .catch(() => {});
  }, []);

  const [menuAbierto, setMenuAbierto] = useState(false);
  const navigate = useNavigate();
  const pantallaCompleta = PANTALLA_COMPLETA.includes(useLocation().pathname);

  const handleBloquear = () => {
    setMenuAbierto(false);
    clearSession();
    navigate('/login', { replace: true });
  };

  return (
    <Box sx={{ height: '100dvh', display: 'flex', overflow: 'hidden', backgroundColor: COLORS.panelBg }}>
      <RielLateral onAbrirMenu={() => setMenuAbierto(true)} onBloquear={handleBloquear} />
      <MenuPrincipal abierto={menuAbierto} onCerrar={() => setMenuAbierto(false)} onBloquear={handleBloquear} />
      {/* Vendedor / Cajero: checklist de apertura obligatorio en cualquier pantalla hasta guardarlo */}
      <ChecklistObligatorio />

      {/* CONTENIDO: ocupa todo el alto y el resto del ancho */}
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          overflowY: pantallaCompleta ? { xs: 'auto', md: 'hidden' } : 'auto',
        }}
      >
        <Box
          sx={
            pantallaCompleta
              ? { height: { md: '100%' }, pr: safe('right', 0) }
              : {
                  maxWidth: 1600,
                  mx: 'auto',
                  pt: { xs: safe('top', 16), md: safe('top', 24) },
                  pb: { xs: safe('bottom', 16), md: safe('bottom', 24) },
                  pl: { xs: 1.5, sm: 3, lg: 4 },
                  pr: { xs: safe('right', 12), sm: safe('right', 24), lg: safe('right', 32) },
                }
          }
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AppLayout;
