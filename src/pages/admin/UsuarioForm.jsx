import { useState } from 'react';
import { Box, IconButton, InputAdornment, MenuItem, Typography } from '@mui/material';
import { VisibilityOffOutlined, VisibilityOutlined } from '@mui/icons-material';
import { COLORS } from '../../theme';
import { CampoTexto, ErroresGenerales, Formulario, Interruptor, PieFormulario } from './campos';

// Sugerencia de usuario a partir del nombre: "María López" -> "maria.lopez"
const sugerirUsuario = (nombre) =>
  nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join('.')
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 50);

const UsuarioForm = ({ registro, datos, errores, guardando, onGuardar, onCancelar }) => {
  const esYo = registro?.id === datos.yo;
  const [nombre, setNombre] = useState(registro?.nombre ?? '');
  const [usuario, setUsuario] = useState(registro?.usuario ?? '');
  const [usuarioEditado, setUsuarioEditado] = useState(Boolean(registro));
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [idRol, setIdRol] = useState(registro?.id_rol ?? datos.roles.find((r) => r.nombre.toLowerCase().includes('cajero'))?.id ?? '');
  const [idSucursal, setIdSucursal] = useState(registro?.sucursal?.id ?? datos.sucursales[0]?.id ?? '');
  const [activo, setActivo] = useState(registro?.activo ?? true);

  const rol = datos.roles.find((r) => r.id === idRol);

  const cambiarNombre = (valor) => {
    setNombre(valor);
    // Mientras no lo escriban a mano, el usuario se sugiere con el nombre
    if (!usuarioEditado) setUsuario(sugerirUsuario(valor));
  };

  const guardar = () =>
    onGuardar({
      nombre,
      usuario,
      ...(password || !registro ? { password } : {}),
      id_rol: idRol,
      id_sucursal: idSucursal || null,
      ...(esYo ? {} : { activo }),
    });

  return (
    <Formulario onSubmit={guardar}>
      <CampoTexto id="usuario-nombre" label="Nombre completo *" autoFocus value={nombre} onChange={(e) => cambiarNombre(e.target.value)} error={errores.nombre} placeholder="Ej. Sofía Méndez" slotProps={{ htmlInput: { maxLength: 100 } }} />

      <CampoTexto
        id="usuario-usuario"
        label="Usuario para iniciar sesión *"
        value={usuario}
        onChange={(e) => {
          setUsuarioEditado(true);
          setUsuario(e.target.value.toLowerCase().replace(/\s/g, ''));
        }}
        error={errores.usuario}
        helperText={errores.usuario ?? 'Minúsculas, números, punto o guion; sin espacios'}
        slotProps={{ htmlInput: { maxLength: 50, autoCapitalize: 'none', autoComplete: 'off', spellCheck: false } }}
      />

      <CampoTexto
        id="usuario-password"
        label={registro ? 'Nueva contraseña' : 'Contraseña *'}
        type={verPassword ? 'text' : 'password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errores.password}
        helperText={errores.password ?? (registro ? 'Déjala vacía para conservar la actual' : 'Mínimo 8 caracteres')}
        slotProps={{
          htmlInput: { maxLength: 72, autoComplete: 'new-password' },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setVerPassword((v) => !v)} edge="end">
                  {verPassword ? <VisibilityOffOutlined /> : <VisibilityOutlined />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      <Box>
        <CampoTexto id="usuario-rol" label="Rol *" select value={idRol} onChange={(e) => setIdRol(e.target.value)} error={errores.id_rol} disabled={esYo}>
          {datos.roles.map((r) => (
            <MenuItem key={r.id} value={r.id}>
              {r.nombre}
            </MenuItem>
          ))}
        </CampoTexto>
        {rol?.descripcion && <Typography sx={{ mt: 0.5, px: 0.5, fontSize: '0.78rem', color: COLORS.muted }}>{rol.descripcion}</Typography>}
        {esYo && <Typography sx={{ mt: 0.5, px: 0.5, fontSize: '0.78rem', color: COLORS.muted }}>No puedes cambiar tu propio rol.</Typography>}
      </Box>

      <CampoTexto id="usuario-sucursal" label="Sucursal" select value={idSucursal} onChange={(e) => setIdSucursal(e.target.value)} error={errores.id_sucursal} slotProps={{ select: { displayEmpty: true } }}>
        <MenuItem value="">Sin sucursal asignada</MenuItem>
        {datos.sucursales.map((s) => (
          <MenuItem key={s.id} value={s.id}>
            {s.codigo} · {s.nombre}
            {!s.activo && ' (inactiva)'}
          </MenuItem>
        ))}
      </CampoTexto>

      {esYo ? (
        <Typography sx={{ fontSize: '0.8rem', color: COLORS.muted }}>Es tu usuario: no puedes desactivarlo.</Typography>
      ) : (
        <Interruptor titulo="Usuario activo" descripcion="Si lo desactivas, no puede iniciar sesión y su sesión abierta se cierra" checked={activo} onChange={setActivo} />
      )}

      <ErroresGenerales errores={errores} conocidos={['nombre', 'usuario', 'password', 'id_rol', 'id_sucursal']} />
      <PieFormulario guardando={guardando} onCancelar={onCancelar} etiqueta={registro ? 'Guardar cambios' : 'Crear usuario'} />
    </Formulario>
  );
};

export default UsuarioForm;
