// Convierte el catálogo del API (GET /catalogo) en lo que pinta y vende el POS.

const FONDO_DEFAULT = 'linear-gradient(135deg, #eef1f5, #dde3ea)';

// Apariencia por categoría (según su nombre, porque los ids vienen de la BD)
const APARIENCIA_CATEGORIA = [
  { clave: 'helado', emoji: '🍦', fondo: 'linear-gradient(135deg, #fff1d6, #ffd9a8)' },
  { clave: 'paleta', emoji: '🍡', fondo: 'linear-gradient(135deg, #ffe0e6, #ffb3c1)' },
  { clave: 'agua', emoji: '🥤', fondo: 'linear-gradient(135deg, #dff3ff, #a9dcf7)' },
  { clave: 'especial', emoji: '🌶️', fondo: 'linear-gradient(135deg, #ffe9d6, #ffbf8a)' },
  { clave: 'crepa', emoji: '🥞', fondo: 'linear-gradient(135deg, #f1e4d8, #d9b99b)' },
  { clave: 'malteada', emoji: '🥤', fondo: 'linear-gradient(135deg, #f1e4d8, #d9b99b)' },
  { clave: 'extra', emoji: '✨', fondo: FONDO_DEFAULT },
];

// Emoji más específico por nombre de producto
const EMOJI_PRODUCTO = [
  ['malteada', '🥤'],
  ['sándwich', '🍪'],
  ['sandwich', '🍪'],
  ['sorpresa', '🎁'],
  ['palomitas', '🍿'],
  ['nachos', '🧀'],
  ['maruchan', '🍜'],
  ['fresas', '🍓'],
  ['mangonada', '🥭'],
  ['crepa', '🥞'],
  ['mini', '🍭'],
];

export const PROMOCIONES_ID = 'promociones';
const FONDO_PROMO = 'linear-gradient(135deg, #fff7b3, #fbe100)';
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const apariencia = (nombreCategoria = '') => {
  const nombre = nombreCategoria.toLowerCase();
  return APARIENCIA_CATEGORIA.find((a) => nombre.includes(a.clave)) ?? { emoji: '🍨', fondo: FONDO_DEFAULT };
};

const emojiProducto = (nombre, porDefecto) => EMOJI_PRODUCTO.find(([clave]) => nombre.toLowerCase().includes(clave))?.[1] ?? porDefecto;

