// id_rol del API (tabla roles)
export const ROLES = {
  ADMIN: 1,
  CAJERO: 2,
  PRODUCTOR: 3,
  COMPRAS: 4,
};

export const tieneRol = (usuario, roles) => !roles || roles.includes(usuario?.id_rol);

/**
 * Módulos y roles que pueden entrar. Inicio está abierto a todos.
 * Una sola fuente para el menú, las rutas y los accesos rápidos
 * (el API aplica los mismos permisos en sus endpoints).
 */
export const MODULOS = {
  pos: [ROLES.ADMIN, ROLES.CAJERO],
  corte: [ROLES.ADMIN, ROLES.CAJERO],
  historial: [ROLES.ADMIN, ROLES.CAJERO],
  admin: [ROLES.ADMIN],
  inventario: [ROLES.ADMIN],
  precios: [ROLES.ADMIN],
};

export const puedeEntrar = (usuario, modulo) => tieneRol(usuario, MODULOS[modulo]);
