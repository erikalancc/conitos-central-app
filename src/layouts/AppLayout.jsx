import { useEffect, useState } from 'react';
import { Avatar, Box, Button, Chip, IconButton, Tooltip, Typography } from '@mui/material';
import { DarkModeOutlined, LightModeOutlined, LockOutlined } from '@mui/icons-material';
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

const YEAR = new Date().getFullYear();

// Vistas que usan todo el ancho/alto disponible y manejan su propio scroll
const PANTALLA_COMPLETA = ['/pos'];

const NAV_ITEMS = [
  { to: '/pos', label: 'Terminal POS', modulo: 'pos' },
  { to: '/corte', label: 'Corte de Caja', modulo: 'corte' },
  { to: '/historial', label: 'Historial', modulo: 'historial' },
  { to: '/admin', label: 'Administración', modulo: 'admin' },
];

const Clock = () => {
  const now = useClock();
  return (
    <Box sx={{ display: { xs: 'none', sm: 'block', md: 'none', lg: 'block' }, textAlign: 'right', lineHeight: 1.2 }}>
      <Typography sx={{ fontWeight: 600, fontSize: '1.15rem', fontVariantNumeric: 'tabular-nums', color: COLORS.brandText }}>
        {formatTime(now)}
      </Typography>
      <Typography sx={{ fontSize: '0.72rem', color: COLORS.brandText, opacity: 0.85 }}>{formatLongDate(now)}</Typography>
    </Box>
  );
};

// Cambia entre modo día y noche (se recuerda en este equipo)
const BotonModo = () => {
  const { modo, alternar } = useModoColor();
  const oscuro = modo === 'oscuro';
  return (
    <Tooltip title={oscuro ? 'Cambiar a modo día' : 'Cambiar a modo noche'}>
      <IconButton
        onClick={alternar}
        aria-label={oscuro ? 'Cambiar a modo día' : 'Cambiar a modo noche'}
        sx={{ width: 48, height: 48, borderRadius: 2.5, color: COLORS.brandText, backgroundColor: COLORS.brandSoft, '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.26)' } }}
      >
        {oscuro ? <LightModeOutlined /> : <DarkModeOutlined />}
      </IconButton>
    </Tooltip>
  );
};

const MainNav = ({ sx }) => (
  <Box
    component="nav"
    sx={[
      {
        display: 'flex',
        gap: 0.5,
        p: 0.5,
        borderRadius: 2.5,
        backgroundColor: COLORS.brandSoft,
        overflowX: 'auto',
      },
      sx,
    ]}
  >
    {NAV_ITEMS.filter((item) => puedeEntrar(getSession(), item.modulo)).map((item) => (
      <Button
        key={item.to}
        component={NavLink}
        to={item.to}
        sx={{
          flex: { xs: 1, md: 'none' },
          px: 2.5,
          minHeight: 44,
          whiteSpace: 'nowrap',
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.9rem',
          color: COLORS.brandText,
          '&:hover': { backgroundColor: COLORS.brandSoft },
          '&.active': {
            backgroundColor: COLORS.brandActive,
            color: COLORS.brandActiveText,
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.18)',
          },
        }}
      >
        {item.label}
      </Button>
    ))}
  </Box>
);

