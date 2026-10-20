import { Box, Chip, Typography } from '@mui/material';
import { AccessTime, Icecream } from '@mui/icons-material';
import IconTile from '../../components/IconTile';
import Panel from '../../components/Panel';
import useClock from '../../hooks/useClock';
import { TERMINAL, TURNO } from '../../data/dummy';
import { COLORS } from '../../theme';
import { firstName, formatLongDate } from '../../utils/format';

const Bienvenida = ({ user }) => {
  const now = useClock();

  return (
    <Panel
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'stretch', md: 'center' },
        gap: 2,
        p: { xs: 2, md: 3 },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
        <IconTile bg={COLORS.yellow} color="#f59e0b" size={64} sx={{ borderRadius: 3, display: { xs: 'none', sm: 'grid' } }}>
          <Icecream sx={{ fontSize: 36 }} />
        </IconTile>
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', columnGap: 1.5, rowGap: 0.5 }}>
            <Typography component="h1" sx={{ fontWeight: 700, fontSize: { xs: '1.35rem', md: '1.7rem' }, color: COLORS.ink }}>
              ¡Hola de nuevo, {firstName(user.nombre)}!
            </Typography>
            <Chip
              size="small"
              icon={<Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: COLORS.red }} />}
              label="Apertura Requerida"
              sx={{ pl: 0.75, backgroundColor: COLORS.redSoft, color: COLORS.redHover, fontWeight: 600 }}
            />
          </Box>
          <Typography sx={{ mt: 0.5, fontSize: { xs: '0.8rem', md: '0.92rem' }, color: COLORS.label }}>
            Terminal {TERMINAL.numero} · {TERMINAL.sucursal} · {formatLongDate(now)}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: { xs: 'space-between', md: 'flex-end' },
          gap: 2,
          py: 1.5,
          px: 2,
          borderRadius: 3,
          backgroundColor: COLORS.inputBg,
        }}
      >
        <Box sx={{ textAlign: { md: 'right' } }}>
          <Typography sx={{ fontSize: '0.72rem', letterSpacing: 0.8, color: COLORS.muted, textTransform: 'uppercase' }}>
            Turno asignado
          </Typography>
          <Typography sx={{ fontWeight: 700, fontSize: { xs: '1.05rem', md: '1.2rem' }, color: COLORS.blueText }}>
            {TURNO.nombre} · {TURNO.inicio} – {TURNO.fin}
          </Typography>
        </Box>
        <IconTile bg={COLORS.blueSoft} color={COLORS.blueText}>
          <AccessTime />
        </IconTile>
      </Box>
    </Panel>
  );
};

export default Bienvenida;
