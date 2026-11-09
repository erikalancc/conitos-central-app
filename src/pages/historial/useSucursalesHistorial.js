import { useEffect, useState } from 'react';
import { obtenerSucursales } from '../../services/sucursalesService';

/**
 * Sucursales para el historial del administrador (cada una se consulta por separado).
 * Devuelve null mientras carga y [] si falla (el historial sigue con la sucursal asignada).
 * habilitado = false: no consulta nada (solo el administrador puede listar sucursales).
 */
export const useSucursalesHistorial = (habilitado = true) => {
  const [sucursales, setSucursales] = useState(null);

  useEffect(() => {
    if (!habilitado) return undefined;
    let vigente = true;
    obtenerSucursales()
      .then(({ sucursales: lista }) => {
        if (!vigente) return;
        // Las que operan primero (matriz al inicio); las inactivas al final, por si tienen ventas antiguas
        const orden = [...lista].sort((a, b) => b.activo - a.activo || b.es_matriz - a.es_matriz || a.nombre.localeCompare(b.nombre));
        setSucursales(orden.map((s) => ({ id: s.id, nombre: s.nombre, activo: s.activo })));
      })
      .catch(() => vigente && setSucursales([]));
    return () => {
      vigente = false;
    };
  }, [habilitado]);

  return sucursales;
};
