# My English Practice: cómo instalarla en tu Android (gratis)

La app necesita estar publicada en internet con HTTPS para que funcionen el micrófono y la instalación. Lo haremos gratis con GitHub Pages, todo desde el celular.

## 1. Descomprimir
Abre el archivo zip con la app "Files" (Archivos) de Google y toca "Extraer". Quedará una carpeta con todos los archivos de la app.

## 2. Publicar en GitHub Pages
1. Entra a https://github.com en Chrome y crea una cuenta gratis.
2. Toca "+" → "New repository". Nombre: `mill-english`. Déjalo en "Public" y toca "Create repository".
3. Toca "uploading an existing file" y selecciona TODOS los archivos de la carpeta (no la carpeta, los archivos). Toca "Commit changes".
4. Ve a "Settings" → "Pages". En "Branch" elige `main` y carpeta `/ (root)`. Toca "Save".
5. Espera 1 a 3 minutos. Tu app quedará en: `https://TU-USUARIO.github.io/mill-english/`

(Si tienes computador, otra opción es Netlify: crea cuenta gratis en netlify.com y arrastra la carpeta a "Deploy manually".)

## 3. Instalar en el teléfono
Abre tu enlace en Chrome → menú ⋮ → "Instalar app" o "Agregar a pantalla principal". Quedará como una app más, con su ícono.

## 4. Activar la IA gratis (para conversar)
1. Entra a https://aistudio.google.com/apikey con tu cuenta de Google.
2. Toca "Create API key" y cópiala.
3. En la app: ⚙︎ Ajustes → pega la clave → "Buscar modelos" → "Probar conexión".

El dictado y el deletreo funcionan sin clave y sin internet (el reconocimiento de voz sí necesita internet).

## Consejos
- La primera vez, Chrome te pedirá permiso para el micrófono: acepta.
- En Ajustes puedes elegir la voz en inglés y la velocidad.
- Si te sale "límite gratuito", espera un minuto: el plan gratis tiene límites por minuto y por día.
- En el plan gratuito, Google puede usar las conversaciones para mejorar sus productos: no escribas información confidencial de la empresa.
- Exporta un respaldo de tu progreso de vez en cuando (Ajustes → Exportar respaldo).

## Usuarios y seguimiento del equipo
Toca el círculo con tus iniciales (arriba) para ponerle tu nombre a tu usuario, crear usuarios para compañeros o cambiar de usuario. Para ver el avance de todo el equipo desde sus propios teléfonos, sigue las instrucciones del archivo EQUIPO.md.

## Temas de práctica
En Inicio eliges el tema: Aserradero, Bomberos y emergencias o Fitness. Cada tema tiene sus propios personajes, conversaciones, dictados, vocabulario y listening. Tu progreso, errores y tarjetas se mantienen al cambiar de tema.

## Artículos en PDF
En Listening → "Mis artículos" puedes subir un PDF (idealmente de pocas páginas). La IA lo resume y extrae vocabulario; con él puedes crear conversaciones para escuchar, conversar con un personaje sobre el artículo o guardar el vocabulario en tus tarjetas. El PDF no se guarda en el teléfono, solo su resumen.

## Si el ícono o el nombre no cambian
Android actualiza el ícono de las apps instaladas por su cuenta y puede tardar hasta un día. Si quieres verlo de inmediato, desinstala el ícono antiguo y vuelve a instalar desde Chrome (tu progreso se mantiene).

## Respaldo gratuito con Groq
Si Gemini llega a su límite, la app sigue funcionando con Groq:
1. Entra a https://console.groq.com/keys, crea una cuenta gratis y toca "Create API Key".
2. En la app: ⚙︎ Ajustes → "Respaldo gratuito: Groq" → pega la clave → "Buscar modelos de Groq" → "Probar Groq".
3. Deja marcada la opción "Transcribir mi voz con Groq" para ahorrar el límite de Gemini.
Con Groq funcionan las conversaciones, el tutor, el listening con IA, el dictado con IA y los artículos PDF con texto (los PDF escaneados solo los lee Gemini).
