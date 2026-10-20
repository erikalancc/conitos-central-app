import { useState } from 'react';
import { Box, Button, Dialog, Divider, Snackbar, TextField, Typography } from '@mui/material';
import { CheckCircle, LockOutlined, PrintOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getSession } from '../auth/session';
import Panel from '../components/Panel';
import { TERMINAL } from '../data/dummy';
import { calcularResumen, registrarCorte, registrarMovimiento } from '../services/corteService';
import { COLORS } from '../theme';
import { formatMoney } from '../utils/format';
import ConciliacionTarjeta from './corte/ConciliacionTarjeta';
import ConteoEfectivo from './corte/ConteoEfectivo';
import DesglosePagos from './corte/DesglosePagos';
import { COLOR_METODO, estadoDiferencia, totalContado } from './corte/estilos';
import MovimientosEfectivo from './corte/MovimientosEfectivo';
import ResumenTurno from './corte/ResumenTurno';
import { descargarTicketCorte } from './corte/ticketCorte';
import VentasDelDia from './corte/VentasDelDia';

const GAP = { xs: 2, md: 3 };

const redondear = (valor) => Math.round(valor * 100) / 100;

const Renglon = ({ label, value, color, fuerte }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4, fontSize: fuerte ? '1rem' : '0.9rem', fontWeight: fuerte ? 800 : 500, color }}>
    <span>{label}</span>
    <Box component="span" sx={{ fontVariantNumeric: 'tabular-nums' }}>
      {value}
    </Box>
  </Box>
);

// Bloque del cuadre de una forma de pago dentro de la confirmación
const BloqueCuadre = ({ titulo, color, esperadoLabel, esperado, realLabel, real, diferencia }) => {
  const estado = estadoDiferencia(diferencia);
  return (
    <Box sx={{ p: 1.5, borderRadius: 3, border: `1px solid ${COLORS.border}`, borderLeft: `4px solid ${color}` }}>
      <Typography sx={{ mb: 0.5, fontWeight: 700, color: COLORS.ink }}>{titulo}</Typography>
      <Renglon label={esperadoLabel} value={formatMoney(esperado)} color={COLORS.label} />
      <Renglon label={realLabel} value={formatMoney(real)} color={COLORS.label} />
      <Renglon label={estado.label} value={`${diferencia > 0 ? '+' : ''}${formatMoney(diferencia)}`} color={estado.color} fuerte />
    </Box>
  );
};

