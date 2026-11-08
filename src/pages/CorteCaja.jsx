import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Dialog, Divider, Snackbar, Step, StepLabel, Stepper, TextField, Typography } from '@mui/material';
import { ArrowBack, ArrowForward, CheckCircle, CreditCard, LockOutlined, PointOfSale, PrintOutlined, SavingsOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { mensajeDeError } from '../api/axiosClient';
import { ROLES } from '../auth/roles';
import { getSession } from '../auth/session';
import IconTile from '../components/IconTile';
import Panel from '../components/Panel';
import { DENOMINACIONES } from '../data/catalogo';
import { FONDO_SUGERIDO } from '../data/dummy';
import { abrirCaja, cerrarCaja, corteDesdeApi, obtenerCaja, obtenerTurno, registrarMovimiento, resumenDesdeTurno } from '../services/corteService';
import { COLORS } from '../theme';
import { formatMoney } from '../utils/format';
import { checklistPendiente, obtenerChecklist } from '../services/checklistService';
import ChecklistApertura from './inicio/ChecklistApertura';
import ConteoEfectivo from './corte/ConteoEfectivo';
import DesglosePagos from './corte/DesglosePagos';
import { COLOR_METODO, estadoDiferencia, totalContado } from './corte/estilos';
import MontoInput from './corte/MontoInput';
import MovimientosEfectivo from './corte/MovimientosEfectivo';
import ResumenTurno from './corte/ResumenTurno';
import { descargarTicketCorte } from './corte/ticketCorte';
import VentasDelDia from './corte/VentasDelDia';

const GAP = { xs: 2, md: 3 };
const PASOS = ['Turno', 'Conteo', 'Resultado'];

const redondear = (valor) => Math.round(valor * 100) / 100;

const Renglon = ({ label, value, color, fuerte }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 0.4, fontSize: fuerte ? '1rem' : '0.9rem', fontWeight: fuerte ? 800 : 500, color }}>
    <span>{label}</span>
    <Box component="span" sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
      {value}
    </Box>
  </Box>
);

const Etiqueta = ({ htmlFor, children }) => (
  <Typography component="label" htmlFor={htmlFor} sx={{ display: 'block', mb: 0.5, fontSize: '0.85rem', fontWeight: 700, color: COLORS.ink }}>
    {children}
  </Typography>
);

// Texto claro de una diferencia: "Te faltaron $50.00", "Te sobraron $20.00" o "Cuadra exacto"
const textoDiferencia = (diferencia, { falta = 'Te faltaron', sobra = 'Te sobraron', cuadra = 'Cuadra exacto' } = {}) => {
  if (Math.abs(diferencia) < 0.005) return cuadra;
  return `${diferencia < 0 ? falta : sobra} ${formatMoney(Math.abs(diferencia))}`;
};

const botonPrincipalSx = {
  minHeight: 56,
  px: 3,
  borderRadius: 3,
  textTransform: 'none',
  fontWeight: 800,
  fontSize: '1rem',
  backgroundColor: COLORS.red,
  boxShadow: '0 6px 16px rgba(227, 36, 59, 0.3)',
  '&:hover': { backgroundColor: COLORS.redHover },
  '&.Mui-disabled': { backgroundColor: '#f3a3ad', color: COLORS.surface, boxShadow: 'none' },
};
const botonSecundarioSx = { minHeight: 56, px: 3, borderRadius: 3, textTransform: 'none', fontWeight: 700, color: COLORS.label, backgroundColor: COLORS.inputBg };

