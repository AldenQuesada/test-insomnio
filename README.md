# Test del Insomnio · Instituto AQS

Página pública del test de insomnio. Es estática: HTML, CSS y JavaScript sin
dependencias ni build.

El contenido no vive aquí. Las preguntas, las escalas, los textos de cada
idioma y la lista de países están en Supabase, y la página los lee al abrir.
Cambiar una pregunta es un `UPDATE`, no un deploy.

## Qué hay en cada archivo

- `index.html` — la página entera
- `config.js` — URL del proyecto y clave anónima

## Sobre la clave del archivo `config.js`

Es la clave **anónima**, pública por diseño: vive en el navegador de quien
responde. No da acceso a nada: las políticas de la base impiden leer leads,
respuestas y eventos. Solo permite leer el test activo y llamar a la función
que registra la respuesta. Está verificado.