const CorteCaja = () => {
  const user = getSession();
  const navigate = useNavigate();
  const [resumen, setResumen] = useState(calcularResumen);
  const [conteo, setConteo] = useState({});
  const [terminal, setTerminal] = useState({ monto: 0, vouchers: 0 });
  const [observaciones, setObservaciones] = useState('');
  const [confirmar, setConfirmar] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [corte, setCorte] = useState(null);
  const [aviso, setAviso] = useState('');

  const transaccionesTarjeta = resumen.porMetodo.find((m) => m.id === 'tarjeta')?.transacciones ?? 0;
  const contado = totalContado(conteo);
  const difEfectivo = redondear(contado - resumen.efectivoEsperado);
  const difTarjeta = redondear(terminal.monto - resumen.tarjeta);
  const tarjetaCapturada = terminal.monto > 0 || resumen.tarjeta === 0;
  const efectivoContado = contado > 0 || resumen.efectivoEsperado === 0;
  const hayDiferencias = Math.abs(difEfectivo) >= 0.01 || Math.abs(difTarjeta) >= 0.01;
  const faltaJustificar = hayDiferencias && !observaciones.trim();
  const puedeCerrar = efectivoContado && tarjetaCapturada && !faltaJustificar;

  const pendiente = !efectivoContado
    ? 'Realiza el conteo físico del efectivo'
    : !tarjetaCapturada
      ? 'Captura el cierre de lote de la terminal bancaria'
      : faltaJustificar
        ? 'Hay diferencias: explica el motivo en observaciones'
        : null;

  const datosTicket = { resumen, conteo, terminal, observaciones, user };

  const handlePrecorte = () => {
    descargarTicketCorte({ tipo: 'X', ...datosTicket });
    setAviso('Pre-corte X guardado en PDF');
  };

  const handleMovimiento = async (movimiento) => {
    await registrarMovimiento({ ...movimiento, usuarioId: user?.id });
    setResumen(calcularResumen());
    setAviso(movimiento.tipo === 'retiro' ? 'Retiro registrado' : 'Entrada registrada');
  };

  const handleCerrar = async () => {
    setCerrando(true);
    try {
      const registro = await registrarCorte({
        usuarioId: user?.id,
        usuarioNombre: user?.nombre,
        terminal: TERMINAL.numero,
        desde: resumen.desde,
        tickets: resumen.tickets,
        bruto: resumen.bruto,
        descuentos: resumen.descuentos,
        neto: resumen.neto,
        porMetodo: resumen.porMetodo.map(({ id, total, transacciones }) => ({ id, total, transacciones })),
        efectivo: { fondo: resumen.fondo, entradas: resumen.entradas, retiros: resumen.retiros, esperado: resumen.efectivoEsperado, contado, diferencia: difEfectivo, conteo },
        tarjeta: { sistema: resumen.tarjeta, terminal: terminal.monto, vouchers: terminal.vouchers, diferencia: difTarjeta },
        observaciones: observaciones.trim(),
      });
      setConfirmar(false);
      const ticket = { tipo: 'Z', folio: registro.id, fecha: new Date(registro.fecha), ...datosTicket };
      descargarTicketCorte(ticket);
      setCorte({ ...registro, ticket });
    } catch {
      setAviso('No se pudo registrar el corte. Intenta de nuevo.');
    } finally {
      setCerrando(false);
    }
  };

  return (
    <Box sx={{ display: 'grid', gap: GAP }}>
      <ResumenTurno resumen={resumen} user={user} />

      <Box
        sx={{
          display: 'grid',
          gap: GAP,
          alignItems: 'start',
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) 420px', xl: 'minmax(0, 1fr) 480px' },
        }}
      >
        {/* Columna principal */}
        {/* Se estira al alto de la fila para que las ventas puedan acompañar el scroll */}
        <Box sx={{ display: 'grid', gap: GAP, minWidth: 0, alignSelf: 'stretch', alignContent: 'start' }}>
          <DesglosePagos resumen={resumen} />
          <MovimientosEfectivo resumen={resumen} onRegistrar={handleMovimiento} />
          <VentasDelDia resumen={resumen} sx={{ position: { lg: 'sticky' }, top: { lg: 16 }, zIndex: 1 }} />
        </Box>

        {/* Cuadre y cierre */}
        <Box component="aside" sx={{ display: 'grid', gap: GAP, minWidth: 0 }}>
          <ConteoEfectivo conteo={conteo} onConteo={setConteo} esperado={resumen.efectivoEsperado} />
          <ConciliacionTarjeta sistema={resumen.tarjeta} transacciones={transaccionesTarjeta} terminal={terminal} onTerminal={setTerminal} />

          <Panel sx={{ p: { xs: 2, md: 2.5 } }}>
            <Typography component="label" htmlFor="observaciones-corte" sx={{ display: 'block', mb: 0.75, fontSize: '0.85rem', color: COLORS.ink }}>
              Observaciones del cajero / supervisor {hayDiferencias ? '(obligatorio por diferencias)' : '(opcional)'}
            </Typography>
            <TextField
              id="observaciones-corte"
              fullWidth
              multiline
              minRows={2}
              maxRows={4}
              placeholder="Ej. Entregado sin novedad a supervisora, gaveta limpia y rollos de ticket repuestos…"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              error={faltaJustificar}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: COLORS.inputBg,
                  borderRadius: 2,
                  '& fieldset': { borderColor: 'transparent' },
                  '&.Mui-focused fieldset': { borderColor: COLORS.blue },
                },
              }}
            />

            <Button
              fullWidth
              startIcon={<PrintOutlined />}
              onClick={handlePrecorte}
              sx={{
                mt: 2,
                minHeight: 52,
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.95rem',
                color: COLORS.ink,
                backgroundColor: COLORS.inputBg,
                '&:hover': { backgroundColor: '#e2e7ee' },
              }}
            >
              Imprimir pre-corte X (lectura parcial)
            </Button>
            <Button
              fullWidth
              variant="contained"
              disableElevation
              disabled={!puedeCerrar}
              startIcon={<LockOutlined />}
              onClick={() => setConfirmar(true)}
              sx={{
                mt: 1.25,
                minHeight: 60,
                borderRadius: 3,
                fontWeight: 800,
                fontSize: '1rem',
                textTransform: 'none',
                backgroundColor: COLORS.red,
                boxShadow: '0 6px 16px rgba(227, 36, 59, 0.3)',
                '&:hover': { backgroundColor: COLORS.redHover },
                '&.Mui-disabled': { backgroundColor: '#f3a3ad', color: '#fff', boxShadow: 'none' },
              }}
            >
              Cerrar turno e imprimir corte Z
            </Button>
            {pendiente && (
              <Typography sx={{ mt: 1, textAlign: 'center', fontSize: '0.8rem', color: COLORS.muted }}>{pendiente}</Typography>
            )}
          </Panel>
        </Box>
      </Box>

      {/* CONFIRMACIÓN DE CIERRE */}
      <Dialog open={confirmar} onClose={() => !cerrando && setConfirmar(false)} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <Box sx={{ p: 3, display: 'grid', gap: 1.5 }}>
          <Box>
            <Typography component="h2" sx={{ fontWeight: 800, fontSize: '1.3rem', color: COLORS.ink }}>
              ¿Cerrar el turno?
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', color: COLORS.muted }}>
              Se registrará el corte Z y ya no podrás modificar el conteo.
            </Typography>
          </Box>
          <BloqueCuadre
            titulo="Efectivo"
            color={COLOR_METODO.efectivo.barra}
            esperadoLabel="Esperado en gaveta"
            esperado={resumen.efectivoEsperado}
            realLabel="Contado"
            real={contado}
            diferencia={difEfectivo}
          />
          <BloqueCuadre
            titulo="Tarjeta"
            color={COLOR_METODO.tarjeta.barra}
            esperadoLabel="Cobrado en sistema"
            esperado={resumen.tarjeta}
            realLabel="Cierre de terminal"
            real={terminal.monto}
            diferencia={difTarjeta}
          />
          <Divider />
          <Renglon label="Ventas netas del turno" value={formatMoney(resumen.neto)} color={COLORS.ink} fuerte />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 0.5 }}>
            <Button
              disabled={cerrando}
              onClick={() => setConfirmar(false)}
              sx={{ minHeight: 52, borderRadius: 2.5, textTransform: 'none', fontWeight: 600, color: COLORS.label, backgroundColor: COLORS.inputBg }}
            >
              Revisar
            </Button>
            <Button
              variant="contained"
              disableElevation
              disabled={cerrando}
              onClick={handleCerrar}
              sx={{ minHeight: 52, borderRadius: 2.5, textTransform: 'none', fontWeight: 700, backgroundColor: COLORS.red, '&:hover': { backgroundColor: COLORS.redHover } }}
            >
              {cerrando ? 'Cerrando…' : 'Cerrar turno'}
            </Button>
          </Box>
        </Box>
      </Dialog>

      {/* CORTE REGISTRADO */}
      <Dialog open={Boolean(corte)} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        {corte && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 56, color: '#16a34a' }} />
            <Typography component="h2" sx={{ mt: 0.5, fontWeight: 800, fontSize: '1.4rem', color: COLORS.ink }}>
              Turno cerrado
            </Typography>
            <Typography sx={{ color: COLORS.muted }}>Corte Z #{corte.id} registrado</Typography>
            <Box sx={{ mt: 2, textAlign: 'left' }}>
              <Renglon label="Efectivo entregado" value={formatMoney(corte.efectivo.contado)} color={COLOR_METODO.efectivo.fuerte} />
              <Renglon label="Tarjeta (terminal)" value={formatMoney(corte.tarjeta.terminal)} color={COLOR_METODO.tarjeta.fuerte} />
              <Divider sx={{ my: 0.5 }} />
              <Renglon label="Ventas netas" value={formatMoney(corte.neto)} color={COLORS.ink} fuerte />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 2.5 }}>
              <Button
                startIcon={<PrintOutlined />}
                onClick={() => descargarTicketCorte(corte.ticket)}
                sx={{ minHeight: 52, borderRadius: 2.5, textTransform: 'none', fontWeight: 600, color: COLORS.label, backgroundColor: COLORS.inputBg }}
              >
                Reimprimir
              </Button>
              <Button
                autoFocus
                variant="contained"
                disableElevation
                onClick={() => navigate('/inicio')}
                sx={{ minHeight: 52, borderRadius: 2.5, textTransform: 'none', fontWeight: 700 }}
              >
                Ir a inicio
              </Button>
            </Box>
          </Box>
        )}
      </Dialog>

      <Snackbar
        open={Boolean(aviso)}
        autoHideDuration={2500}
        onClose={() => setAviso('')}
        message={aviso}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default CorteCaja;
