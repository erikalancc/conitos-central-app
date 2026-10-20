import { useState } from 'react';
import { Box, Button, Chip, InputBase, Snackbar, TextField, Typography } from '@mui/material';
import { ArrowForward, Icecream, InboxOutlined, PaymentsOutlined, PointOfSale } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import IconTile from '../../components/IconTile';
import Panel from '../../components/Panel';
import { FONDO_SUGERIDO } from '../../data/dummy';
import { COLORS } from '../../theme';
import { formatNumber } from '../../utils/format';

const AJUSTES = [100, 200, 500];

const softButtonSx = {
  minHeight: 48,
  px: 2,
  borderRadius: 2,
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '0.95rem',
  backgroundColor: '#fff',
  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)',
  '&:hover': { backgroundColor: '#f8fafc' },
};

const AperturaCaja = () => {
  const navigate = useNavigate();
  const [monto, setMonto] = useState(FONDO_SUGERIDO);
  // Texto sin formato mientras el usuario edita el monto
  const [montoTexto, setMontoTexto] = useState(null);
  const [comentario, setComentario] = useState('');
  const [aviso, setAviso] = useState('');

  const handleMontoChange = (e) => {
    const limpio = e.target.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
    setMontoTexto(limpio);
  };

  const handleMontoBlur = () => {
    setMonto(Math.round((Number(montoTexto) || 0) * 100) / 100);
    setMontoTexto(null);
  };

  const handleAbrirCaja = () => {
    // Simulación: cuando exista el API se enviará la apertura al backend
    localStorage.setItem(
      'aperturaCaja',
      JSON.stringify({ monto, comentario: comentario.trim(), fecha: new Date().toISOString() })
    );
    navigate('/pos');
  };

  return (
    <Panel
      sx={{
        p: { xs: 2, md: 3 },
        backgroundImage: 'radial-gradient(circle at 100% 0%, rgba(253, 230, 80, 0.35), transparent 35%)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2.5 }}>
        <IconTile bg={COLORS.blueSoft} color={COLORS.blueText} size={44}>
          <PaymentsOutlined />
        </IconTile>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography component="h2" sx={{ fontWeight: 700, fontSize: { xs: '1.1rem', md: '1.3rem' }, color: COLORS.ink }}>
            Apertura de Caja & Fondo Inicial
          </Typography>
          <Typography sx={{ fontSize: '0.82rem', color: COLORS.label }}>
            Confirma el efectivo en gaveta física antes de despachar
          </Typography>
        </Box>
        <Chip
          size="small"
          label="Paso Obligatorio"
          sx={{
            display: { xs: 'none', sm: 'inline-flex' },
            borderRadius: 1.5,
            backgroundColor: COLORS.yellowSoft,
            color: '#5c4a00',
            fontWeight: 600,
          }}
        />
      </Box>

      {/* Fondo en gaveta */}
      <Box sx={{ p: { xs: 1.5, md: 2 }, borderRadius: 3, backgroundColor: COLORS.inputBg }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1, mb: 1.5 }}>
          <Typography component="label" htmlFor="monto-gaveta" sx={{ fontWeight: 700, color: COLORS.ink }}>
            Efectivo Base en Gaveta
          </Typography>
          <Typography sx={{ display: { xs: 'none', sm: 'block' }, fontSize: '0.78rem', color: COLORS.muted }}>
            Sugerido para cambio de arranque
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: { xs: 2, md: 2.5 },
            py: { xs: 1, md: 1.5 },
            borderRadius: 2.5,
            backgroundColor: '#fff',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06)',
            '&:focus-within': { boxShadow: `0 0 0 2px ${COLORS.blue}` },
          }}
        >
          <Typography sx={{ fontSize: { xs: '1.6rem', md: '2.2rem' }, fontWeight: 600, color: COLORS.muted }}>$</Typography>
          <InputBase
            id="monto-gaveta"
            value={montoTexto ?? formatNumber(monto)}
            onFocus={() => setMontoTexto(monto ? String(monto) : '')}
            onChange={handleMontoChange}
            onBlur={handleMontoBlur}
            slotProps={{ input: { inputMode: 'decimal' } }}
            sx={{
              flex: 1,
              fontSize: { xs: '2rem', md: '2.6rem' },
              fontWeight: 700,
              color: COLORS.ink,
              fontVariantNumeric: 'tabular-nums',
            }}
          />
          <Typography sx={{ fontWeight: 700, color: COLORS.label }}>MXN</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
          <Typography sx={{ fontSize: '0.85rem', color: COLORS.label, width: { xs: '100%', sm: 'auto' }, mr: 0.5 }}>
            Ajuste rápido:
          </Typography>
          {AJUSTES.map((valor) => (
            <Button
              key={valor}
              onClick={() => setMonto((m) => m + valor)}
              sx={{ ...softButtonSx, flex: { xs: 1, sm: 'none' }, color: COLORS.blueText }}
            >
              + ${valor}
            </Button>
          ))}
          <Button
            onClick={() => setMonto(FONDO_SUGERIDO)}
            sx={{
              ...softButtonSx,
              ml: { sm: 'auto' },
              width: { xs: '100%', sm: 'auto' },
              color: COLORS.label,
              backgroundColor: 'transparent',
              boxShadow: 'none',
              '&:hover': { backgroundColor: '#e2e7ee' },
            }}
          >
            Reiniciar
          </Button>
        </Box>
      </Box>

      <Typography component="label" htmlFor="comentario-apertura" sx={{ display: 'block', mt: 2.5, mb: 0.75, fontSize: '0.82rem', color: COLORS.ink }}>
        Comentarios u observaciones de arranque (Opcional)
      </Typography>
      <TextField
        id="comentario-apertura"
        fullWidth
        multiline
        maxRows={3}
        placeholder="Ej: Fondo verificado con monedas de $10 y billetes de $50 y $100..."
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: COLORS.inputBg,
            borderRadius: 2,
            fontSize: '1rem',
            '& fieldset': { borderColor: 'transparent' },
            '&.Mui-focused fieldset': { borderColor: COLORS.blue },
          },
        }}
      />

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, mt: 2.5 }}>
        <Button
          fullWidth
          variant="contained"
          disableElevation
          onClick={handleAbrirCaja}
          startIcon={<PointOfSale />}
          endIcon={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Icecream sx={{ color: COLORS.yellow, display: { xs: 'none', md: 'block' } }} />
              <ArrowForward />
            </Box>
          }
          sx={{
            flex: 1,
            minHeight: { xs: 60, md: 68 },
            px: 3,
            borderRadius: 3,
            fontWeight: 800,
            fontSize: { xs: '0.95rem', md: '1.05rem' },
            backgroundColor: COLORS.red,
            boxShadow: '0 6px 16px rgba(227, 36, 59, 0.3)',
            '& .MuiButton-endIcon': { ml: 'auto' },
            '& .MuiButton-startIcon svg': { fontSize: 26 },
            '&:hover': { backgroundColor: COLORS.redHover },
          }}
        >
          Abrir caja e ir a ventas
        </Button>
        <Button
          onClick={() => setAviso('Señal de apertura enviada a la gaveta (simulación)')}
          startIcon={<InboxOutlined />}
          sx={{
            minHeight: { xs: 52, md: 68 },
            px: 2.5,
            flexShrink: 0,
            borderRadius: 3,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.95rem',
            color: COLORS.ink,
            backgroundColor: COLORS.inputBg,
            '&:hover': { backgroundColor: '#e2e7ee' },
          }}
        >
          Test Gaveta
        </Button>
      </Box>

      <Snackbar
        open={Boolean(aviso)}
        autoHideDuration={2500}
        onClose={() => setAviso('')}
        message={aviso}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Panel>
  );
};

export default AperturaCaja;
