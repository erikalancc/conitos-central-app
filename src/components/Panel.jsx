import { Paper } from '@mui/material';
import { COLORS } from '../theme';

// Tarjeta blanca base usada en las vistas del sistema
const Panel = ({ sx, children, ...props }) => (
  <Paper
    elevation={0}
    sx={[
      {
        p: { xs: 2, md: 2.5 },
        borderRadius: 3,
        border: `1px solid ${COLORS.border}`,
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
      },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
    {...props}
  >
    {children}
  </Paper>
);

export default Panel;
