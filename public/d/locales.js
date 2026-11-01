// El idioma inicial es español. No se muestra un selector para idiomas incompletos.
// Los identificadores de rutas, lotes y casas permanecen estables al traducir.
export const localeConfig={default:'es',supported:['es','en','pt'],published:['es']};
export const messages={
 es:{houses:{utah:{name:'Utah',desc:'Tres dormitorios y un estudio/anexo para explorar otra manera de distribuir el día.'},bell:{name:'Bell',desc:'Tres dormitorios alrededor de un espacio común. Una planta más compacta.'}},routes:{inicio:'Inicio',lotes:'Los lotes',casas:'Las casas',entorno:'Ocala',consulta:'Mi consulta'}},
 en:{houses:{utah:{name:'Utah',desc:'Three bedrooms and a studio/annex to explore another way to organize the day.'},bell:{name:'Bell',desc:'Three bedrooms around a shared living space. A more compact single-story plan.'}},routes:{inicio:'Home',lotes:'The lots',casas:'The homes',entorno:'Ocala',consulta:'My inquiry'}},
 pt:{houses:{utah:{name:'Utah',desc:'Três quartos e um estúdio/anexo para explorar outra forma de organizar o dia.'},bell:{name:'Bell',desc:'Três quartos em torno de um espaço comum. Uma planta térrea mais compacta.'}},routes:{inicio:'Início',lotes:'Os lotes',casas:'As casas',entorno:'Ocala',consulta:'Minha consulta'}}
};
export const content=messages[localeConfig.default];
