# SumercéMarket

Marketplace local que permite a cada vendedor tener su propia **mini página web profesional** dentro de la plataforma, conectada a sus ofertas activas.

## ✨ Página del vendedor (`/seller/:slug`) — Bloque 3 Premium

`/seller/:slug` ya no es una ficha básica: es una **landing tipo Wix** que cada vendedor puede presentar como "su página web".

### Qué incluye

- **Hero premium** con portada de fondo, overlay degradado, logo circular, nombre grande, frase principal y ubicación.
- **Botones de acción**: WhatsApp, Copiar link y Compartir tienda (usa `navigator.share` cuando está disponible).
- **Secciones**:
  - Sobre el negocio
  - Horario
  - Ubicación (con link a Google Maps)
  - Ofertas destacadas (máx. 3)
  - Todas las ofertas
- **Color principal** del negocio aplicado a títulos, precios y botones (`business_primary_color`).
- **Estado vacío bonito** cuando no hay ofertas activas.
- **Diseño responsive** optimizado para celular, tablet y escritorio.

### Campos leídos de `profiles`

`business_template`, `business_headline`, `business_about`, `business_schedule`,
`business_primary_color`, `business_name`, `business_logo_url`, `business_cover_url`,
`business_whatsapp`, `business_address`, `business_department`, `business_city`.

### Ofertas

Se consulta la tabla `offers` filtrando por `seller_id = profile.id` y `status = 'active'`, ordenadas por fecha de creación. Las primeras 3 se muestran como **destacadas**, el resto en la sección **Todas las ofertas**.

## 🎨 Plantillas visuales por rubro (`business_template`)

Cada plantilla cambia tipografía, fondo, gradiente del hero, radios y color base sugerido:

| Plantilla   | Estilo                              | Pensado para           |
|-------------|-------------------------------------|------------------------|
| `store`     | Limpio, azul, neutro                | Tiendas generales      |
| `fashion`   | Editorial, serif, rosa              | Moda y ropa            |
| `beauty`    | Suave, magenta, redondeado          | Belleza y cosmética    |
| `health`    | Sobrio, celeste, profesional        | Salud y bienestar      |
| `gym`       | Oscuro, naranja, energético         | Fitness y gimnasios    |
| `vehicles`  | Premium, gris oscuro, Montserrat    | Vehículos              |
| `food`      | Cálido, rojo, redondeado            | Comida y restaurantes  |
| `services`  | Confiable, verde azulado            | Servicios              |

Si `business_template` está vacío o no coincide, se usa `store` como predeterminado.

## 🧪 Cómo probar `/seller/:slug`

1. Inicia el frontend:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

2. Asegúrate de que tu perfil en `profiles` tiene:
   - `slug` definido (ej: `mi-tienda`)
   - `business_name`, `business_headline`, `business_about`
   - `business_logo_url` y `business_cover_url` (URLs públicas)
   - `business_primary_color` (ej: `#db2777`)
   - `business_template` (ej: `fashion`)
   - `business_whatsapp` (número con indicativo, ej: `573001234567`)
   - `business_address`, `business_city`, `business_department`
   - `business_schedule` (texto multilínea)

3. Crea una o más filas en `offers` con `seller_id = <id del perfil>` y `status = 'active'`.

4. Abre en el navegador:

   ```
   http://localhost:5173/seller/mi-tienda
   ```

5. Verifica:
   - ✅ Hero con portada, logo y nombre.
   - ✅ Botones WhatsApp / Copiar link / Compartir.
   - ✅ Hasta 3 ofertas en "Destacadas" y el resto en "Todas las ofertas".
   - ✅ Estado vacío si no hay ofertas activas.
   - ✅ Cambio visual al modificar `business_template`.
   - ✅ Responsive en móvil, tablet y escritorio.

## 🔒 Qué NO se modificó

- Login y autenticación.
- Cliente de Supabase ni configuración.
- `schema.sql`.
- Backend.
- No se usan workflows ni GitHub Actions.

## 🚀 Stack

- **Frontend**: React + Vite + React Router
- **Datos**: Supabase (acceso directo desde el cliente)
- **Auth**: Supabase Auth

## 📁 Estructura relevante

```
frontend/
  src/
    pages/
      SellerPage.jsx   ← Mini sitio web premium del vendedor
    services/
      supabase.js
```
