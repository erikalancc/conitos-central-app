import { Box } from '@mui/material';

// Cuadro redondeado con ícono centrado
const IconTile = ({ children, bg, color, size = 48, sx }) => (
  <Box
    sx={[
      {
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: 2.5,
        display: 'grid',
        placeItems: 'center',
        backgroundColor: bg,
        color,
      },
      sx,
    ]}
  >
    {children}
  </Box>
);

export default IconTile;
