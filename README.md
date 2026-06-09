# Sumercé Market

Marketplace donde cada vendedor obtiene su **mini web pública premium** con URL personalizada, animaciones suaves y secciones de servicios adaptadas al tipo de negocio.

---

## ✨ Novedades

### Web pública del vendedor (`/seller/:slug`)
Cada vendedor cuenta con un sitio profesional que incluye:

- **Hero premium** con portada (`business_cover_url`), logo (`business_logo_url`), titular y CTA a WhatsApp (`business_whatsapp`).
- **Sobre el negocio** (`business_about` o `business_description`).
- **Lo que ofrecemos**: tarjetas de servicios generadas automáticamente según `business_template` (`fashion`, `beauty`, `health`, `gym`, `vehicles`, `food`, `services`, `store`) más los servicios personalizados que el vendedor agregue en `business_services`.
- **Horario** de atención (`business_schedule`).
- **Ubicación** (`business_address`, `business_city`, `business_department`) con enlace directo a Google Maps.
- **WhatsApp** como medio de contacto principal.
- **Ofertas destacadas** (top 3).
- **Todas las ofertas activas** (`status = active`).
- **Llamado final a WhatsApp**.
- **Estado vacío** elegante cuando aún no hay ofertas.
- Animaciones suaves: `fade`, `slide`, `hover` en tarjetas y botones.
- Color principal tomado de `business_primary_color`.
- Totalmente responsive: móvil, tablet y escritorio.

### Perfil del negocio (`/business-profile`)
- **Portada + logo** estilo Facebook con subida directa al bucket **`business-assets`** de Supabase Storage (no se piden URLs manuales).
- **Generación automática de `business_slug`** a partir del nombre del negocio.
- **URL pública en vivo**: `/seller/{business_slug}` se muestra mientras se edita.
- **Validación de unicidad del slug** contra la tabla `profiles` (debounce 400 ms).
- Botones rápidos:
  - 🌐 **Ver mi web** (abre el sitio público).
  - 🔗 **Copiar link**.
  - 📱 **Compartir por WhatsApp**.
- Campos: nombre, slug, titular, descripción, sobre el negocio, plantilla, color principal, WhatsApp, dirección, departamento, ciudad, horario y servicios.

---

## 🧱 Stack

- **Frontend**: React + Vite + React Router.
- **Backend de datos**: Supabase (Auth, Postgres, Storage).
- Sin GitHub Actions, sin workflows, sin backend propio.

---

## 📂 Estructura relevante

```
frontend/
├── index.html
├── package.json
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── pages/
    │   ├── BusinessProfile.jsx   ← perfil + URL pública + acciones
    │   └── SellerPage.jsx        ← mini web premium del vendedor
    └── services/
        └── supabaseClient.js

supabase/
├── schema.sql
├── add-archived-status.sql
├── business-profile.sql      ← columnas base del negocio
├── business-templates.sql    ← plantillas + color + headline + about + schedule
└── business-services.sql     ← columna business_services
```

---

## ⚙️ Configuración

Crea `frontend/.env` (ver `.env.example`) con:

```
VITE_SUPABASE_URL=tu-url-de-supabase
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

### Supabase Storage

Crea un bucket público llamado **`business-assets`** para almacenar portadas y logos:

1. Supabase → Storage → New bucket → `business-assets` → Public.
2. Política de subida: permite `INSERT` y `UPDATE` al usuario autenticado sobre archivos cuyo path comience con su `auth.uid()`.

> ⚠️ El nombre del bucket debe ser exactamente `business-assets`. El frontend usa ese nombre para subir las imágenes y obtener la URL pública.

### Scripts SQL a ejecutar en orden

En Supabase → SQL Editor:

1. `supabase/business-profile.sql` → columnas base (`business_name`, `business_slug`, `business_description`, `business_logo_url`, `business_cover_url`, `business_whatsapp`, `business_address`, `business_department`, `business_city`) + unicidad del slug.
2. `supabase/business-templates.sql` → `business_template`, `business_headline`, `business_about`, `business_schedule`, `business_primary_color`.
3. `supabase/business-services.sql` → `business_services` (NUEVO).

Todos son idempotentes y no tocan el login, el `schema.sql`, ni las políticas RLS.

### Tabla `profiles` (campos usados por el frontend)

```
id                       uuid PK (= auth.users.id)
business_name            text
business_slug            text UNIQUE
business_description     text
business_headline        text
business_about           text
business_template        text   -- fashion | beauty | health | gym | vehicles | food | services | store
business_primary_color   text
business_whatsapp        text   -- con código de país, ej: 573001234567
business_address         text
business_department      text
business_city            text
business_schedule        text
business_services        text   -- separados por coma
business_logo_url        text
business_cover_url       text
updated_at               timestamptz
```

### Tabla `offers` (campos usados)

```
id, user_id, title, description, image_url, price, old_price, status, created_at
```

Solo se muestran las ofertas con `status = 'active'`.

---

## ▶️ Cómo probar

```bash
cd frontend
npm install
npm run dev
```

Luego:

1. Inicia sesión como vendedor.
2. Ve a **Perfil del negocio** (`/business-profile`).
3. Escribe el **nombre del negocio** → verás cómo se genera el **slug** y la **URL pública** automáticamente.
4. Sube **portada** y **logo** (se guardan en el bucket `business-assets` y se reflejan en `business_cover_url` y `business_logo_url`).
5. Completa titular, descripción, sobre el negocio, plantilla, color, WhatsApp, dirección, departamento, ciudad, horario y servicios.
6. Guarda los cambios.
7. Usa los botones:
   - **Ver mi web** → abre `/seller/{tu-slug}`.
   - **Copiar link** → copia la URL al portapapeles.
   - **Compartir por WhatsApp** → abre WhatsApp con el mensaje listo.
8. En la web pública verifica:
   - Hero con portada y logo, titular y CTA a WhatsApp.
   - Sobre nosotros, servicios (cambian según `business_template`), horario, ubicación (dirección + ciudad + departamento), WhatsApp, ofertas destacadas, todas las ofertas y CTA final.
   - Animaciones suaves y diseño responsive en móvil / tablet / escritorio.
   - Estado vacío cuando aún no hay ofertas activas.

---

## 🛡️ Notas

- No se incluyen secretos reales; usa `.env.example` como guía.
- No hay workflows ni GitHub Actions.
- No se modificó el sistema de login ni el `schema.sql`.
- Todo el contenido es texto plano, sin Base64.
