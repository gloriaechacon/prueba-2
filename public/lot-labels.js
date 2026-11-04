// Public numbers are separate from stable parcel/media IDs.
(()=>{
 const order=[1,14,5,6,7,9];
 const old=id=>Number(String(id).replace('RP-',''));
 const number=id=>{const i=order.indexOf(old(id));return i<0?null:i+1};
 const language=()=>window.rpcI18n?.language||new URLSearchParams(location.search).get('lang')||'en';
 const label=id=>{const n=number(id),lang=language();return n?({en:'Lot',es:'Lote',pt:'Lote'}[lang]||'Lot')+' '+String(n).padStart(2,'0'):({en:'Sold lot',es:'Lote vendido',pt:'Lote vendido'}[lang]||'Sold lot')};
 const stable=n=>'RP-'+String(n).padStart(2,'0');
 // Numeric URLs refer to the public numbering; old RP IDs remain valid bookmarks.
 const fromURL=value=>{
  if(/^RP-\d{2}$/i.test(value||''))return String(value).toUpperCase();
  if(/^[0-9]+$/.test(value||'')&&order[Number(value)-1])return stable(order[Number(value)-1]);
  const sold=/^sold-(\d{2})$/.exec(value||'');
  return sold&&!number(stable(Number(sold[1])))?stable(Number(sold[1])):null;
 };
 const toURL=id=>number(id)?String(number(id)):'sold-'+String(old(id)).padStart(2,'0');
 window.rpcLots={order,number,label,fromURL,toURL,available:id=>number(id)!==null,rank:id=>number(id)||100+old(id)};
})();
