import { Box, Button, ButtonBase, Typography } from '@mui/material';
import { Add, Bolt } from '@mui/icons-material';
import { COLORS } from '../../theme';
import { formatMoney } from '../../utils/format';

const BADGE_COLORES = {
  Popular: { bg: COLORS.blueText, color: '#fff' },
  Premium: { bg: COLORS.blueText, color: '#fff' },
  Personalizable: { bg: COLORS.yellow, color: COLORS.onYellow },
  Nuevo: { bg: COLORS.greenText, color: '#fff' },
  Promo: { bg: COLORS.red, color: '#fff' },
};

const cardSx = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  textAlign: 'left',
  height: '100%',
  p: 1,
  borderRadius: 3,
  backgroundColor: COLORS.surface,
  border: `1px solid ${COLORS.border}`,
  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
  transition: 'transform 0.1s, box-shadow 0.2s',
  '&:hover': { boxShadow: '0 6px 16px rgba(15, 23, 42, 0.08)' },
  '&:active': { transform: 'scale(0.98)' },
};

// Cantidad del producto que ya está en la orden
const EnOrden = ({ cantidad }) =>
  cantidad > 0 ? (
    <Box
      sx={{
        position: 'absolute',
        top: 14,
        right: 14,
        minWidth: 30,
        height: 30,
        px: 1,
        borderRadius: 15,
        display: 'grid',
        placeItems: 'center',
        fontWeight: 800,
        fontSize: '0.85rem',
        color: '#fff',
        backgroundColor: COLORS.red,
        boxShadow: '0 2px 6px rgba(227, 36, 59, 0.4)',
      }}
    >
      ×{cantidad}
    </Box>
  ) : null;

const OfertaCard = ({ producto, enOrden, onAgregar }) => (
  <ButtonBase
    onClick={() => onAgregar(producto)}
    aria-label={`Agregar ${producto.nombre}`}
    sx={{
      ...cardSx,
      p: 2,
      backgroundColor: COLORS.yellow,
      border: 'none',
      boxShadow: '0 6px 16px rgba(251, 225, 0, 0.4)',
    }}
  >
    <EnOrden cantidad={enOrden} />
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1,
          py: 0.25,
          borderRadius: 2,
          fontSize: '0.72rem',
          fontWeight: 700,
          color: '#fff',
          backgroundColor: COLORS.red,
        }}
      >
        <Bolt sx={{ fontSize: 14 }} /> Oferta del Día
      </Box>
      {!enOrden && (
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: COLORS.onYellow, textDecoration: 'line-through' }}>
          {formatMoney(producto.precioAnterior)}
        </Typography>
      )}
    </Box>
    <Box sx={{ my: 'auto', py: 2 }}>
      <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.15rem', md: '1.3rem' }, lineHeight: 1.2, color: COLORS.onYellow }}>
        {producto.nombre}
      </Typography>
      <Typography sx={{ mt: 0.5, fontSize: '0.82rem', color: COLORS.onYellow }}>{producto.descripcion}</Typography>
    </Box>
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1,
        p: 1.25,
        borderRadius: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.35)',
      }}
    >
      <Box>
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: COLORS.redHover }}>
          AHORRAS {formatMoney(producto.precioAnterior - producto.precio)}
        </Typography>
        <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.2rem', md: '1.35rem' }, color: COLORS.red, lineHeight: 1.1 }}>
          {formatMoney(producto.precio)}
        </Typography>
      </Box>
      <Button
        component="span"
        variant="contained"
        disableElevation
        sx={{
          minHeight: 44,
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 700,
          backgroundColor: COLORS.red,
          pointerEvents: 'none',
        }}
      >
        Tomar
      </Button>
    </Box>
  </ButtonBase>
);

const ProductoCard = ({ producto, enOrden, onAgregar }) => {
  if (producto.oferta) return <OfertaCard producto={producto} enOrden={enOrden} onAgregar={onAgregar} />;

  const badge = producto.badge && BADGE_COLORES[producto.badge];

  return (
    <ButtonBase onClick={() => onAgregar(producto)} aria-label={`Agregar ${producto.nombre}`} sx={cardSx}>
      <Box
        sx={{
          position: 'relative',
          aspectRatio: '16 / 10',
          borderRadius: 2,
          display: 'grid',
          placeItems: 'center',
          background: producto.fondo,
          overflow: 'hidden',
        }}
      >
        {producto.imagen ? (
          <Box component="img" src={producto.imagen} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Box component="span" aria-hidden sx={{ fontSize: { xs: '2.6rem', md: '3.2rem' }, lineHeight: 1 }}>
            {producto.emoji}
          </Box>
        )}
        {badge && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              px: 1,
              py: 0.25,
              borderRadius: 2,
              fontSize: '0.7rem',
              fontWeight: 700,
              backgroundColor: badge.bg,
              color: badge.color,
            }}
          >
            {producto.badge}
          </Box>
        )}
      </Box>
      <EnOrden cantidad={enOrden} />

      <Box sx={{ px: 0.5, pt: 1.25, flex: 1 }}>
        <Typography sx={{ fontWeight: 600, fontSize: { xs: '0.95rem', md: '1rem' }, lineHeight: 1.25, color: COLORS.ink }}>
          {producto.nombre}
        </Typography>
        <Typography
          sx={{
            mt: 0.25,
            fontSize: '0.78rem',
            color: COLORS.muted,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {producto.descripcion}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, px: 0.5, pt: 1 }}>
        <Box>
          {producto.desde && !producto.precioAnterior && (
            <Typography sx={{ fontSize: '0.72rem', color: COLORS.muted, lineHeight: 1 }}>desde</Typography>
          )}
          {producto.precioAnterior && (
            <Typography sx={{ fontSize: '0.75rem', color: COLORS.muted, textDecoration: 'line-through', lineHeight: 1 }}>
              {formatMoney(producto.precioAnterior)}
            </Typography>
          )}
          <Typography sx={{ fontWeight: 700, fontSize: { xs: '1.1rem', md: '1.25rem' }, color: COLORS.blueText }}>
            {formatMoney(producto.precio)}
          </Typography>
        </Box>
        <Box
          aria-hidden
          sx={{
            width: 40,
            height: 40,
            flexShrink: 0,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            color: COLORS.blueText,
            backgroundColor: COLORS.inputBg,
          }}
        >
          <Add />
        </Box>
      </Box>
    </ButtonBase>
  );
};

export default ProductoCard;