const AppLayout = () => {
  // Rol y nombre al día al entrar: si cambiaron, el menú y los permisos se ajustan sin volver a iniciar sesión
  const [, setVersionSesion] = useState(0);
  useEffect(() => {
    refrescarSesion()
      .then(() => setVersionSesion((v) => v + 1))
      .catch(() => {});
  }, []);

  const navigate = useNavigate();
  const user = getSession();
  const pantallaCompleta = PANTALLA_COMPLETA.includes(useLocation().pathname);

  const handleBloquear = () => {
    clearSession();
    navigate('/login', { replace: true });
  };

  return (
    <Box sx={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: COLORS.panelBg }}>
      {/* ENCABEZADO */}
      <Box
        component="header"
        sx={{
          flexShrink: 0,
          zIndex: (theme) => theme.zIndex.appBar,
          backgroundColor: COLORS.brand,
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.12)',
          pt: safe('top', 12),
          pb: 1.5,
          pl: { xs: safe('left', 16), lg: safe('left', 24) },
          pr: { xs: safe('right', 16), lg: safe('right', 24) },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
          {/* Marca */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0, mr: 'auto' }}>
            <Avatar
              src={logoConitos}
              alt="Conitos Central"
              sx={{
                width: 44,
                height: 44,
                backgroundColor: '#fff',
                border: '2px solid rgba(255, 255, 255, 0.6)',
                '& img': { objectFit: 'contain', p: 0.25 },
              }}
            />
            <Box sx={{ minWidth: 0, lineHeight: 1.2 }}>
              <Typography noWrap sx={{ fontWeight: 700, fontSize: '1.05rem', color: COLORS.brandText }}>
                Conitos Central
              </Typography>
              <Typography noWrap sx={{ fontSize: '0.72rem', color: COLORS.brandText, opacity: 0.85 }}>
                Terminal #{TERMINAL.numero} · {TERMINAL.sucursal}
              </Typography>
            </Box>
            <Chip
              size="small"
              icon={<Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: COLORS.yellow }} />}
              label="En Línea • Conectado"
              sx={{
                display: { xs: 'none', xl: 'inline-flex' },
                pl: 0.75,
                ml: 1,
                backgroundColor: COLORS.brandSoft,
                color: COLORS.brandText,
                fontSize: '0.72rem',
              }}
            />
          </Box>

          {/* Navegación en una sola fila (pantallas grandes) */}
          <MainNav sx={{ display: { xs: 'none', md: 'flex' }, mx: 'auto' }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, ml: 'auto' }}>
            <Clock />

            <BotonModo />

            {/* Usuario */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: { xs: 0, sm: 0.75 },
                pl: { sm: 1.5 },
                borderRadius: 2.5,
                backgroundColor: { sm: COLORS.brandSoft, md: 'transparent', lg: COLORS.brandSoft },
              }}
            >
              <Box sx={{ display: { xs: 'none', sm: 'block', md: 'none', lg: 'block' }, textAlign: 'right', lineHeight: 1.2 }}>
                <Typography noWrap sx={{ fontWeight: 600, fontSize: '0.88rem', color: COLORS.brandText, maxWidth: 160 }}>
                  {user?.nombre}
                </Typography>
                <Typography sx={{ fontWeight: 600, fontSize: '0.72rem', color: COLORS.brandText, opacity: 0.85 }}>{user?.rol}</Typography>
              </Box>
              <Avatar
                src={logoConitos}
                alt={user?.nombre}
                sx={{ width: 36, height: 36, backgroundColor: '#fff', '& img': { objectFit: 'contain' } }}
              />
            </Box>

            <Button
              onClick={handleBloquear}
              aria-label="Bloquear terminal"
              startIcon={<LockOutlined />}
              sx={{
                minHeight: 48,
                minWidth: 48,
                px: { xs: 1.5, sm: 2 },
                borderRadius: 2.5,
                textTransform: 'none',
                fontWeight: 600,
                color: COLORS.brandText,
                backgroundColor: COLORS.brandSoft,
                '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1, md: 0, lg: 1 }, ml: 0 },
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.26)' },
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline', md: 'none', lg: 'inline' } }}>
                Bloquear
              </Box>
            </Button>
          </Box>
        </Box>

        {/* Navegación en segunda fila (tablet y celular) */}
        <MainNav sx={{ display: { xs: 'flex', md: 'none' }, mt: 1.5 }} />
      </Box>

      {/* CONTENIDO */}
      <Box
        component="main"
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: pantallaCompleta ? { xs: 'auto', md: 'hidden' } : 'auto',
        }}
      >
        <Box
          sx={
            pantallaCompleta
              ? { height: { md: '100%' }, pl: safe('left', 0), pr: safe('right', 0) }
              : {
                  maxWidth: 1600,
                  mx: 'auto',
                  py: { xs: 2, md: 3 },
                  pl: { xs: safe('left', 12), sm: safe('left', 24), lg: safe('left', 32) },
                  pr: { xs: safe('right', 12), sm: safe('right', 24), lg: safe('right', 32) },
                }
          }
        >
          <Outlet />
        </Box>
      </Box>

      {/* PIE */}
      <Box
        component="footer"
        sx={{
          // En celular se oculta para dejar más espacio de trabajo
          display: { xs: 'none', sm: 'flex' },
          flexShrink: 0,
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 0.5,
          pt: 1.5,
          pb: safe('bottom', 12),
          px: { xs: 2, lg: 3 },
          borderTop: `1px solid ${COLORS.border}`,
          backgroundColor: COLORS.surface,
          fontSize: '0.72rem',
          color: COLORS.label,
          textAlign: 'center',
        }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: 2 }}>
          <span>Conitos POS {TERMINAL.version}</span>
          <span>· Impresora Térmica: Lista</span>
          <span>· Gaveta: Conectada</span>
        </Box>
        <span>© {YEAR} Conitos Central · Sistema Operativo de Mostrador</span>
      </Box>
    </Box>
  );
};

export default AppLayout;
