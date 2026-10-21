import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Dialog, Divider, Snackbar, TextField, Typography } from '@mui/material';
import { CheckCircle, LockOutlined, PointOfSale, PrintOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { mensajeDeError } from '../api/axiosClient';
import { getSession } from '../auth/session';
import IconTile from '../components/IconTile';
import Panel from '../components/Panel';
import { FONDO_SUGERIDO } from '../data/dummy';
import { abrirCaja, cerrarCaja, corteDesdeApi, obtenerTurno, registrarMovimiento, resumenDesdeTurno } from '../services/corteService';
import { COLORS } from '../theme';
import { formatMoney } from '../utils/format';
import ConciliacionTarjeta from './corte/ConciliacionTarjeta';
import ConteoEfectivo from './corte/ConteoEfectivo';
import DesglosePagos from './corte/DesglosePagos';
import { COLOR_METODO, estadoDiferencia, totalContado } from './corte/estilos';
import MontoInput from './corte/MontoInput';
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

// Caja sin turno abierto: se puede abrir aquí mismo con el fondo inicial
const CajaCerrada = ({ onAbierta }) => {
  const [fondo, setFondo] = useState(FONDO_SUGERIDO);
  const [abriendo, setAbriendo] = useState(false);
  const [error, setError] = useState('');

  const abrir = async () => {
    setAbriendo(true);
    setError('');
    try {
      onAbierta(await abrirCaja({ fondo, comentario: '' }));
    } catch (e) {
      // 409: ya la abrió alguien más; se carga ese turno
      if (e.response?.status === 409) {
        const turno = await obtenerTurno().catch(() => null);
        if (turno) return onAbierta(turno);
      }
      setError(mensajeDeError(e, 'No se pudo abrir la caja.'));
    } finally {
      setAbriendo(false);
    }
  };

  return (
    <Panel sx={{ p: { xs: 2.5, md: 4 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconTile bg={COLORS.blueSoft} color={COLORS.blueText} size={56}>
          <LockOutlined />
        </IconTile>
        <Box sx={{ flex: 1 }}>
          <Typography component="h1" sx={{ fontWeight: 800, fontSize: '1.3rem', color: COLORS.ink }}>
            La caja está cerrada
          </Typography>
          <Typography sx={{ color: COLORS.label }}>
            Abre caja con el fondo inicial para empezar el turno. Las ventas de hoy que se cobraron sin caja abierta se suman al turno al abrirlo.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'flex-end' }, gap: 1.5, mt: 3 }}>
        <Box sx={{ flex: 1, maxWidth: { sm: 320 } }}>
          <Typography component="label" htmlFor="fondo-apertura" sx={{ display: 'block', mb: 0.5, fontSize: '0.82rem', fontWeight: 600, color: COLORS.ink }}>
            Fondo inicial en gaveta
          </Typography>
          <MontoInput id="fondo-apertura" value={fondo} onChange={setFondo} />
        </Box>
        <Button
          variant="contained"
          disableElevation
          startIcon={<PointOfSale />}
          disabled={abriendo}
          onClick={abrir}
          sx={{ minHeight: 52, px: 3, borderRadius: 3, textTransform: 'none', fontWeight: 800, backgroundColor: COLORS.red, '&:hover': { backgroundColor: COLORS.redHover } }}
        >
          {abriendo ? 'Abriendo caja…' : 'Abrir caja'}
        </Button>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Panel>
  );
};

const CorteCaja = () => {
  const user = getSession();
  const navigate = useNavigate();
  const [turno, setTurno] = useState(undefined); // undefined = cargando, null = caja cerrada
  const [errorCarga, setErrorCarga] = useState('');
  const [conteo, setConteo] = useState({});
  const [terminal, setTerminal] = useState({ monto: 0, vouchers: 0 });
  const [observaciones, setObservaciones] = useState('');
  const [confirmar, setConfirmar] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [corte, setCorte] = useState(null);
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    let vigente = true;
    obtenerTurno()
      .then((t) => vigente && setTurno(t))
      .catch((e) => vigente && setErrorCarga(mensajeDeError(e, 'No se pudo consultar la caja.')));
    return () => {
      vigente = false;
    };
  }, []);

  const resumen = useMemo(() => (turno ? resumenDesdeTurno(turno) : null), [turno]);

  if (errorCarga) {
    return (
      <Panel sx={{ py: 6, textAlign: 'center' }}>
        <Alert severity="error" sx={{ maxWidth: 480, mx: 'auto', textAlign: 'left' }}>
          {errorCarga}
        </Alert>
        <Button onClick={() => window.location.reload()} sx={{ mt: 2, textTransform: 'none', fontWeight: 600 }}>
          Reintentar
        </Button>
      </Panel>
    );
  }

  if (turno === undefined) {
    return (
      <Panel sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Panel>
    );
  }

  // Sin turno abierto (y sin un corte recién hecho que mostrar)
  if (!resumen && !corte) return <CajaCerrada onAbierta={setTurno} />;

  const transaccionesTarjeta = resumen?.porMetodo.find((m) => m.id === 'tarjeta')?.transacciones ?? 0;
  const contado = totalContado(conteo);
  const difEfectivo = redondear(contado - (resumen?.efectivoEsperado ?? 0));
  const difTarjeta = redondear(terminal.monto - (resumen?.tarjeta ?? 0));
  const tarjetaCapturada = terminal.monto > 0 || resumen?.tarjeta === 0;
  const efectivoContado = contado > 0 || resumen?.efectivoEsperado === 0;
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

  const handlePrecorte = () => {
    descargarTicketCorte({ tipo: 'X', resumen, conteo, terminal, observaciones, user });
    setAviso('Pre-corte X guardado en PDF');
  };

  // Devuelve false si no se pudo registrar (el diálogo se queda abierto)
  const handleMovimiento = async (movimiento) => {
    try {
      setTurno(await registrarMovimiento(movimiento));
      setAviso(movimiento.tipo === 'retiro' ? 'Retiro registrado' : 'Entrada registrada');
      return true;
    } catch (error) {
      setAviso(mensajeDeError(error, 'No se pudo registrar el movimiento.'));
      return false;
    }
  };

  const handleCerrar = async () => {
    setCerrando(true);
    try {
      const cerrado = corteDesdeApi(await cerrarCaja({ conteo, terminal, observaciones: observaciones.trim() }));
      const ticket = {
        tipo: 'Z',
        folio: cerrado.id,
        fecha: new Date(cerrado.fecha),
        resumen: cerrado.resumen,
        conteo: cerrado.efectivo.conteo,
        terminal: { monto: cerrado.tarjeta.terminal, vouchers: cerrado.tarjeta.vouchers },
        observaciones: cerrado.observaciones,
        user: { nombre: cerrado.usuarioNombre },
      };
      descargarTicketCorte(ticket);
      setConfirmar(false);
      setCorte({ ...cerrado, neto: cerrado.resumen.neto, ticket });
    } catch (error) {
      setConfirmar(false);
      setAviso(mensajeDeError(error, 'No se pudo registrar el corte. Intenta de nuevo.'));
      // Pudo cambiar algo (otra venta, otro cierre): se recarga el turno
      obtenerTurno().then(setTurno).catch(() => {});
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
                '&:hover': { backgroundColor: COLORS.hover },
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
                '&.Mui-disabled': { backgroundColor: '#f3a3ad', color: COLORS.surface, boxShadow: 'none' },
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
            <CheckCircle sx={{ fontSize: 56, color: COLORS.greenText }} />
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
