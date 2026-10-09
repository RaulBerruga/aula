# Aula · organizador universitario (versión Netlify + Supabase)

Una sola página (`index.html`) con cuentas, sincronización entre dispositivos e instalación como app en el móvil.

## 1. Supabase (proyecto `aula`)

1. **SQL Editor → New query**: pega el contenido de `supabase/schema.sql` y pulsa **Run**.
   Crea la tabla `aula_state` (una fila por usuario) con seguridad RLS: cada persona solo puede leer y escribir lo suyo.
2. **Authentication → Providers → Email**: déjalo activado. Si no quieres obligar a confirmar el correo, desactiva *Confirm email*.
   (Opcional) activa **Google** si quieres el botón "Continuar con Google".
3. **Authentication → URL Configuration**: en *Site URL* pon la dirección de Netlify (por ejemplo `https://aula-nextwebstudio.netlify.app`) y añádela también en *Redirect URLs*.
4. **Project Settings → API**: copia **Project URL** y **anon public key**.

## 2. Pegar las claves en la app

Abre `index.html` y busca el bloque *Configuración* (cerca del inicio del `<script>`):

```js
const SUPABASE_URL='https://TU-PROYECTO.supabase.co';
const SUPABASE_ANON_KEY='TU_ANON_KEY';
```

Sustituye los dos valores por los de tu proyecto. La clave `anon` es pública: puede ir en el código.

## 3. Netlify

Igual que con Hierro: crea un repositorio en GitHub con esta carpeta, enlázalo en Netlify y despliega desde `main`.
`netlify.toml` ya trae la configuración (carpeta raíz como publish y cabeceras para el service worker).
No hay paso de build: son archivos estáticos.

## 4. (Opcional) Sugerencia de asignaturas con IA

Si quieres el botón "Sugerir con IA" dentro del asistente de asignaturas, despliega la Edge Function:

```bash
supabase login
supabase link --project-ref TU_REF
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...   # tu clave de API
supabase functions deploy sugerir
```

Sin la función, ese botón avisa de que no está disponible y ofrece pegar la lista. El resto de la app no depende de la IA.
La función solo acepta peticiones de usuarios con sesión iniciada y usa por defecto un modelo rápido y barato (`AI_MODEL` lo cambia).

## 5. Instalar en el móvil

Al abrir la web en Netlify, el navegador ofrece "Añadir a pantalla de inicio" (Android: menú ⋮; iPhone: Compartir → Añadir a pantalla de inicio).
Se abre a pantalla completa con el icono de la carpeta `icons/`.

## Actualizaciones

Cada vez que cambies `index.html` y lo subas a `main`, Netlify publica solo. Si cambias el service worker o los iconos, sube `VERSION` en `sw.js` para que los usuarios reciban la nueva caché.

## Estructura

```
index.html                       app completa
manifest.webmanifest             datos de la app instalable
sw.js                            service worker (funciona sin conexión)
icons/                           iconos
netlify.toml                     configuración de Netlify
supabase/schema.sql              tabla y políticas RLS
supabase/functions/sugerir/      Edge Function de IA (opcional)
```
