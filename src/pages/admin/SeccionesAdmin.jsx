import { Box, Button } from '@mui/material';
import { GroupOutlined, StorefrontOutlined, StoreMallDirectoryOutlined } from '@mui/icons-material';
import { NavLink } from 'react-router-dom';
import { COLORS } from '../../theme';

const SECCIONES = [
  { to: '/admin', label: 'Catálogo y precios', icono: <StorefrontOutlined /> },
  { to: '/admin/sucursales', label: 'Sucursales', icono: <StoreMallDirectoryOutlined /> },
  { to: '/admin/usuarios', label: 'Usuarios', icono: <GroupOutlined /> },
];

// Cambia entre las secciones de Administración
const SeccionesAdmin = () => (
  <Box component="nav" aria-label="Secciones de administración" sx={{ display: 'flex', gap: 0.5, p: 0.5, borderRadius: 3, backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}`, justifySelf: 'start', maxWidth: '100%', overflowX: 'auto' }}>
    {SECCIONES.map((s) => (
      <Button
        key={s.to}
        component={NavLink}
        to={s.to}
        end
        startIcon={s.icono}
        sx={{
          minHeight: 44,
          px: 2,
          borderRadius: 2.5,
          whiteSpace: 'nowrap',
          textTransform: 'none',
          fontWeight: 700,
          color: COLORS.label,
          '&.active': { color: COLORS.surface, backgroundColor: COLORS.blueText },
        }}
      >
        {s.label}
      </Button>
    ))}
  </Box>
);

export default SeccionesAdmin;
