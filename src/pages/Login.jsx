import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import {
  AccountCircleOutlined,
  ArrowForward,
  HttpsOutlined,
  LockOutlined,
  Sensors,
  StorefrontOutlined,
  VisibilityOutlined,
  VisibilityOffOutlined,
  Wifi,
} from '@mui/icons-material';
import { Navigate, useNavigate } from 'react-router-dom';
import logoConitos from '../assets/logo-conitos.png';
import { getSession, saveSession } from '../auth/session';
import { DUMMY_USER } from '../data/dummy';
import { COLORS, SHORT_SCREEN, safe } from '../theme';

// Patrón de conitos para el fondo del panel azul
const conePattern = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='56' height='64' viewBox='0 0 56 64'>
    <g fill='none' stroke='white' stroke-opacity='0.13' stroke-width='1.5' stroke-linejoin='round'>
      <circle cx='28' cy='20' r='7'/>
      <path d='M21 27h14l-7 22z'/>
      <path d='M24 32l6 5M32 32l-6 5'/>
    </g>
  </svg>`
)}")`;

const inputSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: COLORS.inputBg,
    borderRadius: 2,
    minHeight: { xs: 52, md: 56 },
    // 16px mínimo: evita que iOS haga zoom al enfocar el campo
    fontSize: '1rem',
    '& fieldset': { borderColor: 'transparent' },
    '&:hover fieldset': { borderColor: '#d5dbe3' },
    '&.Mui-focused fieldset': { borderColor: COLORS.blue, borderWidth: 1.5 },
  },
};

const labelSx = {
  display: 'block',
  mb: 0.75,
  fontSize: { xs: '0.8rem', md: '0.85rem' },
  fontWeight: 700,
  color: COLORS.label,
};

const iconSx = { fontSize: 22, color: '#334155' };

