# Guía de deploy — Propiteq UX Writer Agent
## Vercel · Paso a paso desde cero

---

## Qué vas a tener al final

Una URL pública (ej: `propiteq-uxwriter.vercel.app`) donde el equipo de diseño y marketing puede usar el agente directamente desde el browser, sin instalar nada y sin ver nunca la API key.

---

## Estructura de archivos

Antes de empezar, asegúrate de tener esta estructura:

```
propiteq-ux-writer/
├── index.html          ← el frontend del agente
├── context.js          ← los prompts modulares (referencia, no se importa directo)
├── vercel.json         ← configuración de Vercel
└── api/
    └── generate.js     ← el backend serverless (aquí vive la API key)
```

---

## PASO 1 — Crear la carpeta del proyecto

En tu computador, crea una carpeta llamada `propiteq-ux-writer` y pon adentro los 4 archivos que te entregué:
- `index.html`
- `context.js`
- `vercel.json`
- `api/generate.js` (crea la subcarpeta `api` primero)

---

## PASO 2 — Crear cuenta en Vercel

1. Ve a **vercel.com**
2. Haz clic en "Sign Up"
3. Elige "Continue with GitHub" (necesitarás una cuenta de GitHub — es gratis)
4. Si no tienes GitHub, créala en **github.com** primero (toma 2 minutos)

---

## PASO 3 — Subir el proyecto a GitHub

1. Ve a **github.com** y haz clic en el "+" arriba a la derecha → "New repository"
2. Nómbralo `propiteq-ux-writer`
3. Déjalo en **Private** (para que el código no sea público)
4. Haz clic en "Create repository"
5. En la página siguiente, GitHub te da instrucciones. Sigue las de "upload an existing file":
   - Arrastra todos los archivos de tu carpeta al área de upload
   - Importante: sube también la carpeta `api` con `generate.js` adentro
   - Haz clic en "Commit changes"

---

## PASO 4 — Conectar GitHub con Vercel

1. Ve a **vercel.com** y haz login
2. Haz clic en "Add New Project"
3. Selecciona "Import Git Repository"
4. Elige el repositorio `propiteq-ux-writer` que acabas de crear
5. Vercel va a detectar automáticamente la configuración
6. **NO hagas clic en Deploy todavía** — primero hay que agregar la API key

---

## PASO 5 — Agregar la API key como variable de entorno

Este es el paso más importante — aquí es donde la key queda segura en el servidor.

1. En la pantalla de configuración del proyecto en Vercel, busca la sección **"Environment Variables"**
2. Haz clic en "Add"
3. En el campo **Name** escribe exactamente: `ANTHROPIC_API_KEY`
4. En el campo **Value** pega tu API key (la encuentras en **console.anthropic.com** → API Keys)
5. Deja seleccionados los tres entornos: Production, Preview, Development
6. Haz clic en "Save"

> ⚠️ La API key nunca debe ir en ningún archivo de código. Solo aquí.

---

## PASO 6 — Deploy

1. Ahora sí haz clic en **"Deploy"**
2. Vercel va a construir y desplegar el proyecto (toma 30–60 segundos)
3. Cuando termine, verás una pantalla de éxito con una URL del tipo:
   `https://propiteq-ux-writer-xxxx.vercel.app`

---

## PASO 7 — Probar que funciona

1. Abre la URL en el browser
2. Selecciona un usuario (ej: Corredor), una etapa (ej: Onboarding) y un formato (ej: UI Copy)
3. Escribe algo en el campo de texto (ej: "Mensaje de bienvenida al completar el perfil")
4. Haz clic en "Generar copy"
5. Si ves texto generado → todo funciona ✓

Si ves un error, revisa el Paso 5 (la API key).

---

## PASO 8 — Compartir con el equipo

Comparte la URL con el equipo de diseño y marketing. Pueden abrirla directamente en el browser sin instalar nada.

Si quieres un dominio propio (ej: `uxwriter.propiteq.com`):
1. Ve al dashboard de Vercel → tu proyecto → "Settings" → "Domains"
2. Agrega el dominio y sigue las instrucciones de DNS

---

## Cómo hacer cambios en el futuro

Cuando quieras actualizar el contexto o el diseño:
1. Edita los archivos en tu computador
2. Sube los cambios a GitHub (arrastra los archivos actualizados)
3. Vercel detecta el cambio y hace redeploy automático en ~30 segundos

---

## Preguntas frecuentes

**¿Cuánto cuesta?**
Vercel tiene un plan gratuito (Hobby) que es más que suficiente para uso interno del equipo. La API de Anthropic cobra por uso — para un equipo pequeño el costo mensual es mínimo (aproximadamente $0.003 por generación con Claude Sonnet).

**¿Es seguro?**
Sí. La API key nunca sale del servidor de Vercel. El frontend solo habla con `/api/generate` que es tu propio endpoint.

**¿Puede verlo alguien externo?**
La URL es pública por defecto (cualquiera con el link puede usarla). Si quieres restringir el acceso, Vercel permite agregar autenticación básica en el plan Pro, o puedes agregar un password simple en el código si lo necesitas.

**¿Cómo agrego nuevas personas o etapas en el futuro?**
Edita el archivo `context.js`, agrega el nuevo bloque en `PERSONAS` o `JOURNEYS`, y actualiza el `index.html` para agregar la tarjeta o pill correspondiente. Luego sube los cambios a GitHub.
