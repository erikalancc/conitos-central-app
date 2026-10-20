import { useMemo } from 'react';
import { Box, Button, IconButton, Typography } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import Panel from '../components/Panel';
import { claveDia, construirResumen, obtenerHistorial } from '../services/corteService';
import { COLORS } from '../theme';
import { formatLongDate, formatMoney } from '../utils/format';
import DesglosePagos from './corte/DesglosePagos';
import { estadoDiferencia } from './corte/estilos';
import ResumenTurno from './corte/ResumenTurno';
import VentasDelDia from './corte/VentasDelDia';
import CorteCuadre from './historial/CorteCuadre';

const GAP = { xs: 2, md: 3 };

const chipDiferencia = (titulo, diferencia) => {
  const estado = estadoDiferencia(diferencia);
  const cuadrada = Math.abs(diferencia) < 0.005;
  return {
    label: cuadrada ? `${titulo} cuadrado` : `${titulo} ${estado.label.toLowerCase()} ${formatMoney(Math.abs(diferencia))}`,
    bg: estado.bg,
    color: estado.color,
  };
};

// Detalle de un día cerrado: mismas vistas del corte, en solo lectura
const HistorialDia = () => {
  const { fecha } = useParams();
  const navigate = useNavigate();
  // Del primer turno al último
  const cortes = useMemo(() => obtenerHistorial().filter((c) => claveDia(c.fecha) === fecha).reverse(), [fecha]);

  const resumen = useMemo(
    () =>
      cortes.length
        ? construirResumen({
            ventas: cortes.flatMap((c) => c.resumen.ventas),
            movimientos: cortes.flatMap((c) => c.resumen.movimientos),
            fondo: cortes[0].efectivo.fondo,
            desde: cortes[0].desde,
          })
        : null,
    [cortes]
  );

  const volver = (
    <IconButton aria-label="Volver al historial" onClick={() => navigate('/historial')} sx={{ alignSelf: { xs: 'flex-start', sm: 'center' }, backgroundColor: COLORS.inputBg }}>
      <ArrowBack />
    </IconButton>
  );

  if (!resumen) {
    return (
      <Panel sx={{ py: 6, textAlign: 'center' }}>
        <Typography sx={{ fontWeight: 700, color: COLORS.ink }}>No hay cortes registrados para este día</Typography>
        <Button onClick={() => navigate('/historial')} startIcon={<ArrowBack />} sx={{ mt: 2, textTransform: 'none', fontWeight: 600 }}>
          Volver al historial
        </Button>
      </Panel>
    );
  }

  const cajeros = [...new Set(cortes.map((c) => c.usuarioNombre).filter(Boolean))];
  const difEfectivo = cortes.reduce((suma, c) => suma + c.efectivo.diferencia, 0);
  const difTarjeta = cortes.reduce((suma, c) => suma + c.tarjeta.diferencia, 0);

  return (
    <Box sx={{ display: 'grid', gap: GAP }}>
      <ResumenTurno
        resumen={resumen}
        inicio={volver}
        etiqueta="HISTORIAL · DETALLE DEL DÍA"
        titulo={formatLongDate(new Date(`${fecha}T12:00:00`))}
        subtitulo={`${cortes.length} corte${cortes.length === 1 ? '' : 's'} · ${cajeros.join(', ') || 'Cajero no registrado'}`}
        etiquetaNeto="VENTAS NETAS DEL DÍA"
        chips={[chipDiferencia('Efectivo', difEfectivo), chipDiferencia('Tarjeta', difTarjeta)]}
      />

      <Box
        sx={{
          display: 'grid',
          gap: GAP,
          alignItems: 'start',
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) 420px', xl: 'minmax(0, 1fr) 480px' },
        }}
      >
        {/* Se estira al alto de la fila para que las ventas puedan acompañar el scroll */}
        <Box sx={{ display: 'grid', gap: GAP, minWidth: 0, alignSelf: 'stretch', alignContent: 'start' }}>
          <DesglosePagos resumen={resumen} />
          <VentasDelDia resumen={resumen} sx={{ position: { lg: 'sticky' }, top: { lg: 16 }, zIndex: 1 }} />
        </Box>

        <Box component="aside" sx={{ display: 'grid', gap: GAP, minWidth: 0 }}>
          {cortes.map((corte) => (
            <CorteCuadre key={corte.id} corte={corte} />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default HistorialDia;