const Login = () => {
  const [usuario, setUsuario] = useState('smartinez');
  const [password, setPassword] = useState('1234');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  if (getSession()) return <Navigate to="/inicio" replace />;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulación de la respuesta del API
    setTimeout(() => {
      if (usuario === DUMMY_USER.usuario && password === DUMMY_USER.password) {
        const { password: _omit, ...session } = DUMMY_USER;
        saveSession(session);
        navigate('/inicio', { replace: true });
        return;
      }
      setError('Usuario o contraseña incorrectos (prueba con smartinez / 1234)');
      setLoading(false);
    }, 900);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        minHeight: '100dvh',
        height: { sm: '100dvh' },
        backgroundColor: COLORS.panelBg,
      }}
    >
      {/* PANEL IZQUIERDO: Branding (encabezado en celular) */}
      <Box
        component="aside"
        sx={{
          flex: { sm: '0 0 40%', lg: '0 0 42%' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: { xs: 2.5, sm: 4 },
          pt: { xs: safe('top', 16), sm: safe('top', 28), lg: safe('top', 36) },
          pb: { xs: 3, sm: safe('bottom', 24), lg: safe('bottom', 32) },
          pl: { xs: safe('left', 16), sm: safe('left', 28), lg: safe('left', 40) },
          pr: { xs: safe('right', 16), sm: 3.5, lg: 5 },
          color: '#fff',
          backgroundColor: COLORS.blue,
          backgroundImage: [
            'radial-gradient(circle at 90% 105%, rgba(110, 214, 170, 0.45), transparent 40%)',
            conePattern,
            `linear-gradient(180deg, ${COLORS.blue} 0%, ${COLORS.blueDark} 100%)`,
          ].join(', '),
          backgroundSize: 'auto, 56px 64px, auto',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
          <Chip
            size="small"
            icon={
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#4ade80',
                  boxShadow: '0 0 6px #4ade80',
                }}
              />
            }
            label="TERMINAL ACTIVA • EN LÍNEA"
            sx={{
              pl: 0.75,
              backgroundColor: 'rgba(15, 40, 70, 0.45)',
              color: '#fff',
              fontWeight: 700,
              fontSize: { xs: '0.62rem', md: '0.7rem' },
              letterSpacing: 0.3,
            }}
          />
          <Chip
            size="small"
            label="POS v2.4"
            sx={{
              backgroundColor: COLORS.red,
              color: '#fff',
              fontWeight: 700,
              fontSize: { xs: '0.65rem', md: '0.72rem' },
            }}
          />
        </Box>

        <Box sx={{ textAlign: 'center', my: { sm: 'auto' } }}>
          <Box
            component="img"
            src={logoConitos}
            alt="Conitos Central"
            sx={{
              width: { xs: 120, sm: 170, md: 210, lg: 240 },
              maxWidth: '80%',
              height: 'auto',
              filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.25))',
              [SHORT_SCREEN]: { width: 110 },
            }}
          />
          <Typography
            component="h2"
            sx={{
              mt: { xs: 1.5, sm: 4, lg: 6 },
              fontWeight: 800,
              fontSize: { xs: '1.1rem', sm: '1.2rem', lg: '1.5rem' },
              lineHeight: 1.25,
              [SHORT_SCREEN]: { mt: 1.5 },
            }}
          >
            Punto de Venta y Control Operativo
          </Typography>
          <Typography sx={{ mt: 0.5, fontSize: { xs: '0.8rem', lg: '0.95rem' }, opacity: 0.9 }}>
            Tradición y sabor artesanal en cada cono.
          </Typography>
        </Box>

        <Box
          sx={{
            display: { xs: 'none', sm: 'flex' },
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1,
            fontSize: { sm: '0.72rem', lg: '0.8rem' },
            fontWeight: 600,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Wifi sx={{ fontSize: 16, color: '#4ade80' }} />
            Servicio Cloud Conectado
          </Box>
          <span>Latencia: 18ms</span>
        </Box>
      </Box>

      {/* PANEL DERECHO: Formulario */}
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflowY: { sm: 'auto' },
          pt: { xs: 3.5, sm: safe('top', 32) },
          pb: safe('bottom', 16),
          pl: { xs: safe('left', 16), sm: 4, md: 6 },
          pr: { xs: safe('right', 16), sm: safe('right', 32), md: safe('right', 48) },
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 480, mx: 'auto', my: { sm: 'auto' } }}>
          <Chip
            size="small"
            icon={<StorefrontOutlined sx={{ fontSize: '1rem !important', color: `${COLORS.blue} !important` }} />}
            label="PUNTO DE VENTA CENTRAL"
            sx={{
              px: 0.5,
              mb: 1.5,
              backgroundColor: '#dfe8f2',
              color: '#1e3a5f',
              fontWeight: 700,
              fontSize: { xs: '0.62rem', md: '0.68rem' },
              letterSpacing: 0.3,
            }}
          />

          <Typography
            component="h1"
            sx={{ fontSize: { xs: '1.6rem', md: '1.85rem', lg: '2rem' }, fontWeight: 800, color: COLORS.ink }}
          >
            Iniciar Sesión
          </Typography>
          <Typography sx={{ mt: 0.5, mb: 3, fontSize: { xs: '0.85rem', md: '0.9rem' }, color: COLORS.muted }}>
            Ingresa tu usuario y contraseña para acceder a la terminal de punto de venta.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, md: 2.5 },
                pb: { xs: 3, md: 3.5 },
                mb: 2.5,
                borderRadius: 3,
                border: '1px solid #e8ecf1',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
              }}
            >
              <Typography component="label" htmlFor="usuario" sx={labelSx}>
                Usuario o ID de Operador
              </Typography>
              <TextField
                id="usuario"
                fullWidth
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="smartinez"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                sx={{ ...inputSx, mb: 2.25 }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <AccountCircleOutlined sx={iconSx} />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Typography component="label" htmlFor="password" sx={labelSx}>
                Contraseña / NIP
              </Typography>
              <TextField
                id="password"
                fullWidth
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={inputSx}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined sx={iconSx} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          onClick={() => setShowPassword((show) => !show)}
                          edge="end"
                          sx={{ p: 1.25 }}
                        >
                          {showPassword ? <VisibilityOffOutlined sx={iconSx} /> : <VisibilityOutlined sx={iconSx} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Paper>

            <Button
              fullWidth
              type="submit"
              variant="contained"
              disableElevation
              disabled={loading}
              endIcon={<ArrowForward />}
              sx={{
                minHeight: { xs: 54, md: 58 },
                borderRadius: 2.5,
                backgroundColor: COLORS.red,
                fontWeight: 800,
                fontSize: { xs: '0.95rem', md: '1rem' },
                letterSpacing: 0.3,
                boxShadow: '0 6px 16px rgba(238, 42, 71, 0.3)',
                '&:hover': { backgroundColor: COLORS.redHover },
                '&.Mui-disabled': { backgroundColor: COLORS.red, color: '#fff', opacity: 0.7 },
              }}
            >
              {loading ? 'Verificando…' : 'Iniciar Sesión'}
            </Button>
          </Box>

          <Box
            sx={{
              mt: 1.5,
              py: 1.75,
              px: 2,
              borderRadius: 2,
              backgroundColor: COLORS.inputBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
            }}
          >
            <Sensors sx={{ fontSize: 20, color: '#5b8fb9', flexShrink: 0 }} />
            <Typography sx={{ fontSize: { xs: '0.75rem', md: '0.8rem' }, color: '#475569' }}>
              O aproxima tu gafete o pulsera <strong>RFID</strong> al lector para acceso inmediato
            </Typography>
          </Box>
        </Box>

        <Box
          component="footer"
          sx={{
            mt: 4,
            pt: 2,
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.5,
          }}
        >
          <HttpsOutlined sx={{ fontSize: 15, color: '#4caf50' }} />
          <Typography sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' }, color: COLORS.muted }}>
            Conitos Central POS • Sistema Seguro TLS 1.3
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
