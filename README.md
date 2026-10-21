# conitos-central-app

Front del punto de venta de **Conitos Central**: React 19 + Vite 8 + Material UI 9. Consume el API [conitos-central-api](https://github.com/erikalancc/conitos-central-api) (CodeIgniter 4).

| Documento (en el repo del API) | Contenido |
|---|---|
| `docs/README.md` | Endpoints, autenticación y roles |
| `docs/BASE_DE_DATOS.md` | Modelo de la base de datos |
| `docs/PENDIENTES.md` | Pendientes del sistema completo (front, API y BD) |

## Requisitos

- Node.js 20+ y npm
- El API corriendo (en local: `http://localhost:8080`)

## Instalación y scripts

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # genera dist/
npm run preview   # sirve dist/ para probar el build
npm run lint      # oxlint
```

### Variables de entorno

| Archivo | `VITE_API_URL` |
|---|---|
| `.env.development` | `http://localhost:8080/api/v1` |
| `.env.production` | URL del API en producción (ajustar antes de `npm run build`) |

El origen del front debe estar en `cors.origins` del `.env` del API (en local, `http://localhost:5173`).

### Publicación (Hostinger / Apache)

1. `npm run build` con `.env.production` apuntando al API real.
2. Subir el contenido de `dist/` a la carpeta del dominio del front.
3. `dist/.htaccess` (viene de `public/.htaccess`) redirige todas las rutas a `index.html` para que funcione React Router. Si el front no vive en la raíz del dominio, ajustar `base` en `vite.config.js` y `RewriteBase` en el `.htaccess`.

## Módulos y permisos

| Ruta | Módulo | Administrador | Vendedor / Cajero | Productor / Compras |
|---|---|:-:|:-:|:-:|
| `/login` | Inicio de sesión | ✔ | ✔ | ✔ |
| `/inicio` | Bienvenida, checklist de apertura, **abrir caja** | ✔ | ✔ | ✔ (sin abrir caja) |
| `/pos` | Terminal POS | ✔ | ✔ | |
| `/corte` | Corte de caja (turno, movimientos, conteo, corte Z) | ✔ | ✔ | |
| `/historial`, `/historial/:fecha` | Ventas por semana y detalle del día con su cuadre | ✔ | ✔ | |
| `/admin` | Catálogo y precios | ✔ | | |
| `/admin/sucursales` | Sucursales y terminales | ✔ | | |
| `/admin/usuarios` | Usuarios | ✔ | | |
| `/inventario`, `/precios` | En construcción | ✔ | | |

Los permisos están en **un solo lugar**, `src/auth/roles.js` (`MODULOS`): de ahí salen el menú, las rutas protegidas (`ProtectedRoute roles={MODULOS.x}`) y los accesos rápidos de Inicio. El API aplica los mismos permisos. Al cargar la app, `refrescarSesion()` (`GET /auth/me`) actualiza el rol guardado, así que un cambio de rol hecho en Usuarios se refleja sin volver a iniciar sesión.

## Cómo funciona

### Sesión

- `POST /auth/login` → se guardan el usuario y el token en `localStorage` (`auth/session.js`).
- `api/axiosClient.js` agrega `Authorization: Bearer <token>`. Si el API responde `401` (token vencido o usuario desactivado), borra la sesión y manda a `/login`.
- "Bloquear" borra la sesión del navegador.

### Terminal POS

1. Al entrar se carga el catálogo de la BD (`GET /catalogo`) y `pos/catalogoPos.js` lo adapta: precio por presentación, sabores del tipo del producto, recargo de cada sabor por presentación, extras del producto y promociones que aplican hoy.
2. `pos/pedido.js` maneja la orden (reducer). Cada línea guarda los ids de la BD (`idPresentacion`, sabores, extras, `idPromocion`).
3. Al cobrar, `registrarVenta` → `POST /ventas`. El API recalcula los precios; si responde `409` (cambiaron precios a media venta), el POS recarga el catálogo, vuelve a tasar la orden y avisa.
4. Tarjeta pide **Débito / Crédito** (métodos 2 y 3 de la BD). Efectivo calcula el cambio con montos sugeridos.

### Caja y corte

- **Abrir caja** (Inicio o Corte de Caja) → `POST /caja/apertura`. Las ventas de ese día cobradas sin caja abierta se integran al turno.
- **Corte de Caja** lee el turno abierto (`GET /caja/turno`) con sus ventas, movimientos y efectivo esperado. Entradas y retiros → `POST /caja/movimientos`.
- **Cerrar** → `POST /caja/cierre` con el conteo de billetes y el cierre de lote de la terminal; el API calcula las diferencias. Se descarga el **ticket Z en PDF** (80 mm, `corte/ticketCorte.js` con jsPDF). El **pre-corte X** se genera con los datos en pantalla.

### Historial

`GET /ventas/resumen` (totales por día) + `GET /caja/cortes` (cuadres) agrupados por semana. "Ver semanas anteriores" solo aparece si hay ventas más antiguas (`hay_anteriores`). El detalle del día usa `GET /ventas?fecha=` y reimprime el corte con `GET /caja/cortes/{id}`.

### Administración

Catálogo (`/admin/...` del API), Sucursales y Usuarios. Cada escritura responde con el listado completo y la pantalla reemplaza su estado. Lo vendido no se borra: se desactiva con el interruptor.

## Tema: colores, modo día / noche

- `src/theme.js` define dos paletas (`PALETAS.claro` y `PALETAS.oscuro`). `COLORS.x` son **variables CSS** (`var(--c-x)`), así que cambiar de modo solo cambia sus valores.
- El modo se guarda en `localStorage` (`conitos.tema`); si no hay elección, se usa el del sistema operativo. Botón luna / sol en la barra.
- La barra de navegación usa el azul de la marca (`COLORS.brand`, `#2A8FD0`; `#1D6FA8` en modo noche).
- Texto sobre el amarillo de la marca: `COLORS.onYellow` (oscuro en ambos modos). Los colores de billetes y de las miniaturas de producto son fijos.
- **Regla:** no escribir colores en hexadecimal en los componentes; usar `COLORS` (y agregar el token a ambas paletas si falta).

## Estructura

```
src/
  App.jsx                 Rutas, permisos por módulo, tema y modo día/noche
  api/axiosClient.js      Cliente HTTP (token, 401 → login, mensajeDeError)
  auth/                   session.js (localStorage) · roles.js (ROLES, MODULOS, puedeEntrar)
  layouts/AppLayout.jsx   Barra de navegación, reloj, modo día/noche, pie
  services/               Una función por endpoint (auth, catálogo, ventas, caja, admin, sucursales, usuarios, checklist)
  pages/
    Inicio.jsx · inicio/          Bienvenida, checklist, apertura de caja, accesos rápidos
    Pos.jsx · pos/                Catálogo, orden, personalización, cobro, venta completada
    CorteCaja.jsx · corte/        Turno, desglose, movimientos, conteo, conciliación, ticket PDF
    Historial.jsx · HistorialDia.jsx · historial/
    Administracion.jsx · Sucursales.jsx · Usuarios.jsx · admin/   Formularios y listas de administración
  components/             Panel, IconTile, ProtectedRoute
  hooks/                  useClock, useModoColor, useAnchoAjustable (ancho del panel de la orden)
  data/
    catalogo.js           Lo que aún no está en BD (descuentos, métodos de pago del POS, denominaciones, IVA) y el
                          catálogo local anterior: el POS ya no lo usa, solo EXTRAS para leer ventas antiguas
    dummy.js              Datos de ejemplo que siguen en pantalla (ver pendientes)
  theme.js                Paletas, COLORS, tema de MUI
```

## Convenciones

- Español en nombres de componentes, funciones y comentarios; código siguiendo el estilo existente.
- Cada pantalla trae sus datos con un servicio de `src/services` y muestra carga, error (con "Reintentar") y vacío.
- Mensajes de error del API con `mensajeDeError(error, 'Texto por defecto')`.
- Editores de administración: panel lateral fijo en escritorio con scroll interno y botón Guardar siempre visible; hoja deslizable en tablet y celular.

## Pendientes del front

La lista completa y priorizada está en `docs/PENDIENTES.md` del API. Lo que toca directamente al front:

- **Datos de ejemplo en pantalla** (`data/dummy.js`): terminal y sucursal del encabezado y del ticket, etiqueta "Apertura Requerida", turno asignado, promo de la tarde, top ventas de ayer, protocolo, "Corte anterior", lotes pendientes y textos decorativos del login.
- **Descuentos** fijos en `data/catalogo.js` (no hay catálogo en BD).
- **Folio de orden** desde un contador local que se reinicia al recargar.
- **Órdenes en espera** y pre-cuenta solo en el navegador / simuladas.
- **Multi-sucursal:** el encabezado y las ventas no saben en qué sucursal o terminal está el equipo.
- **Recepción de Inventario** y **Consulta de Precios** sin construir; los roles Productor y Compras solo ven Inicio.
- Llaves viejas en `localStorage` y copia local de ventas usada solo para "Más vendidos".
- Bundle mayor a 500 kB: dividir por rutas.
- Sin pruebas automáticas.
