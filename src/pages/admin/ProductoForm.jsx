import { useState } from 'react';
import { Box, Button, Chip, IconButton, InputAdornment, MenuItem, Switch, Tooltip, Typography } from '@mui/material';
import { Add, Check, DeleteOutlined } from '@mui/icons-material';
import { COLORS } from '../../theme';
import { formatMoney } from '../../utils/format';
import { CampoPrecio, CampoTexto, Etiqueta, ErroresGenerales, Formulario, Interruptor, PieFormulario } from './campos';
import { precioATexto } from './formato';

let siguienteClave = 1;
const filaPresentacion = (p = {}) => ({
  clave: siguienteClave++,
  id: p.id,
  nombre: p.nombre ?? '',
  precio: precioATexto(p.precio_base),
  numSabores: p.num_sabores ?? 1,
  activo: p.activo ?? true,
  vendida: p.vendida ?? false,
});

const ProductoForm = ({ registro, catalogo, errores, guardando, onGuardar, onCancelar }) => {
  const [nombre, setNombre] = useState(registro?.nombre ?? '');
  const [idCategoria, setIdCategoria] = useState(registro?.id_categoria ?? catalogo.categorias.find((c) => c.activo)?.id ?? '');
  const [requiereSabor, setRequiereSabor] = useState(registro?.requiere_sabor ?? false);
  const [tipoSabor, setTipoSabor] = useState(registro?.tipo_sabor ?? '');
  const [extras, setExtras] = useState(registro?.extras ?? []);
  const [activo, setActivo] = useState(registro?.activo ?? true);
  const [presentaciones, setPresentaciones] = useState(() =>
    registro?.presentaciones.length ? registro.presentaciones.map(filaPresentacion) : [filaPresentacion({ nombre: 'Única' })]
  );

  const cambiar = (clave, cambios) => setPresentaciones((lista) => lista.map((p) => (p.clave === clave ? { ...p, ...cambios } : p)));
  const quitar = (clave) => setPresentaciones((lista) => lista.filter((p) => p.clave !== clave));
  const toggleExtra = (id) => setExtras((lista) => (lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id]));

  const guardar = () =>
    onGuardar({
      nombre,
      id_categoria: idCategoria,
      requiere_sabor: requiereSabor,
      tipo_sabor: requiereSabor ? tipoSabor : null,
      extras,
      activo,
      presentaciones: presentaciones.map((p) => ({
        ...(p.id ? { id: p.id } : {}),
        nombre: p.nombre,
        precio_base: p.precio === '' ? null : Number(p.precio),
        num_sabores: requiereSabor ? Number(p.numSabores) || 1 : 1,
        activo: p.activo,
      })),
    });

  // Precio · sabores · activa · quitar (el nombre va en su propio renglón)
  const columnas = requiereSabor ? 'minmax(0, 1.2fr) minmax(0, 1fr) auto auto' : 'minmax(0, 1fr) auto auto';

  return (
    <Formulario onSubmit={guardar}>
      <CampoTexto id="producto-nombre" label="Nombre comercial *" autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} error={errores.nombre} placeholder="Ej. Helado Tradicional" slotProps={{ htmlInput: { maxLength: 100 } }} />

      <CampoTexto id="producto-categoria" label="Categoría *" select value={idCategoria} onChange={(e) => setIdCategoria(e.target.value)} error={errores.id_categoria}>
        {catalogo.categorias.map((c) => (
          <MenuItem key={c.id} value={c.id}>
            {c.nombre}
            {!c.activo && ' (inactiva)'}
          </MenuItem>
        ))}
      </CampoTexto>

      <Interruptor titulo="Requiere elegir sabor" descripcion="El POS pedirá el sabor al agregarlo a la orden" checked={requiereSabor} onChange={setRequiereSabor} />
      {requiereSabor && (
        <CampoTexto
          id="producto-tipo-sabor"
          label="Sabores que se pueden elegir *"
          select
          value={tipoSabor}
          onChange={(e) => setTipoSabor(e.target.value)}
          error={errores.tipo_sabor}
          helperText={errores.tipo_sabor ?? 'Se ofrecen los sabores activos de este tipo'}
        >
          {catalogo.tipos_sabor.map((tipo) => (
            <MenuItem key={tipo} value={tipo}>
              {tipo} ({catalogo.sabores.filter((s) => s.tipo === tipo && s.activo).length} activos)
            </MenuItem>
          ))}
        </CampoTexto>
      )}

      {/* Presentaciones y precios */}
      <Box>
        <Etiqueta>Presentaciones y precio de venta *</Etiqueta>
        <Box sx={{ display: 'grid', gap: 1 }}>
          {presentaciones.map((p, i) => (
            <Box
              key={p.clave}
              sx={{ display: 'grid', gap: 0.75, p: 1, borderRadius: 2, border: `1px solid ${COLORS.border}`, opacity: p.activo ? 1 : 0.7 }}
            >
              <CampoTexto
                value={p.nombre}
                onChange={(e) => cambiar(p.clave, { nombre: e.target.value })}
                placeholder="Nombre, ej. Chico (1 bola)"
                error={errores[`presentaciones.${i}.nombre`]}
                slotProps={{ htmlInput: { maxLength: 50, 'aria-label': `Nombre de la presentación ${i + 1}` } }}
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: columnas, alignItems: 'center', gap: 0.75 }}>
                <CampoPrecio
                  value={p.precio}
                  onChange={(precio) => cambiar(p.clave, { precio })}
                  error={errores[`presentaciones.${i}.precio_base`]}
                  slotProps={{
                    htmlInput: { inputMode: 'decimal', 'aria-label': `Precio de la presentación ${i + 1}` },
                    input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
                  }}
                />
                {requiereSabor && (
                  <CampoTexto
                    value={p.numSabores}
                    onChange={(e) => cambiar(p.clave, { numSabores: e.target.value.replace(/\D/g, '').slice(0, 2) })}
                    error={errores[`presentaciones.${i}.num_sabores`]}
                    slotProps={{
                      htmlInput: { inputMode: 'numeric', 'aria-label': `Sabores de la presentación ${i + 1}`, style: { textAlign: 'center' } },
                      input: { endAdornment: <InputAdornment position="end">sab.</InputAdornment> },
                    }}
                  />
                )}
                <Tooltip title={p.activo ? 'Se vende en el POS' : 'Oculta en el POS'}>
                  <Switch checked={p.activo} onChange={(e) => cambiar(p.clave, { activo: e.target.checked })} slotProps={{ input: { 'aria-label': `Presentación ${i + 1} activa` } }} />
                </Tooltip>
                <Tooltip title={p.vendida ? 'Ya se vendió: desactívala en lugar de quitarla' : presentaciones.length === 1 ? 'Debe quedar al menos una' : 'Quitar'}>
                  <span>
                    <IconButton aria-label={`Quitar presentación ${i + 1}`} disabled={p.vendida || presentaciones.length === 1} onClick={() => quitar(p.clave)} sx={{ color: COLORS.red }}>
                      <DeleteOutlined fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            </Box>
          ))}
        </Box>
        {errores.presentaciones && <Typography sx={{ mt: 0.5, fontSize: '0.75rem', color: COLORS.red }}>{errores.presentaciones}</Typography>}
        <Button startIcon={<Add />} onClick={() => setPresentaciones((lista) => [...lista, filaPresentacion()])} sx={{ mt: 1, textTransform: 'none', fontWeight: 600 }}>
          Agregar presentación
        </Button>
      </Box>

      {/* Extras que se ofrecen */}
      <Box>
        <Etiqueta>Extras y toppings que se ofrecen</Etiqueta>
        {catalogo.extras.length ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {catalogo.extras.map((e) => {
              const elegido = extras.includes(e.id);
              return (
                <Chip
                  key={e.id}
                  label={`${e.nombre} · ${formatMoney(e.precio)}${e.activo ? '' : ' (inactivo)'}`}
                  icon={elegido ? <Check /> : undefined}
                  onClick={() => toggleExtra(e.id)}
                  aria-pressed={elegido}
                  sx={{
                    fontWeight: 600,
                    backgroundColor: elegido ? COLORS.blueSoft : COLORS.inputBg,
                    color: elegido ? COLORS.blueText : COLORS.label,
                    border: `1px solid ${elegido ? COLORS.blue : 'transparent'}`,
                    '& .MuiChip-icon': { color: COLORS.blueText },
                  }}
                />
              );
            })}
          </Box>
        ) : (
          <Typography sx={{ fontSize: '0.8rem', color: COLORS.muted }}>Aún no hay extras en el catálogo</Typography>
        )}
        {errores.extras && <Typography sx={{ mt: 0.5, fontSize: '0.75rem', color: COLORS.red }}>{errores.extras}</Typography>}
      </Box>

      <Interruptor titulo="Visible en el POS" descripcion="Desactívalo para ocultarlo sin perder su historial de ventas" checked={activo} onChange={setActivo} />

      <ErroresGenerales errores={errores} conocidos={['nombre', 'id_categoria', 'presentaciones', 'tipo_sabor', 'extras']} />
      <PieFormulario guardando={guardando} onCancelar={onCancelar} etiqueta={registro ? 'Guardar cambios' : 'Crear producto'} />
    </Formulario>
  );
};

export default ProductoForm;
