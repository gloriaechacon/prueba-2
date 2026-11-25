"""Reconstruct missing Utah kitchen joinery from the delivered v4 + user references.
Run with Blender --background --python tools/repair-utah-kitchen.py.
The exterior and original v4 files are never overwritten.
"""
import bpy,bmesh,math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT.parent/'outputs/utah-v4-review';OUT.mkdir(exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/utah/utah-plan-v4.glb'))
source=next(o for o in bpy.data.objects if o.type=='MESH' and o.name.startswith('Sin+t'))
patch=source.copy();patch.data=source.data.copy();bpy.context.collection.objects.link(patch)
patch.name='Utah kitchen - retained sink, taps and range'
# Damaged cabinet carcasses and fridge skins are collapsed by the old reduction.
remove={'M07_Charcoal_Gleam','A04_Scarlet_Glow','B02_Almond_Blush','[Color_009]1','[Color_008]','[Color_A05]','[Metal_Corrogated_Shiny]3','[Color_A05]1','Derrick_Sweater','[Color_K10]','[Color_A03]1','[Metal_Seamed]'}
bm=bmesh.new();bm.from_mesh(patch.data)
faces=[]
for f in bm.faces:
 name=patch.data.materials[f.material_index].name
 if name in remove or (name=='__default' and f.calc_center_median().z<1.3):faces.append(f)
bmesh.ops.delete(bm,geom=faces,context='FACES');bm.to_mesh(patch.data);bm.free()
source.hide_render=True;source.hide_set(True)
parts=[patch]
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

# Main island: retain existing three stools, double sink and tap coordinates.
base('Main island',-4.10,-1.78,.045,.80,doors=3)
for i in range(3):door('Island working face '+str(i+1),-4.10+i*2.32/3+.004,-4.10+(i+1)*2.32/3-.004,.12,.848,.026,front=-1)
countertop('Island white stone with sink cutout',-4.15,-1.73,-.025,1.00,(-3.281,-2.505,.132,.605))
# Back run: preserve the actual stove opening and the fridge position.
for name,x0,x1 in [('Range left base',-4.116,-3.742),('Range right base',-2.953,-2.563)]:
 base(name,x0,x1,-1.875,-1.245,doors=1)
 countertop(name+' white stone',x0-.01,x1+.01,-1.894,-1.215)
# Upper cabinets visible in the supplied tour. Keep below the cutaway wall top.
box('Upper cabinet body',(-4.116,1.65,-1.88),(-2.563,2.23,-1.53),wood)
for i in range(3):door('Upper cabinet '+str(i+1),-4.116+i*1.553/3+.004,-4.116+(i+1)*1.553/3-.004,1.664,2.218,-1.526)
box('Under cabinet extractor',(-3.729,1.565,-1.86),(-2.967,1.645,-1.46),handle,.005)
# The same delivered mesh also contains the annex kitchenette's damaged base.
base('Annex kitchenette base',-7.564,-5.288,-2.535,-1.948,doors=3)
# Preserve the annex sink aperture using its measured source bounds.
vs=[patch.data.vertices[v].co for f in patch.data.polygons if patch.data.materials[f.material_index].name=='[Color_005]' for v in f.vertices if patch.data.vertices[v].co.x < -5]
if vs:
 xmin=min(v.x for v in vs);xmax=max(v.x for v in vs);zmin=min(-v.y for v in vs);zmax=max(-v.y for v in vs)
 countertop('Annex stone with sink cutout',-7.585,-5.267,-2.56,-1.92,(xmin+.012,xmax-.012,zmin+.012,zmax-.012))

def fridge(name,x0,x1,z0,z1):
 box(name+' enclosed body',(x0,.045,z0),(x1,1.95,z1),steel,.012)
 # Separate solid lower and freezer doors, with visible gasket seam.
 box(name+' lower door',(x0+.012,.09,z1),(x1-.012,1.435,z1+.035),steel,.009)
 box(name+' freezer door',(x0+.012,1.447,z1),(x1-.012,1.936,z1+.035),steel,.009)
 for h in [1.39,1.49]:box(name+' handle',(x0+.055,h,z1+.038),(x1-.055,h+.027,z1+.070),handle,.009)
fridge('Main refrigerator',-2.519,-1.787,-1.831,-1.111)
fridge('Annex refrigerator',-5.192,-4.462,-2.701,-1.981)
# Export only the repair. All other house geometry remains in the original asset.
bpy.ops.object.select_all(action='DESELECT')
for o in parts:o.hide_set(False);o.select_set(True)
bpy.context.view_layer.objects.active=patch
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/utah/utah-kitchen-repair-v4.glb'),export_format='GLB',use_selection=True,export_extras=True,export_draco_mesh_compression_enable=True,export_draco_position_quantization=16,export_draco_normal_quantization=10,export_draco_texcoord_quantization=14)
# Keep an editable local copy with its packed source textures.
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'utah-kitchen-repaired.blend'))
print('KITCHEN_REPAIR_COMPLETE',len(parts))
