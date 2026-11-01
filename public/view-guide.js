(() => {
 const views={
  inicio:['Portada','Presentar el lugar y ofrecer una entrada clara a los lotes.','Video a pantalla completa, título expresivo y navegación que acompaña el recorrido.','Texto y video separados: primero se entiende la oferta, después se explora.'],
  'project-intro-title':['El proyecto','Explicar qué es Rainbow Park antes de mostrar sus herramientas.','Un título editorial junto a una descripción breve, con espacio para leer.','Introducción tipográfica en dos columnas, entre el video y el selector de parcelas.'],
  lotes:['Lotes','Elegir una parcela sin tener que recordar su número.','Una guía explica la vista aérea, la selección del lote y cómo probar una vivienda.','Selector y ficha del lote sobre el explorador aéreo 3D, con controles explícitos.'],
  entorno:['Entorno','Entender la ubicación y los destinos cercanos sin confundirlos con amenidades.','Una pausa de color, título expresivo y fotografía del destino seleccionado.','Fotografías de tres destinos en una composición asimétrica, con alturas y posiciones distintas.'],
  inversion:['Inversión','Dar contexto breve y una entrada clara a la información detallada.','Una ampliación industrial de US$23.5M y 100 empleos previstos como entrada al contexto regional. Los proyectos y las fuentes abren en su propia página.','Una pausa de contraste con los datos principales y acceso a la página completa de inversión.'],
  viviendas:['Viviendas','Comparar Utah y Bell y explorar sus modelos antes de consultar.','El modelo 3D se presenta sobre una superficie de contraste suave.','Utah y Bell se presentan alternando fotografía y descripción. El modelo 3D también se muestra directamente en la página.'],
  contacto:['Contacto','Preparar una consulta sin obligar a elegir lote o vivienda.','Cierre con fondo intenso y formulario claro para dar protagonismo al siguiente paso.','Una invitación a conversar junto a un formulario compacto y oscuro.']
 };
 const section=document.getElementById('review-section');
 const guide=document.createElement('section');guide.className='view-guide';guide.setAttribute('aria-label','Propuesta de esta vista');
 document.querySelector('.description').after(guide);
 function update(){
  const key=section.value, info=views[key]||views.inicio, version=document.querySelector('[data-version][aria-pressed="true"]').dataset.version;
  guide.replaceChildren();
  const heading=document.createElement('h2');heading.textContent=info[0];
  const purpose=document.createElement('p');purpose.textContent=info[1];
  const design=document.createElement('p');design.className='view-direction';design.textContent=version==='original'?'Referencia actual para comparar con las propuestas.':version==='d'?'Recorrido visual por destinos, terrenos, casas 3D y dossier por capítulos. Conserva el diseño de la propuesta del otro chat.':version==='c'?'Portada editorial de A y páginas independientes: explorador aéreo, viviendas 3D, destinos fotográficos e inversión por pasos.':info[version==='a'?2:3];
  const next=document.createElement('button');next.type='button';const keys=Object.keys(views),index=keys.indexOf(key);next.textContent=index===keys.length-1?'Volver a la portada':'Siguiente vista';
  next.addEventListener('click',()=>{section.value=keys[(index+1)%keys.length];section.dispatchEvent(new Event('change'));});
  const copy=document.createElement('div');copy.append(heading,purpose,design);guide.append(copy,next);
 }
 section.addEventListener('change',update);section.addEventListener('review-page',update);document.querySelectorAll('[data-version]').forEach(b=>b.addEventListener('click',update));update();
})();
