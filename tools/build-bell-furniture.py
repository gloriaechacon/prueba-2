import bpy,bmesh,math,numpy as np
from pathlib import Path
from mathutils import Vector,Matrix
ROOT=Path(__file__).resolve().parents[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/bell/bell-plan-v3.glb'))
parts=[]
doors=[]
for o in bpy.context.scene.objects:
 if o.type=='MESH' and o.name.startswith('Bell · puerta interior') and not o.name.endswith('.001'):
  pts=np.array([tuple(o.matrix_world@v.co) for v in o.data.vertices]); xy=pts[:,:2];mid=xy.mean(axis=0)
  _,axes=np.linalg.eigh(np.cov(xy.T));axis=axes[:,-1];normal=np.array([-axis[1],axis[0]])
  u=xy@axis;v=xy@normal
  center=axis*(u.min()+u.max())/2+normal*(v.min()+v.max())/2
  if o.name=='Bell · puerta interior 7':
   center[0]=2*3.861-center[0];axis[0]*=-1
  doors.append((o.name,center,axis,u.max()-u.min()))
table=bpy.data.objects['64 Comedor · mobiliario'].copy();table.data=table.data.copy();bpy.context.collection.objects.link(table)
bm=bmesh.new();bm.from_mesh(table.data)
bmesh.ops.delete(bm,geom=[f for f in bm.faces if not (-1.96<f.calc_center_median().x<-1.09)],context='FACES')
bm.to_mesh(table.data);bm.free();table.name='Bell retained dining table';parts.append(table)
before=set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/utah/utah-plan-v4.glb'))
sources=[o for o in bpy.data.objects if o not in before and o.type=='MESH']
def copy(o,name):
 n=o.copy();n.data=o.data.copy();bpy.context.collection.objects.link(n);n.name=name;n.matrix_world=Matrix.Identity(4);parts.append(n);return n
# Three complete Utah bed sets, including pillows, blankets and bedside tables.
beds=[o for o in sources if o.name.startswith('Cama y mesitas · Anexo · dormitorio')]
for label,cx,cy,angle in [('principal',2.70,-1.48,-math.pi/2),('2',-5.75,3.77,0),('3',-5.82,-1.97,math.pi)]:
 for src in beds:
  n=copy(src,'Bell bed '+label+' '+src.name)
  for v in n.data.vertices:
   x,y,z=src.matrix_world@v.co;x+=5.5;y-=5.957
   v.co=(cx+math.cos(angle)*x-math.sin(angle)*y,cy+math.sin(angle)*x+math.cos(angle)*y,z+.025)
chair=next(o for o in sources if o.name=='grp · Anexo · estar y cocineta')
for i,(cx,cy,angle) in enumerate([(-2.30,3.22,-math.pi/2),(-2.30,4.16,-math.pi/2),(-.75,3.22,math.pi/2),(-.75,4.16,math.pi/2)]):
 n=copy(chair,'Bell dining Utah annex chair '+str(i+1));bm=bmesh.new();bm.from_mesh(n.data)
 bmesh.ops.delete(bm,geom=[f for f in bm.faces if f.material_index<2 or f.calc_center_median().y>3.19],context='FACES');bm.to_mesh(n.data);bm.free()
 for v in n.data.vertices:
  x,y,z=v.co;x=(x+2.494)*1.3;y=(y-2.70)*1.3
  v.co=(cx+math.cos(angle)*x-math.sin(angle)*y,cy+math.sin(angle)*x+math.cos(angle)*y,z*1.3+.025)
white=bpy.data.materials.new('Utah white interior doors');white.use_nodes=True
bs=white.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(.94,.94,.94,1);bs.inputs['Roughness'].default_value=.48
src=next(o for o in sources if o.name=='Puerta interior · Pasillo 01')
for label,center,axis,width in doors:
 n=copy(src,'Bell Utah style '+label)
 n.data.materials.clear();n.data.materials.append(white)
 for v in n.data.vertices:
  x,y,z=v.co;u=(x-2.213)*width/.8;d=(y+1.6105)*.38
  v.co=(center[0]+axis[0]*u-axis[1]*d,center[1]+axis[1]*u+axis[0]*d,z*2.11/2.1+.024)
 for p in n.data.polygons:p.material_index=0
for o in parts:
 for mat in o.data.materials:
  if not mat or not mat.use_nodes:continue
  for node in mat.node_tree.nodes:
   if node.type=='GROUP' and node.node_tree and 'glTF Material Output' in node.node_tree.name:
    for inp in node.inputs:
     for link in list(inp.links):mat.node_tree.links.remove(link)
 o['sourceStyle']='Utah original furniture'
bpy.ops.object.select_all(action='DESELECT')
for o in parts:o.select_set(True)
bpy.context.view_layer.objects.active=parts[0]
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/bell/bell-furniture-v4.glb'),export_format='GLB',use_selection=True,export_extras=True,export_draco_mesh_compression_enable=True,export_draco_position_quantization=16)
print('FURNITURE_READY',len(parts),len(doors))
