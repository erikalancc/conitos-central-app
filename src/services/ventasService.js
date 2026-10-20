// Simulación del API de ventas: guarda en localStorage.
// Cuando exista el backend, reemplazar por las llamadas con axiosClient.
const VENTAS_KEY = 'ventas';
const ORDENES_KEY = 'ordenesGuardadas';

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const leerLista = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? [];
  } catch {
    return [];
  }
};

const agregarALista = (key, registro) => {
  localStorage.setItem(key, JSON.stringify([...leerLista(key), registro]));
};

// TODO API: axiosClient.post('/ventas', venta)
export const registrarVenta = async (venta) => {
  await esperar(800);
  const registro = { ...venta, id: Date.now(), fecha: new Date().toISOString() };
  agregarALista(VENTAS_KEY, registro);
  return registro;
};

// TODO API: axiosClient.post('/ordenes-en-espera', orden)
export const guardarOrden = async (orden) => {
  await esperar(400);
  const registro = { ...orden, id: Date.now(), fecha: new Date().toISOString() };
  agregarALista(ORDENES_KEY, registro);
  return registro;
};
