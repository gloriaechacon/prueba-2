# Applied inside build-bell-reference.py, before UV packing and baking.
# All positions use the existing Bell architectural axes.
white=mat('Bell white satin doors','ffffff',.48)
concrete=mat('Bell light garage concrete','b4b3af',.85,True)
for o in list(bpy.context.scene.objects):
 if o.type!='MESH':continue
 if o.name=='Bell garage concrete' or o.name=='04 Piso garaje':assign(o,concrete)
 if o.name.startswith('Bell Utah style'):assign(o,white)
 if o.name.startswith('Garaje') and any('panel' in m.name.lower() or 'acero pintado' in m.name.lower() for m in o.data.materials):assign(o,white)
 if o.name.startswith('Bell · closet dormitorio'):bpy.data.objects.remove(o,do_unlink=True)
# Toilet: tank formerly faced +Y; place its back against the west partition.
o=bpy.data.objects['68 Baño principal']
for v in o.data.vertices:
 x,y,z=v.co
 if 2.30<x<2.73 and 1.27<y<1.81 and z<.70:
  v.co=(2.43-(y-1.54),1.54+(x-2.53),z)
# Two chairs on each side, with their backs directed away from the table.
for o in bpy.context.scene.objects:
 if o.type!='MESH' or not o.name.startswith('Bell dining Utah'):continue
 pts=[o.matrix_world@v.co for v in o.data.vertices]
 cx=(min(p.x for p in pts)+max(p.x for p in pts))/2;cy=(min(p.y for p in pts)+max(p.y for p in pts))/2
 backs=[p for p in pts if p.z>.72]
 back=Vector((sum(p.x for p in backs)/len(backs)-cx,sum(p.y for p in backs)/len(backs)-cy))
 angle=(math.pi if cx<-1.53 else 0)-math.atan2(back.y,back.x)
 for v in o.data.vertices:
  q=o.matrix_world@v.co;x=q.x-cx;y=q.y-cy;v.co=(cx+math.cos(angle)*x-math.sin(angle)*y,cy+math.sin(angle)*x+math.cos(angle)*y,q.z)
 o.matrix_world.identity()
# Replace the damaged imported range with closed solids and the correct front.
for o in list(bpy.context.scene.objects):
 if o.name=='Bell range and oven' or o.name.startswith(('Bell stove left cabinet','Bell stove right cabinet')):bpy.data.objects.remove(o,do_unlink=True)
steel=mat('Bell stove brushed steel','b4b6b7',.35);glassblack=mat('Bell stove black glass','242624',.24)
stone=mat('Bell stove white counter','ede9e0',.3)
for x0,x1 in [(.20,.505),(1.295,2.02)]:
 box('Bell completed range cabinet',((x0+x1)/2,2.56,.45),(x1-x0,.66,.86),joinery,.008)
 box('Bell range counter',((x0+x1)/2,2.57,.89),(x1-x0+.01,.70,.045),stone,.008)
 box('Bell range cabinet front',((x0+x1)/2,2.905,.49),(x1-x0-.025,.025,.69),joinery,.01)
 box('Bell cabinet handle',((x0+x1)/2,2.93,.73),(.13,.025,.015),black,.004)
box('Bell complete oven body',(.90,2.56,.46),(.77,.67,.88),steel,.018)
box('Bell oven door',(.90,2.912,.43),(.70,.035,.63),steel,.018)
box('Bell oven glass',(.90,2.936,.42),(.57,.012,.43),glassblack,.025)
box('Bell oven handle',(.90,2.972,.76),(.60,.035,.035),black,.008)
box('Bell cooktop',(.90,2.56,.917),(.77,.65,.028),glassblack,.015)
for x in [.70,1.10]:
 for y in [2.39,2.73]:cyl('Bell cooktop ring',(x,y,.937),.11,.008,steel)
box('Bell range white splashback',(.90,2.225,1.04),(.78,.03,.25),stone,.008)
# Bring over only the original Utah car and folding closet door geometry.
before=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/utah/utah-plan-v4.glb'))
new=[o for o in bpy.data.objects if o not in before]
car=next(o for o in new if o.name.startswith('Auto (Mercedes-Benz GLA)'))
for v in car.data.vertices:
 x,y,z=car.matrix_world@v.co;v.co=(x+5.814+5.60,y+3.586-.80,z+.19)
car.matrix_world.identity();car.name='Bell garage / Utah car'
for m in car.data.materials:
 if 'CarPaint' in m.name:
  bs=m.node_tree.nodes.get('Principled BSDF')
  for link in list(bs.inputs['Base Color'].links):m.node_tree.links.remove(link)
  bs.inputs['Base Color'].default_value=(.88,.88,.86,1);bs.inputs['Metallic'].default_value=.12;bs.inputs['Roughness'].default_value=.32
fold=next(o for o in new if o.name=='Puerta plegadiza de placard · Placards')
for label in ['2','3']:
 c=fold.copy();c.data=fold.data.copy();bpy.context.collection.objects.link(c);c.name='Bell accordion closet '+label
 for v in c.data.vertices:
  x,y,z=fold.matrix_world@v.co;u=x-6.221;d=y+3.1915
  v.co=(-3.861+d,3.7845-u*1.219/1.524,z*2.11/2.1+.024) if label=='2' else (-6.3245+u*1.981/1.524,-.355+d,z*2.11/2.1+.024)
 c.matrix_world.identity();assign(c,white)
for o in new:
 if o!=car:bpy.data.objects.remove(o,do_unlink=True)
# Refine both elevations without covering the cutaway with the main roof.
trim=mat('Bell facade warm white trim','eee9df',.65)
box('Bell front porch lintel',(-1.55,-5.10,2.46),(4.15,.32,.18),trim,.015)
for x in [-3.455,.355]:
 box('Bell porch column plinth',(x,-5.10,.15),(.43,.43,.30),trim,.01)
box('Bell front cornice',(0,-3.73,2.48),(15.24,.09,.12),trim,.01)
box('Bell rear cornice',(0,5.25,2.48),(15.24,.09,.12),trim,.01)
for x in [-2.49,-.455]:box('Bell rear slider trim',(x,5.29,1.10),(.075,.06,2.20),trim,.006)
box('Bell rear slider head',(-1.473,5.29,2.21),(2.11,.06,.08),trim,.006)
