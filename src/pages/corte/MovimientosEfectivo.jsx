import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { AddCircleOutlined, CalculateOutlined, LockOutlined, PaymentsOutlined, SouthWest, NorthEast } from '@mui/icons-material';
import IconTile from '../../components/IconTile';
import Panel from '../../components/Panel';
import { COLORS } from '../../theme';
import { formatMoney } from '../../utils/format';
import { botonSuaveSx, subtituloSx, tituloSeccionSx } from './estilos';
import MontoInput from './MontoInput';

const hora = (iso) => new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });

const Movimiento = ({ icono, iconoBg, iconoColor, titulo, detalle, monto, montoColor = COLORS.ink }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 3, backgroundColor: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}` }}>
    <IconTile bg={iconoBg} color={iconoColor} size={40}>
      {icono}
    </IconTile>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography sx={{ fontWeight: 600, fontSize: '0.92rem', color: COLORS.ink }}>{titulo}</Typography>
      <Typography sx={{ fontSize: '0.78rem', color: COLORS.muted }}>{detalle}</Typography>
    </Box>
    <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', whiteSpace: 'nowrap', color: montoColor, fontVariantNumeric: 'tabular-nums' }}>
      {monto}
    </Typography>
  </Box>
);

const MovimientoDialog = ({ open, onClose, onGuardar }) => {
  const [tipo, setTipo] = useState('retiro');
  const [monto, setMonto] = useState(0);
  const [concepto, setConcepto] = useState('');
  const [guardando, setGuardando] = useState(false);
  const valido = monto > 0 && concepto.trim();

  const handleGuardar = async () => {
    setGuardando(true);
    const registrado = await onGuardar({ tipo, monto, concepto: concepto.trim() });
    setGuardando(false);
    if (registrado === false) return;
    setMonto(0);
    setConcepto('');
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>Movimiento de efectivo</DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 2 }}>
        <ToggleButtonGroup
          exclusive
          fullWidth
          value={tipo}
          onChange={(_, valor) => valor && setTipo(valor)}
          sx={{
            p: 0.5,
            borderRadius: 2,
            backgroundColor: COLORS.inputBg,
            '& .MuiToggleButton-root': { border: 'none', borderRadius: '8px !important', minHeight: 44, textTransform: 'none', fontWeight: 600 },
            '& .Mui-selected': { backgroundColor: `${COLORS.surface} !important`, color: `${COLORS.blueText} !important`, boxShadow: '0 1px 3px rgba(15, 23, 42, 0.1)' },
          }}
        >
          <ToggleButton value="retiro">Retiro (sale dinero)</ToggleButton>
          <ToggleButton value="entrada">Entrada (entra dinero)</ToggleButton>
        </ToggleButtonGroup>
        <MontoInput autoFocus value={monto} onChange={setMonto} sx={{ backgroundColor: COLORS.inputBg, borderColor: 'transparent' }} />
        <TextField
          fullWidth
          label="Concepto"
          placeholder={tipo === 'retiro' ? 'Ej. Compra de hielo y servilletas' : 'Ej. Cambio adicional de supervisor'}
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          Cancelar
        </Button>
        <Button variant="contained" disableElevation disabled={!valido || guardando} onClick={handleGuardar} sx={{ minHeight: 44, textTransform: 'none', fontWeight: 700 }}>
          {guardando ? 'Guardando…' : 'Registrar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const MovimientosEfectivo = ({ resumen, onRegistrar }) => {
  const [dialogo, setDialogo] = useState(false);

  const handleGuardar = async (movimiento) => {
    const registrado = await onRegistrar(movimiento);
    if (registrado !== false) setDialogo(false);
    return registrado;
  };

  return (
    <Panel sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5, mb: 2 }}>
        <Box>
          <Typography component="h2" sx={tituloSeccionSx}>
            Movimientos de efectivo en gaveta
          </Typography>
          <Typography sx={subtituloSx}>Solo efectivo: las ventas con tarjeta no entran a la gaveta</Typography>
        </Box>
        <Button startIcon={<AddCircleOutlined />} onClick={() => setDialogo(true)} sx={{ ...botonSuaveSx, flexShrink: 0 }}>
          Entrada / Retiro
        </Button>
      </Box>

      <Box sx={{ display: 'grid', gap: 1 }}>
        <Movimiento
          icono={<LockOutlined />}
          iconoBg={COLORS.blueSoft}
          iconoColor={COLORS.blueText}
          titulo="Fondo inicial de apertura"
          detalle={resumen.apertura ? `Apertura a las ${hora(resumen.apertura.fecha)} hrs${resumen.apertura.usuario ? ` por ${resumen.apertura.usuario}` : ''}` : 'Sin apertura registrada en este turno'}
          monto={formatMoney(resumen.fondo)}
        />
        <Movimiento
          icono={<PaymentsOutlined />}
          iconoBg="#dcfce7"
          iconoColor="#15803d"
          titulo="Ventas en efectivo"
          detalle={`${resumen.porMetodo.find((m) => m.id === 'efectivo')?.transacciones ?? 0} ventas cobradas en efectivo`}
          monto={`+${formatMoney(resumen.efectivo)}`}
          montoColor="#15803d"
        />
        {resumen.movimientos.map((m) => (
          <Movimiento
            key={m.id}
            icono={m.tipo === 'retiro' ? <NorthEast /> : <SouthWest />}
            iconoBg={m.tipo === 'retiro' ? COLORS.redSoft : COLORS.greenSoft}
            iconoColor={m.tipo === 'retiro' ? COLORS.red : COLORS.greenText}
            titulo={`${m.tipo === 'retiro' ? 'Retiro' : 'Entrada'}: ${m.concepto}`}
            detalle={`${hora(m.fecha)} hrs`}
            monto={`${m.tipo === 'retiro' ? '-' : '+'}${formatMoney(m.monto)}`}
            montoColor={m.tipo === 'retiro' ? COLORS.red : COLORS.greenText}
          />
        ))}
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          mt: 2,
          p: { xs: 1.5, md: 2 },
          borderRadius: 3,
          backgroundColor: COLORS.blueSoft,
        }}
      >
        <CalculateOutlined sx={{ color: COLORS.blueText, display: { xs: 'none', sm: 'block' } }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, color: COLORS.ink }}>Efectivo esperado en gaveta</Typography>
          <Typography sx={{ fontSize: '0.75rem', color: COLORS.label }}>
            {formatMoney(resumen.fondo)} fondo + {formatMoney(resumen.efectivo)} ventas
            {resumen.entradas > 0 && ` + ${formatMoney(resumen.entradas)} entradas`}
            {resumen.retiros > 0 && ` − ${formatMoney(resumen.retiros)} retiros`}
          </Typography>
        </Box>
        <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.3rem', md: '1.6rem' }, color: COLORS.blueText, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
          {formatMoney(resumen.efectivoEsperado)}
        </Typography>
      </Box>

      <MovimientoDialog open={dialogo} onClose={() => setDialogo(false)} onGuardar={handleGuardar} />
    </Panel>
  );
};

export default MovimientosEfectivo;
