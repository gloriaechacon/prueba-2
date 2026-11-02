// Group overlapping screen markers instead of moving them away from their locations.
export function clusterPins(points) {
 const groups=points.map(p=>({x:p.x,y:p.y,points:[p]}));
 let merged=true;
 while(merged){
  merged=false;
  outer:for(let i=0;i<groups.length;i++)for(let j=i+1;j<groups.length;j++){
   const a=groups[i],b=groups[j];
   const widthA=a.points.length>1?104:44,widthB=b.points.length>1?104:44;
   if(Math.abs(a.x-b.x)>=(widthA+widthB)/2+8||Math.abs(a.y-b.y)>=56)continue;
   const all=[...a.points,...b.points];
   groups[i]={x:all.reduce((sum,p)=>sum+p.x,0)/all.length,y:all.reduce((sum,p)=>sum+p.y,0)/all.length,points:all};
   groups.splice(j,1);merged=true;break outer;
  }
 }
 return groups;
}
