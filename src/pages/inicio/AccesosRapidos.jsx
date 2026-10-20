import { Box, ButtonBase, Chip, Typography } from '@mui/material';
import { ChevronRight, IcecreamOutlined, Inventory2Outlined, ReceiptLongOutlined, Search } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import IconTile from '../../components/IconTile';
import { CORTE_ANTERIOR, LOTES_PENDIENTES } from '../../data/dummy';
import { COLORS } from '../../theme';
import { formatMoney } from '../../utils/format';

const ACCESOS = [
  {
    to: '/pos',
    titulo: 'Terminal de Ventas',
    descripcion: 'Conos dobles, sencillos, paletas y sundaes',
    icono: <IcecreamOutlined />,
    bg: COLORS.blueSoft,
    color: COLORS.blueText,
  },
  {
    to: '/corte',
    titulo: 'Corte Anterior & Arqueo',
    descripcion: `Ver resumen de corte Z y cierre previo (${formatMoney(CORTE_ANTERIOR)})`,
    icono: <ReceiptLongOutlined />,
    bg: COLORS.inputBg,
    color: COLORS.label,
  },
  {
    to: '/inventario',
    titulo: 'Recepción de Inventario',
    descripcion: 'Ingreso de barquillos, botes de helado y bases',
    icono: <Inventory2Outlined />,
    bg: COLORS.yellowSoft,
    color: '#8a6d00',
    badge: `${LOTES_PENDIENTES} Lotes`,
  },
  {
    to: '/precios',
    titulo: 'Consulta de Precios',
    descripcion: 'Exploración rápida sin afectar la venta activa',
    icono: <Search />,
    bg: COLORS.blueSoft,
    color: COLORS.blueText,
  },
];

const AccesosRapidos = () => (
  <Box component="section">
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1.5 }}>
      <Typography component="h2" sx={{ fontWeight: 600, fontSize: { xs: '1.05rem', md: '1.2rem' }, color: COLORS.ink }}>
        Accesos Rápidos del Día
      </Typography>
      <Typography sx={{ display: { xs: 'none', sm: 'block' }, fontSize: '0.8rem', color: COLORS.muted }}>
        Modo Despacho & Gestión
      </Typography>
    </Box>

    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: { xs: 1.5, md: 2 } }}>
      {ACCESOS.map((acceso) => (
        <ButtonBase
          key={acceso.to}
          component={Link}
          to={acceso.to}
          sx={{
            display: 'flex',
            flexDirection: { xs: 'row', sm: 'column' },
            alignItems: { xs: 'center', sm: 'stretch' },
            justifyContent: 'space-between',
            gap: { xs: 1.5, sm: 3 },
            minHeight: { sm: 160, md: 175 },
            p: 2,
            textAlign: 'left',
            borderRadius: 3,
            backgroundColor: '#fff',
            border: `1px solid ${COLORS.border}`,
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
            transition: 'box-shadow 0.2s, border-color 0.2s',
            '&:hover': { borderColor: '#cfd8e3', boxShadow: '0 6px 16px rgba(15, 23, 42, 0.08)' },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <IconTile bg={acceso.bg} color={acceso.color} size={56}>
              {acceso.icono}
            </IconTile>
            {acceso.badge ? (
              <Chip
                size="small"
                label={acceso.badge}
                sx={{ display: { xs: 'none', sm: 'inline-flex' }, borderRadius: 1.5, backgroundColor: COLORS.inputBg, fontWeight: 600 }}
              />
            ) : (
              <ChevronRight sx={{ display: { xs: 'none', sm: 'block' }, color: COLORS.label }} />
            )}
          </Box>
          <Box sx={{ flex: { xs: 1, sm: 'none' }, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 600, fontSize: { xs: '1rem', md: '1.1rem' }, color: COLORS.ink }}>
              {acceso.titulo}
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: COLORS.label }}>{acceso.descripcion}</Typography>
          </Box>
          <ChevronRight sx={{ display: { xs: 'block', sm: 'none' }, color: COLORS.muted }} />
        </ButtonBase>
      ))}
    </Box>
  </Box>
);

export default AccesosRapidos;
