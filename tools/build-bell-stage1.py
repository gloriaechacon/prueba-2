"""Bell stage 1: bounded exterior + living/kitchen following official Bell plan.
Utah supplies finishes/furniture only; other Bell rooms remain untouched.
"""
import bpy,bmesh,math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT.parent/'outputs/bell-stage1';OUT.mkdir(exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
parts=[]
def material(name,color,roughness=.45,metal=0):
 m=bpy.data.materials.new(name);m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Roughness'].default_value=roughness;bs.inputs['Metallic'].default_value=metal
 return m
wood=material('Utah reference - dark espresso joinery',(.027,.018,.012),.5)
stone=material('Utah reference - white stone countertop',(.91,.89,.85),.28)
steel=material('Utah reference - brushed refrigerator',(.64,.66,.67),.32,.65)
handle=material('Utah reference - dark refrigerator handles',(.035,.035,.032),.3,.45)
# Dimensions below are in the original GLB frame (X, height, Z), metres.
def box(name,lo,hi,mat,bevel=.003):
 x0,y0,z0=lo;x1,y1,z1=hi
 bpy.ops.mesh.primitive_cube_add(size=1,location=((x0+x1)/2,-(z0+z1)/2,(y0+y1)/2))
 o=bpy.context.object;o.name=name;o.dimensions=(x1-x0,z1-z0,y1-y0)
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 o.data.materials.append(mat)
 if bevel:
  mod=o.modifiers.new('Small real edge radius','BEVEL');mod.width=bevel;mod.segments=2
  bpy.ops.object.modifier_apply(modifier=mod.name)
  mod=o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL');mod.keep_sharp=True
  bpy.ops.object.modifier_apply(modifier=mod.name)
 o['category']='mobiliario';o['room']='Cocina';o['repair']='reconstructed from user references 2026-11-24';parts.append(o)
 return o

def door(name,x0,x1,h0,h1,z,front=1):
 # Solid recessed shaker fronts, as in the user's tour reference.
 thick=.019;inset=.055
 box(name+' recessed panel',(x0,h0,z),(x1,h1,z+thick),wood,.002)
 z0=z+front*.012;z1=z0+thick
 for a,b,c,d,label in [(x0,x0+inset,h0,h1,'left'),(x1-inset,x1,h0,h1,'right'),(x0+inset,x1-inset,h0,h0+inset,'bottom'),(x0+inset,x1-inset,h1-inset,h1,'top')]:
  box(name+' '+label,(a,c,min(z0,z1)),(b,d,max(z0,z1)),wood,.002)

def base(name,x0,x1,z0,z1,h=.86,doors=2):
 box(name+' bottom',(x0,.10,z0),(x1,.125,z1),wood,.003)
 box(name+' left side',(x0,.125,z0),(x0+.022,h,z1),wood,.003)
 box(name+' right side',(x1-.022,.125,z0),(x1,h,z1),wood,.003)
 box(name+' back',(x0+.022,.125,z0),(x1-.022,h,z0+.022),wood,.002)
 box(name+' recessed plinth',(x0+.045,.01,z0+.05),(x1-.045,.10,z1-.04),wood,.002)
 w=(x1-x0)/doors
 for i in range(doors):door(name+f' door {i+1}',x0+i*w+.004,x0+(i+1)*w-.004,.12,h-.012,z1)

def countertop(name,x0,x1,z0,z1,hole=None):
 o=box(name,(x0,.86,z0),(x1,.898,z1),stone,0)
 if hole:
  a,b,c,d=hole
  cutter=box('temporary sink opening',(a,.80,c),(b,.96,d),stone,0)
  bpy.context.view_layer.objects.active=o
  mod=o.modifiers.new('Inset opening for original sink','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter
  bpy.ops.object.modifier_apply(modifier=mod.name)
  parts.remove(cutter);bpy.data.objects.remove(cutter,do_unlink=True)
 bpy.context.view_layer.objects.active=o
 mod=o.modifiers.new('Counter edge radius','BEVEL');mod.width=.002;mod.segments=2;bpy.ops.object.modifier_apply(modifier=mod.name)
 return o


# Exterior: same white fence/lawn as Utah, ONE driveway aligned to Bell garage.
bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/utah/utah-lot-v4.glb'))
grass=next(o for o in bpy.context.scene.objects if o.name=='Césped del lote').data.materials[0]
concrete=next(o for o in bpy.context.scene.objects if o.name=='Entrada de autos').data.materials[0]
for o in list(bpy.context.scene.objects):
 if o.type=='MESH' and o.name in ['Césped del lote','cerca blanca']:
  o.location.x+=.608;parts.append(o)
  if o.name=='Césped del lote':
   parts.remove(o);bpy.data.objects.remove(o,do_unlink=True)
box('Bell continuous lawn',(-12.192,-.25,-19.425),(12.192,-.10,17.151),grass,0)
# Reuse Utah's embedded concrete texture.
box('Bell single garage driveway',(4.18,-.095,3.79),(7.20,-.045,17.15),concrete,.006)
# Pedestrian connection from porch to garage access.
box('Bell porch pedestrian landing',(-1.05,-.095,5.20),(.20,-.045,6.60),concrete,.003)
box('Bell porch to garage walkway',(.20,-.095,5.55),(4.18,-.045,6.60),concrete,.003)
# Planar UVs in metres keep grass and concrete at the same scale as Utah.
for o in parts:
 if not o.name.startswith('Bell '):continue
 uv=o.data.uv_layers.active or o.data.uv_layers.new(name='UVMap')
 tile=5 if o.name=='Bell continuous lawn' else 2
 for poly in o.data.polygons:
  for li in poly.loop_indices:
   co=o.matrix_world @ o.data.vertices[o.data.loops[li].vertex_index].co
   uv.data[li].uv=(co.x/tile,co.y/tile)

def export(path):
 bpy.ops.object.select_all(action='DESELECT')
 for o in parts:o.select_set(True)
 bpy.context.view_layer.objects.active=parts[0]
 bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_extras=True,export_draco_mesh_compression_enable=True,export_draco_position_quantization=16,export_draco_normal_quantization=10)
export(ROOT/'public/bell/bell-lot-v4.glb')
bpy.ops.wm.read_factory_settings(use_empty=True)
parts=[]
# Recreate materials after scene reset.
wood=material('Bell - Utah dark espresso joinery',(.027,.018,.012),.5)
stone=material('Bell - Utah white stone',(.91,.89,.85),.28)
steel=material('Bell brushed steel',(.64,.66,.67),.32,.65)
handle=material('Bell graphite handles',(.035,.035,.032),.3,.45)
# Import the existing repaired Utah kit only to reuse real sinks/range/fridge.
bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/utah/utah-kitchen-repair-v4.glb'))
original=next(o for o in bpy.data.objects if o.type=='MESH' and o.name.startswith('Utah kitchen - retained'))
sinkm={'[Color_005]','[Color_003]4','[Metal_Corrogated_Shiny]1','Allora-989-SS-DST','[Color_001]1','*1','*4'}
rangem={'[Color_004]','[Metal_Corrogated_Shiny]4','[Color_007]','<CorrogateShiny>2','[Metal_Corrogated_Shiny]6','[Metal_Corrogated_Shiny]7','[Color_D04]2','[Fencing_Mesh_Blue]2','Almond','black','__default'}
def appliance(name,materials,delta):
 o=original.copy();o.data=original.data.copy();bpy.context.collection.objects.link(o);o.name=name
 bm=bmesh.new();bm.from_mesh(o.data)
 remove=[f for f in bm.faces if o.data.materials[f.material_index].name not in materials or f.calc_center_median().x < -4.2]
 bmesh.ops.delete(bm,geom=remove,context='FACES');bm.to_mesh(o.data);bm.free()
 o.location+=Vector((delta[0],-delta[2],delta[1]));parts.append(o)
 return o
# Plan: sink/DW/refrigerator on rear wall, stove opposite along WIC wall.
appliance('Bell double sink and faucet',sinkm,(4.853,0,-5.039))
appliance('Bell range and oven',rangem,(4.248,0,-1.0))
for o in list(bpy.data.objects):
 if o.type=='MESH' and o.name.startswith('Main refrigerator'):
  o.location+=Vector((5.435,.0,0));o.location.y+=3.12; o.name=o.name.replace('Main','Bell');parts.append(o)
# Rear counter starts at x .20; fridge at x 2.916 to 3.648.
base('Bell sink cabinet',1.54,2.89,-4.99,-4.38,doors=2)
base('Bell rear left cabinet',.20,.86,-4.99,-4.38,doors=1)
box('Bell dishwasher enclosed body',(.88,.045,-4.98),(1.52,.85,-4.38),steel,.006)
box('Bell dishwasher handle',( .95,.76,-4.365),(1.45,.79,-4.33),handle,.008)
countertop('Bell rear white counter',.18,2.91,-5.005,-4.34,(1.572,2.348,-4.907,-4.434))
# Range run, shown on plan in front of the walk-in closet. No Utah island.
for name,x0,x1 in [('Bell stove left cabinet',.20,.505),('Bell stove right cabinet',1.295,2.02)]:
 base(name,x0,x1,-2.88,-2.25,doors=1)
 countertop(name+' white top',x0-.01,x1+.01,-2.90,-2.23)
# Rear window must remain clear; only a short upper unit left of the window.
box('Bell upper cabinet body',(.20,1.52,-5.0),(.86,2.18,-4.65),wood)
door('Bell upper cabinet',.21,.85,1.53,2.17,-4.645)
# Living: use the SAME upholstered sofa, rug and table from Utah, fitted inside Great Room.
before=set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/utah/utah-plan-v4.glb'))
new=[o for o in bpy.data.objects if o not in before and o.type=='MESH']
sofa_names=['grp · Sala 06','grp · Sala 07','1#2 · Sala','Monaco - Braço · Sala 01','Monaco - Braço · Sala 02','Monaco - Braço · Sala 03','1 · Sala 01','1#1 · Sala 01','1#1 · Sala 02','1 · Sala 02','1 · Sala 03']
for o in new:
 if o.name in sofa_names:
  # Sofa at former coffee-table position, facing the west wall.
  for v in o.data.vertices:
   x,y,z=v.co;v.co=(x-.07, y+2.05,z)
  bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free()
  o.name='Bell living - '+o.name;parts.append(o)

 elif o.name=='grp · Sala 05':
  o.location+=Vector((.85,2.05,.015));o.name='Bell living rug';parts.append(o)
# TV and console on the west wall, formerly behind the sofa.
box('Bell living media console',(-3.70,.08,.65),(-3.46,.42,2.45),wood)
black=material('Bell TV screen',(.008,.01,.012),.24)
box('Bell living television',(-3.70,.77,.83),(-3.66,1.53,2.18),black,.008)
# Do not carry Utah baked irradiance/occlusion to furniture after moving it.
for o in parts:
 for mat in o.data.materials:
  if not mat or not mat.use_nodes:continue
  for node in mat.node_tree.nodes:
   if node.type=='GROUP' and node.node_tree and 'glTF Material Output' in node.node_tree.name:
    for inp in node.inputs:
     for link in list(inp.links):mat.node_tree.links.remove(link)
 o['room']='Bell living and kitchen';o['stage']=1
# Remove unused source imports from editable scene and from export.
keep=set(parts)
for o in list(bpy.context.scene.objects):
 if o not in keep:bpy.data.objects.remove(o,do_unlink=True)
export(ROOT/'public/bell/bell-living-kitchen-v4.glb')
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'bell-living-kitchen.blend'))
print('BELL_STAGE1_COMPLETE',len(parts))