// Resumen del conteo antes de confirmarlo: piezas por denominación, subtotales de billetes y monedas
const ResumenConteo = ({ conteo }) =>
  [
    { titulo: 'Billetes', lista: DENOMINACIONES.billetes },
    { titulo: 'Monedas', lista: DENOMINACIONES.monedas },
  ].map(({ titulo, lista }) => {
    const filas = lista.filter((valor) => (conteo[valor] ?? 0) > 0);
    const subtotal = filas.reduce((suma, valor) => suma + valor * conteo[valor], 0);
    return (
      <Box key={titulo} sx={{ p: 1.25, borderRadius: 2.5, backgroundColor: COLORS.surfaceAlt }}>
        <Renglon label={`${titulo} (${filas.reduce((s, v) => s + conteo[v], 0)} piezas)`} value={formatMoney(subtotal)} color={COLORS.ink} fuerte />
        {filas.length ? (
          filas.map((valor) => <Renglon key={valor} label={`${conteo[valor]} × ${formatMoney(valor)}`} value={formatMoney(valor * conteo[valor])} color={COLORS.label} />)
        ) : (
          <Typography sx={{ fontSize: '0.85rem', color: COLORS.muted }}>Sin {titulo.toLowerCase()}</Typography>
        )}
      </Box>
    );
  });