export const adaptarCatalogo = (api, { vendidos = {}, hoy = new Date() } = {}) => {
  const categoriasPorId = Object.fromEntries(api.categorias.map((c) => [c.id, c]));
  const extrasPorId = Object.fromEntries(api.extras.map((e) => [e.id, e]));

  const productos = api.productos.map((p) => {
    const categoria = categoriasPorId[p.id_categoria];
    const { emoji, fondo } = apariencia(categoria?.nombre);
    const presentaciones = p.presentaciones.map((pr) => ({
      id: pr.id,
      nombre: pr.nombre,
      precio: pr.precio_base,
      numSabores: pr.num_sabores ?? 1,
      recargos: Object.fromEntries(pr.recargos.map((r) => [r.id_sabor, r.monto])),
    }));
    // Sabores que se pueden elegir: los del tipo que indica el producto
    const sabores = p.requiere_sabor
      ? api.sabores.filter((s) => s.tipo === p.tipo_sabor).map((s) => ({ id: s.id, nombre: s.nombre, especial: s.es_especial }))
      : [];
    const extras = p.extras.map((id) => extrasPorId[id]).filter(Boolean);
    const personalizable = presentaciones.length > 1 || p.requiere_sabor || extras.length > 0;

    return {
      id: p.id,
      categoria: p.id_categoria,
      nombre: p.nombre,
      emoji: emojiProducto(p.nombre, emoji),
      fondo,
      descripcion: presentaciones.length > 1 ? presentaciones.map((pr) => pr.nombre).join(' · ') : categoria?.nombre ?? '',
      precio: Math.min(...presentaciones.map((pr) => pr.precio)),
      desde: new Set(presentaciones.map((pr) => pr.precio)).size > 1,
      presentaciones,
      requiereSabor: p.requiere_sabor,
      sabores,
      extras,
      personalizable,
      badge: personalizable ? 'Personalizable' : null,
      popularidad: vendidos[p.id] ?? 0,
    };
  });

  // Promociones (combos) que aplican hoy: 1 = domingo … 7 = sábado
  const diaHoy = hoy.getDay() + 1;
  const promociones = api.promociones
    .filter((promo) => promo.dia_semana === null || promo.dia_semana === diaHoy)
    .map((promo) => {
      const id = `promo-${promo.id}`;
      return {
        id,
        idPromocion: promo.id,
        categoria: PROMOCIONES_ID,
        nombre: promo.nombre,
        emoji: '🎉',
        fondo: FONDO_PROMO,
        descripcion: promo.dia_semana ? `Solo los ${DIAS[promo.dia_semana - 1]}` : 'Todos los días',
        precio: promo.precio_combo,
        desde: false,
        presentaciones: [{ id: null, nombre: 'Combo', precio: promo.precio_combo, numSabores: 0, recargos: {} }],
        requiereSabor: false,
        sabores: [],
        extras: [],
        // El combo se arma con notas (qué botana, qué agua…) hasta que la BD defina sus componentes
        personalizable: true,
        badge: 'Promo',
        popularidad: vendidos[id] ?? 0,
      };
    });

  // Solo categorías con algo que vender
  const conProductos = new Set(productos.map((p) => p.categoria));
  const categorias = api.categorias.filter((c) => conProductos.has(c.id)).map((c) => ({ id: c.id, label: c.nombre }));
  if (promociones.length) categorias.push({ id: PROMOCIONES_ID, label: 'Promociones' });

  // "Favoritos": lo más vendido en esta terminal
  const favoritos = new Set(
    [...productos, ...promociones]
      .filter((p) => p.popularidad > 0)
      .sort((a, b) => b.popularidad - a.popularidad)
      .slice(0, 8)
      .map((p) => p.id)
  );

  // Ids de metodos_pago por nombre (Efectivo, Tarjeta de Débito, Tarjeta de Crédito)
  const metodo = (clave) => api.metodos_pago.find((m) => m.nombre.toLowerCase().includes(clave))?.id ?? null;

  return {
    categorias,
    productos: [...productos, ...promociones].map((p) => ({ ...p, favorito: favoritos.has(p.id) })),
    metodosPago: { efectivo: metodo('efectivo'), debito: metodo('débito'), credito: metodo('crédito') },
  };
};

/**
 * Vuelve a tasar las líneas de una orden con un catálogo nuevo (cuando cambian precios a media venta).
 * Devuelve las líneas actualizadas y los nombres de las que ya no se pueden vender.
 */
export const actualizarPrecios = (lineas, catalogo) => {
  const quitadas = [];
  const vigentes = lineas.flatMap((linea) => {
    const producto = catalogo.productos.find((p) => p.id === linea.productoId);
    const presentacion = producto?.presentaciones.find((p) => p.id === linea.idPresentacion);
    const sabores = linea.sabores.map((s) => (producto?.sabores.some((x) => x.id === s.id) ? { ...s, extra: presentacion?.recargos[s.id] ?? 0 } : null));
    const extras = linea.extras.map((e) => producto?.extras.find((x) => x.id === e.id) ?? null);

    if (!presentacion || sabores.includes(null) || extras.includes(null)) {
      quitadas.push(linea.nombre);
      return [];
    }
    return [{ ...linea, precioBase: presentacion.precio, sabores, extras: extras.map(({ id, nombre, precio }) => ({ id, nombre, precio })) }];
  });
  return { lineas: vigentes, quitadas };
};
