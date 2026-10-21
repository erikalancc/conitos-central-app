import { useState } from 'react';
import { MenuItem, Typography } from '@mui/material';
import { COLORS } from '../../theme';
import { CampoPrecio, CampoTexto, ErroresGenerales, Formulario, Interruptor, PieFormulario } from './campos';
import { precioATexto } from './formato';
import { DIAS_SEMANA } from './recursos';

export const CategoriaForm = ({ registro, errores, guardando, onGuardar, onCancelar }) => {
  const [nombre, setNombre] = useState(registro?.nombre ?? '');
  const [activo, setActivo] = useState(registro?.activo ?? true);

  return (
    <Formulario onSubmit={() => onGuardar({ nombre, activo })}>
      <CampoTexto id="categoria-nombre" label="Nombre de la categoría *" autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} error={errores.nombre} slotProps={{ htmlInput: { maxLength: 50 } }} />
      <Interruptor titulo="Visible en el POS" descripcion="Si se desactiva, sus productos dejan de mostrarse en caja" checked={activo} onChange={setActivo} />
      {registro && (
        <Typography sx={{ fontSize: '0.82rem', color: COLORS.muted }}>
          {registro.productos} producto{registro.productos === 1 ? '' : 's'} en esta categoría
        </Typography>
      )}
      <ErroresGenerales errores={errores} conocidos={['nombre']} />
      <PieFormulario guardando={guardando} onCancelar={onCancelar} />
    </Formulario>
  );
};

export const ExtraForm = ({ registro, errores, guardando, onGuardar, onCancelar }) => {
  const [nombre, setNombre] = useState(registro?.nombre ?? '');
  const [precio, setPrecio] = useState(precioATexto(registro?.precio));
  const [activo, setActivo] = useState(registro?.activo ?? true);

  return (
    <Formulario onSubmit={() => onGuardar({ nombre, precio: precio === '' ? '' : Number(precio), activo })}>
      <CampoTexto id="extra-nombre" label="Nombre del extra o topping *" autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} error={errores.nombre} slotProps={{ htmlInput: { maxLength: 50 } }} />
      <CampoPrecio id="extra-precio" label="Precio *" value={precio} onChange={setPrecio} error={errores.precio} />
      <Interruptor titulo="Disponible en el POS" checked={activo} onChange={setActivo} />
      <ErroresGenerales errores={errores} conocidos={['nombre', 'precio']} />
      <PieFormulario guardando={guardando} onCancelar={onCancelar} />
    </Formulario>
  );
};

export const PromocionForm = ({ registro, errores, guardando, onGuardar, onCancelar }) => {
  const [nombre, setNombre] = useState(registro?.nombre ?? '');
  const [precio, setPrecio] = useState(precioATexto(registro?.precio_combo));
  const [dia, setDia] = useState(registro?.dia_semana ?? '');
  const [activa, setActiva] = useState(registro?.activa ?? true);

  return (
    <Formulario onSubmit={() => onGuardar({ nombre, precio_combo: precio === '' ? '' : Number(precio), dia_semana: dia || null, activa })}>
      <CampoTexto id="promo-nombre" label="Nombre de la promoción *" autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} error={errores.nombre} placeholder="Ej. Martes Loco (Botana + Agua 1/2L)" slotProps={{ htmlInput: { maxLength: 100 } }} />
      <CampoPrecio id="promo-precio" label="Precio del combo *" value={precio} onChange={setPrecio} error={errores.precio_combo} />
      <CampoTexto id="promo-dia" label="Día en que aplica" select value={dia} onChange={(e) => setDia(e.target.value)} error={errores.dia_semana}>
        <MenuItem value="">Todos los días</MenuItem>
        {DIAS_SEMANA.map((nombreDia, i) => (
          <MenuItem key={nombreDia} value={i + 1}>
            {nombreDia}
          </MenuItem>
        ))}
      </CampoTexto>
      <Interruptor titulo="Promoción activa" descripcion="Solo las activas aparecen en el POS" checked={activa} onChange={setActiva} />
      <ErroresGenerales errores={errores} conocidos={['nombre', 'precio_combo', 'dia_semana']} />
      <PieFormulario guardando={guardando} onCancelar={onCancelar} />
    </Formulario>
  );
};
