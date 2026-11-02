# Idiomas de la propuesta final

Inglés es el idioma predeterminado de una visita sin preferencia guardada. El selector del header permite English, Português (Brasil) y Español.

Prioridad: parámetro `?lang=en|pt|es`, elección guardada en `rpc-language`, inglés. Los enlaces internos conservan el idioma; los visores embebidos reciben la misma elección sin recargar al cambiarla.

`public/i18n.js` reutiliza el catálogo base `public/locales/catalog.json` y las traducciones de la versión final en `public/locales/final.json`. Conserva los valores internos de los selectores y el texto escrito por el visitante. Los textos creados al seleccionar un lote, destino o vivienda se traducen mediante observación del DOM. No usa servicios externos de traducción.

Los PDF, planos originales, nombres propios y fuentes externas conservan su idioma original. El formulario sigue siendo una demostración, con destinatario pendiente.

Al incorporar contenido nuevo, añadir frases completas en español con traducciones al inglés y portugués al catálogo final. Probar las tres opciones, la navegación y los estados dinámicos; evitar depender de traducciones de palabras sueltas para párrafos nuevos.