// Caja sin turno abierto: se abre aquí mismo; se propone el fondo que se dejó en el último corte
const CajaCerrada = ({ fondoSugerido, onAbierta }) => {
  const [fondo, setFondo] = useState(fondoSugerido ?? FONDO_SUGERIDO);
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
          <Etiqueta htmlFor="fondo-apertura">Fondo inicial en gaveta</Etiqueta>
          <MontoInput id="fondo-apertura" value={fondo} onChange={setFondo} />
          {fondoSugerido != null && (
            <Typography sx={{ mt: 0.5, fontSize: '0.75rem', color: COLORS.muted }}>Es el fondo que se dejó en el último corte.</Typography>
          )}
        </Box>
        <Button variant="contained" disableElevation startIcon={<PointOfSale />} disabled={abriendo} onClick={abrir} sx={botonPrincipalSx}>
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

/**
 * Corte de caja en 3 pasos:
 *  1. Turno: movimientos y ventas del turno (el vendedor solo ve sus últimas ventas y no ve totales).
 *  2. Conteo a ciegas: fondo que se deja para mañana, billetes y monedas, y total de la terminal de tarjeta.
 *  3. Resultado: cuánto debía haber vs. lo contado (faltó / sobró / cuadra), cuánto se entrega y cierre Z.
 */
const CorteCaja = () => {
  const user = getSession();
  const esVendedor = user?.id_rol === ROLES.CAJERO;
  const navigate = useNavigate();
  const [turno, setTurno] = useState(undefined); // undefined = cargando, null = caja cerrada
  const [fondoSugerido, setFondoSugerido] = useState(null);
  const [errorCarga, setErrorCarga] = useState('');
  const [paso, setPaso] = useState(0);
  const [conteo, setConteo] = useState({});
  const [fondoSiguiente, setFondoSiguiente] = useState(null); // null = aún no lo captura (se propone el fondo inicial)
  const [terminal, setTerminal] = useState(0);
  const [observaciones, setObservaciones] = useState('');
  const [confirmarConteo, setConfirmarConteo] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [corte, setCorte] = useState(null);
  const [aviso, setAviso] = useState('');
  const [checklistCierre, setChecklistCierre] = useState(null); // checklist "antes del corte" pendiente

  // Vendedor: antes de iniciar el corte debe completar el checklist de cierre (si su sucursal tiene puntos)
  const iniciarCorte = async () => {
    if (!esVendedor) return setPaso(1);
    try {
      const checklist = await obtenerChecklist('cierre');
      if (checklistPendiente(checklist)) setChecklistCierre(checklist);
      else setPaso(1);
    } catch (e) {
      setAviso(mensajeDeError(e, 'No se pudo consultar el checklist de antes del corte.'));
    }
  };

  useEffect(() => {
    let vigente = true;
    obtenerCaja()
      .then((caja) => {
        if (!vigente) return;
        setTurno(caja.turno);
        setFondoSugerido(caja.fondoSugerido);
      })
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
  if (!resumen && !corte) return <CajaCerrada fondoSugerido={fondoSugerido} onAbierta={setTurno} />;

  // ----- Cálculos del cuadre (solo se muestran en el paso 3) -----
  const contado = totalContado(conteo);
  const fondo = fondoSiguiente ?? Math.min(resumen?.fondo ?? 0, contado);
  const difEfectivo = redondear(contado - (resumen?.efectivoEsperado ?? 0));
  const difTarjeta = redondear(terminal - (resumen?.tarjeta ?? 0));
  const hayDiferencias = Math.abs(difEfectivo) >= 0.01 || Math.abs(difTarjeta) >= 0.01;
  const fondoInvalido = fondo > contado;
  const faltaJustificar = hayDiferencias && !observaciones.trim();

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
      const cerrado = corteDesdeApi(
        await cerrarCaja({ conteo, fondoSiguiente: fondo, terminal: { monto: terminal, vouchers: null }, observaciones: observaciones.trim() })
      );
      const ticket = {
        tipo: 'Z',
        folio: cerrado.id,
        fecha: new Date(cerrado.fecha),
        resumen: cerrado.resumen,
        conteo: cerrado.efectivo.conteo,
        terminal: { monto: cerrado.tarjeta.terminal, vouchers: cerrado.tarjeta.vouchers },
        fondoSiguiente: cerrado.efectivo.fondo_siguiente,
        observaciones: cerrado.observaciones,
        user: { nombre: cerrado.usuarioNombre },
      };
      descargarTicketCorte(ticket);
      setCorte({ ...cerrado, neto: cerrado.resumen.neto, ticket });
    } catch (error) {
      setAviso(mensajeDeError(error, 'No se pudo registrar el corte. Intenta de nuevo.'));
      // Pudo cambiar algo (otra venta, otro cierre): se recarga el turno y se repasa el resultado
      obtenerTurno().then(setTurno).catch(() => {});
    } finally {
      setCerrando(false);
    }
  };

  const encabezado = (
    <Panel sx={{ p: { xs: 2, md: 2.5 } }}>
      <Stepper activeStep={paso} alternativeLabel>
        {PASOS.map((p) => (
          <Step key={p}>
            <StepLabel>{p}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </Panel>
  );

  return (
    <Box sx={{ display: 'grid', gap: GAP }}>
      {/* ---------- PASO 1 · TURNO ---------- */}
      {paso === 0 && resumen && (
        <>
          {/* El vendedor no ve los totales del turno: así cuenta el efectivo sin saber cuánto "debería" haber */}
          {!esVendedor && <ResumenTurno resumen={resumen} user={user} />}
          <Box sx={{ display: 'grid', gap: GAP, alignItems: 'start', gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) 420px' } }}>
            <Box sx={{ display: 'grid', gap: GAP, minWidth: 0 }}>
              {!esVendedor && <DesglosePagos resumen={resumen} />}
              <MovimientosEfectivo resumen={resumen} onRegistrar={handleMovimiento} aCiegas={esVendedor} />
              <VentasDelDia resumen={resumen} />
            </Box>

            <Panel component="aside" sx={{ p: { xs: 2, md: 2.5 }, display: 'grid', gap: 1.5, position: { lg: 'sticky' }, top: { lg: 16 } }}>
              <Typography component="h2" sx={{ fontWeight: 800, fontSize: '1.2rem', color: COLORS.ink }}>
                Corte de caja
              </Typography>
              <Typography sx={{ fontSize: '0.88rem', color: COLORS.label }}>Al terminar el turno haz el corte en dos pasos:</Typography>
              <Box component="ol" sx={{ m: 0, pl: 2.5, display: 'grid', gap: 0.75, fontSize: '0.88rem', color: COLORS.label }}>
                <li>
                  <strong>Conteo:</strong> decide cuánto efectivo dejas de fondo para mañana, cuenta billetes y monedas, y anota el total que marca la terminal de tarjeta.
                </li>
                <li>
                  <strong>Resultado:</strong> el sistema compara lo que contaste con lo vendido y te dice si te faltó, te sobró o cuadra.
                </li>
              </Box>
              <Button variant="contained" disableElevation endIcon={<ArrowForward />} onClick={iniciarCorte} sx={botonPrincipalSx}>
                Iniciar corte de caja
              </Button>
              {!esVendedor && (
                <Button
                  startIcon={<PrintOutlined />}
                  onClick={() => {
                    descargarTicketCorte({ tipo: 'X', resumen, conteo: {}, terminal: { monto: 0 }, observaciones: '', user });
                    setAviso('Pre-corte X guardado en PDF');
                  }}
                  sx={botonSecundarioSx}
                >
                  Imprimir pre-corte X (lectura parcial)
                </Button>
              )}
            </Panel>
          </Box>
        </>
      )}

      {/* ---------- PASO 2 · CONTEO (a ciegas) ---------- */}
      {paso === 1 && (
        <>
          {encabezado}
          <Box sx={{ display: 'grid', gap: GAP, alignItems: 'start', gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) 420px' } }}>
            <ConteoEfectivo conteo={conteo} onConteo={setConteo} />

            <Panel component="aside" sx={{ p: { xs: 2, md: 2.5 }, display: 'grid', gap: 2, position: { lg: 'sticky' }, top: { lg: 16 } }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: COLOR_METODO.efectivo.fuerte }}>
                  <SavingsOutlined />
                  <Typography sx={{ fontWeight: 800, color: COLORS.ink }}>Fondo para mañana</Typography>
                </Box>
                <Etiqueta htmlFor="fondo-siguiente">¿Cuánto efectivo dejas en la gaveta para el siguiente turno?</Etiqueta>
                <MontoInput id="fondo-siguiente" value={fondo} onChange={setFondoSiguiente} />
                <Typography sx={{ mt: 0.5, fontSize: '0.75rem', color: fondoInvalido ? COLORS.red : COLORS.muted }}>
                  {fondoInvalido ? 'No puede ser mayor a lo que contaste.' : 'Sale del efectivo que cuentes; el resto se entrega a depósito.'}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: COLOR_METODO.tarjeta.fuerte }}>
                  <CreditCard />
                  <Typography sx={{ fontWeight: 800, color: COLORS.ink }}>Terminal de tarjeta</Typography>
                </Box>
                <Etiqueta htmlFor="total-terminal">Total de ventas que indica la terminal (cierre de lote)</Etiqueta>
                <MontoInput id="total-terminal" value={terminal} onChange={setTerminal} />
                <Typography sx={{ mt: 0.5, fontSize: '0.75rem', color: COLORS.muted }}>Imprime el cierre de la terminal y captura el total. Si no hubo ventas con tarjeta, déjalo en $0.</Typography>
              </Box>

              <Box sx={{ p: 1.5, borderRadius: 2.5, backgroundColor: COLORS.greenSoft, color: COLORS.greenText }}>
                <Renglon label="Efectivo contado" value={formatMoney(contado)} fuerte />
                <Renglon label="Dejas de fondo" value={formatMoney(fondo)} />
                <Renglon label="Entregas a depósito" value={formatMoney(Math.max(0, contado - fondo))} />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 1 }}>
                <Button startIcon={<ArrowBack />} onClick={() => setPaso(0)} sx={botonSecundarioSx}>
                  Atrás
                </Button>
                <Button variant="contained" disableElevation endIcon={<ArrowForward />} disabled={fondoInvalido} onClick={() => setConfirmarConteo(true)} sx={botonPrincipalSx}>
                  Siguiente
                </Button>
              </Box>
            </Panel>
          </Box>
        </>
      )}

      {/* ---------- PASO 3 · RESULTADO Y CIERRE ---------- */}
      {paso === 2 && resumen && (
        <>
          {encabezado}
          <Panel sx={{ p: { xs: 2, md: 3 }, display: 'grid', gap: 2.5, maxWidth: 760, width: '100%', mx: 'auto' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ color: COLORS.label }}>Contaste en efectivo</Typography>
              <Typography sx={{ fontWeight: 800, fontSize: '2.2rem', color: COLORS.ink, fontVariantNumeric: 'tabular-nums' }}>{formatMoney(contado)}</Typography>
            </Box>

            {/* Resultado principal: el efectivo */}
            {(() => {
              const estado = estadoDiferencia(difEfectivo);
              return (
                <Box sx={{ p: 2, borderRadius: 3, textAlign: 'center', backgroundColor: estado.bg, color: estado.color }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.5rem' }}>{textoDiferencia(difEfectivo)}</Typography>
                  <Typography sx={{ fontSize: '0.85rem' }}>
                    {Math.abs(difEfectivo) < 0.005 ? 'El efectivo de la gaveta coincide con lo que se vendió.' : 'Diferencia entre el efectivo contado y el que debía haber.'}
                  </Typography>
                </Box>
              );
            })()}

            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
              {/* Cómo se calcula el efectivo que debía haber */}
              <Box sx={{ p: 1.5, borderRadius: 3, border: `1px solid ${COLORS.border}`, borderLeft: `4px solid ${COLOR_METODO.efectivo.barra}` }}>
                <Typography sx={{ mb: 0.5, fontWeight: 700, color: COLORS.ink }}>Efectivo</Typography>
                <Renglon label="Fondo con que abriste" value={formatMoney(resumen.fondo)} color={COLORS.label} />
                <Renglon label="+ Ventas en efectivo" value={formatMoney(resumen.efectivo)} color={COLORS.label} />
                {resumen.entradas > 0 && <Renglon label="+ Entradas de efectivo" value={formatMoney(resumen.entradas)} color={COLORS.label} />}
                {resumen.retiros > 0 && <Renglon label="− Retiros de efectivo" value={formatMoney(resumen.retiros)} color={COLORS.label} />}
                <Divider sx={{ my: 0.5 }} />
                <Renglon label="Debías tener" value={formatMoney(resumen.efectivoEsperado)} color={COLORS.ink} fuerte />
                <Renglon label="Contaste" value={formatMoney(contado)} color={COLORS.ink} />
              </Box>

              {/* Tarjeta: lo que registró el sistema vs. la terminal */}
              <Box sx={{ p: 1.5, borderRadius: 3, border: `1px solid ${COLORS.border}`, borderLeft: `4px solid ${COLOR_METODO.tarjeta.barra}` }}>
                <Typography sx={{ mb: 0.5, fontWeight: 700, color: COLORS.ink }}>Tarjeta</Typography>
                <Renglon label="Ventas con tarjeta (sistema)" value={formatMoney(resumen.tarjeta)} color={COLORS.label} />
                <Renglon label="Total de la terminal" value={formatMoney(terminal)} color={COLORS.label} />
                <Divider sx={{ my: 0.5 }} />
                <Renglon
                  label={Math.abs(difTarjeta) < 0.005 ? 'Coincide' : difTarjeta < 0 ? 'La terminal marca menos' : 'La terminal marca más'}
                  value={Math.abs(difTarjeta) < 0.005 ? '✓' : formatMoney(Math.abs(difTarjeta))}
                  color={estadoDiferencia(difTarjeta).color}
                  fuerte
                />
              </Box>
            </Box>

            {/* Total del turno y entrega */}
            <Box sx={{ p: 1.5, borderRadius: 3, backgroundColor: COLORS.surfaceAlt }}>
              <Renglon label="Ventas del turno" value={formatMoney(resumen.neto)} color={COLORS.ink} fuerte />
              <Renglon label={`Efectivo ${formatMoney(resumen.efectivo)} + Tarjeta ${formatMoney(resumen.tarjeta)}`} value="" color={COLORS.muted} />
              <Divider sx={{ my: 0.5 }} />
              <Renglon label="Se queda en gaveta (fondo para mañana)" value={formatMoney(fondo)} color={COLORS.label} />
              <Renglon label="Entregas a depósito" value={formatMoney(contado - fondo)} color={COLORS.ink} fuerte />
            </Box>

            <Box>
              <Etiqueta htmlFor="observaciones-corte">Observaciones {hayDiferencias ? '(obligatorio: explica la diferencia)' : '(opcional)'}</Etiqueta>
              <TextField
                id="observaciones-corte"
                fullWidth
                multiline
                minRows={2}
                maxRows={4}
                placeholder="Ej. Se dio cambio de más en una venta; gaveta entregada a la supervisora…"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                error={faltaJustificar}
                sx={{ '& .MuiOutlinedInput-root': { backgroundColor: COLORS.inputBg, borderRadius: 2, '& fieldset': { borderColor: 'transparent' } } }}
              />
            </Box>

            {/* El conteo ya se confirmó: no se puede regresar a modificarlo */}
            <Button variant="contained" disableElevation startIcon={<LockOutlined />} disabled={cerrando || faltaJustificar} onClick={handleCerrar} sx={botonPrincipalSx}>
              {cerrando ? 'Cerrando…' : 'Cerrar turno e imprimir corte Z'}
            </Button>
          </Panel>
        </>
      )}

      {/* CHECKLIST ANTES DEL CORTE (vendedor): al guardarlo pasa al conteo; con ✕ se cancela el inicio del corte */}
      {checklistCierre && (
        <ChecklistApertura
          open
          momento="cierre"
          items={checklistCierre.items}
          sucursal={checklistCierre.sucursal}
          user={user}
          onClose={() => setChecklistCierre(null)}
          onSaved={() => {
            setChecklistCierre(null);
            setPaso(1);
          }}
        />
      )}

      {/* CONFIRMACIÓN DEL CONTEO: al confirmar ya no se puede regresar a modificarlo */}
      <Dialog open={confirmarConteo} onClose={() => setConfirmarConteo(false)} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <Box sx={{ p: 3, display: 'grid', gap: 1.5 }}>
          <Box>
            <Typography component="h2" sx={{ fontWeight: 800, fontSize: '1.3rem', color: COLORS.ink }}>
              Confirma tu conteo
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', color: COLORS.muted }}>Revisa que coincida con lo que tienes en la gaveta.</Typography>
          </Box>
          <ResumenConteo conteo={conteo} />
          <Box sx={{ px: 1.25 }}>
            <Renglon label="Total de efectivo contado" value={formatMoney(contado)} color={COLOR_METODO.efectivo.fuerte} fuerte />
            <Renglon label="Dejas de fondo para mañana" value={formatMoney(fondo)} color={COLORS.label} />
            <Renglon label="Total de la terminal de tarjeta" value={formatMoney(terminal)} color={COLOR_METODO.tarjeta.fuerte} />
          </Box>
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            Al confirmar ya no podrás regresar a modificar el conteo.
          </Alert>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            <Button onClick={() => setConfirmarConteo(false)} sx={{ ...botonSecundarioSx, minHeight: 52 }}>
              Revisar conteo
            </Button>
            <Button
              variant="contained"
              disableElevation
              onClick={() => {
                setConfirmarConteo(false);
                setPaso(2);
              }}
              sx={{ ...botonPrincipalSx, minHeight: 52 }}
            >
              Confirmar
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
              <Renglon label="Efectivo contado" value={formatMoney(corte.efectivo.contado)} color={COLOR_METODO.efectivo.fuerte} />
              <Renglon label="Fondo para mañana" value={formatMoney(corte.efectivo.fondo_siguiente ?? 0)} color={COLORS.label} />
              <Renglon label="Entregado a depósito" value={formatMoney(corte.efectivo.contado - (corte.efectivo.fondo_siguiente ?? 0))} color={COLORS.label} />
              <Renglon label="Tarjeta (terminal)" value={formatMoney(corte.tarjeta.terminal)} color={COLOR_METODO.tarjeta.fuerte} />
              <Divider sx={{ my: 0.5 }} />
              <Renglon label={textoDiferencia(corte.efectivo.diferencia, { falta: 'Faltante', sobra: 'Sobrante', cuadra: 'Efectivo cuadrado' })} value="" color={estadoDiferencia(corte.efectivo.diferencia).color} fuerte />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 2.5 }}>
              <Button startIcon={<PrintOutlined />} onClick={() => descargarTicketCorte(corte.ticket)} sx={{ ...botonSecundarioSx, minHeight: 52 }}>
                Reimprimir
              </Button>
              <Button autoFocus variant="contained" disableElevation onClick={() => navigate('/inicio')} sx={{ minHeight: 52, borderRadius: 2.5, textTransform: 'none', fontWeight: 700 }}>
                Ir a inicio
              </Button>
            </Box>
          </Box>
        )}
      </Dialog>

      <Snackbar open={Boolean(aviso)} autoHideDuration={2500} onClose={() => setAviso('')} message={aviso} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  );
};

export default CorteCaja;
