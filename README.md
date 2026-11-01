# Rainbow Park — propuesta unificada

La entrada `/` es ahora una sola propuesta: home Editorial, separación cromática inspirada en Salón, navegación a páginas independientes y estudio de viviendas de Experiencia con estilo editorial.

## Páginas
- `/`: portada con video y recorrido completo con scroll.
- `/proyecto/lotes/`: explorador aéreo y datos por lote.
- `/proyecto/entorno/`: destinos y contexto regional.
- `/proyecto/inversion/`: información ampliada, proyectos, datos y fuentes.
- `/proyecto/viviendas/`: Utah y Bell en 3D, comparación y planos.
- `/proyecto/contacto/`: formulario de consulta en modo demostración; correo destinatario pendiente, sin envío real.

Las cuatro propuestas anteriores permanecen en `/comparar/` como archivo de revisión.

## Vercel
Preset Other, directorio raíz del repositorio. `vercel.json` configura `public` como salida, sin instalación ni compilación.

## Implementación
`public/proyecto/final.css` unifica tipografía, color y navegación. `final.js` controla el menú y las apariciones repetibles con desenfoque al entrar/salir del encuadre. Respeta movimiento reducido y foco de teclado. Los mapas y modelos no dependen de las animaciones para usarse. Las páginas detalladas reutilizan los archivos existentes de geografía, fuentes, fotografías, video y modelos GLB.

Esta revisión no ejecuta una publicación de Vercel.
