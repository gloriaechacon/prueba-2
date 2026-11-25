"""Apply the user's two Bell reference images to the existing architectural model."""
import bpy, math, random, bmesh
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT.parent/'outputs/bell-reference';OUT.mkdir(exist_ok=True)
# Reuse the corrected doors, room layout and current furniture.
source=(ROOT/'tools/bake-bell-current.py').read_text(encoding='utf8').split('# Bake all current')[0]
exec(compile(source,str(ROOT/'tools/bake-bell-current.py'),'exec'))
OUT=ROOT.parent/'outputs/bell-reference'
def rgb(h):
 c=[int(h[i:i+2],16)/255 for i in (0,2,4)]
 return tuple(((v+.055)/1.055)**2.4 if v>.04045 else v/12.92 for v in c)
def mat(name,h,rough=.7,grain=False):
 m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes;b=n.get('Principled BSDF');b.inputs['Base Color'].default_value=(*rgb(h),1);b.inputs['Roughness'].default_value=rough
 if grain:
  t=n.new('ShaderNodeTexNoise');t.inputs['Scale'].default_value=95;t.inputs['Detail'].default_value=2
  bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.17;bump.inputs['Distance'].default_value=.008;m.node_tree.links.new(t.outputs['Fac'],bump.inputs['Height']);m.node_tree.links.new(bump.outputs['Normal'],b.inputs['Normal'])
 return m
cream=mat('Bell reference / cream linen','e9dfcc',grain=True);sand=mat('Bell reference / sand upholstery','bca686',grain=True)
olive=mat('Bell reference / olive upholstery','73774d',grain=True);sage=mat('Bell reference / sage textile','9a9a74',grain=True)
clay=mat('Bell reference / terracotta textile','bb8d70',grain=True);rug=mat('Bell reference / woven natural rug','c5af89',grain=True)
joinery=mat('Bell reference / beige cabinetry','b8a88b');oakmat=mat('Bell reference / warm oak furniture','ab8256');ceramic=mat('Bell reference / warm ceramic','e9d8ba',.35)
black=mat('Bell reference / dark bronze','39382e',.4);leaf=mat('Bell reference / leaves','647442');soil=mat('Bell reference / soil','413522')
def assign(o,m):
 o.data.materials.clear();o.data.materials.append(m)
 for p in o.data.polygons:p.material_index=0
# Existing materials and positions are retained where not contradicted by the references.
for o in list(bpy.context.scene.objects):
 if o.type!='MESH':continue
 if o.name.startswith('Bell dining Utah'):assign(o,olive)
 if o.name=='Bell living rug':assign(o,rug)
 if o.name.startswith('Bell living -'):assign(o,cream)
 if 'Bell bed' in o.name:
  suffix=o.name[-2:]
  assign(o,oakmat if suffix in ['08','09'] else sand if suffix in ['01','02','03','04'] else cream)
 if o.name=='Bell living media console':assign(o,oakmat)
 for slot in o.material_slots:
  m=slot.material
  if not m or not m.use_nodes:continue
  if 'dark espresso joinery' in m.name:slot.material=joinery
  elif 'Piso roble' in m.name:
   for n in m.node_tree.nodes:
    if n.type=='MIX_RGB':n.inputs[2].default_value=(.90,.79,.60,1)
  elif any(k in m.name.lower() for k in ['muro','pared','estuco','pintura blanca']):
   bs=m.node_tree.nodes.get('Principled BSDF')
   if bs and not bs.inputs['Base Color'].is_linked:bs.inputs['Base Color'].default_value=(*rgb('eee6d9'),1)
# Helpers use Blender world axes: x across the plan, y toward the rear, z height.
def box(name,loc,dims,m,bevel=.025):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=dims;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);assign(o,m)
 if bevel:
  b=o.modifiers.new('Rounded edges','BEVEL');b.width=bevel;b.segments=3;bpy.ops.object.modifier_apply(modifier=b.name)
 return o
def cyl(name,loc,r,depth,m,scale=(1,1,1)):
 bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=r,depth=depth,location=loc);o=bpy.context.object;o.name=name;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);assign(o,m)
 b=o.modifiers.new('Soft edge','BEVEL');b.width=.012;b.segments=2;bpy.ops.object.modifier_apply(modifier=b.name)
 return o
def cushion(name,loc,dims,m,angle=0):
 o=box(name,loc,dims,m,min(dims)*.40);o.rotation_euler[2]=angle;return o
def plant(name,x,y,z,size=.45):
 cyl(name+' pot',(x,y,z+size*.24),size*.23,size*.48,ceramic)
 cyl(name+' soil',(x,y,z+size*.47),size*.21,.018,soil)
 for i in range(11):
  a=i*2.399;h=size*(.6+.2*(i%3));v=Vector((math.cos(a)*size*.35,math.sin(a)*size*.35,h))
  bpy.ops.mesh.primitive_uv_sphere_add(segments=8,ring_count=4,radius=1,location=Vector((x,y,z+size*.42))+v*.5)
  o=bpy.context.object;o.name=name+' leaf';o.scale=(size*.095,size*.035,v.length*.58);o.rotation_euler=v.to_track_quat('Z','Y').to_euler();assign(o,leaf)
def lamp(x,y):
 cyl('Bedside ceramic lamp',(x,y,.64),.09,.25,ceramic)
 cyl('Bedside linen shade',(x,y,.84),.15,.21,cream)
 bpy.ops.object.light_add(type='POINT',location=(x,y,.83));bpy.context.object.data.energy=8;bpy.context.object.data.color=(1,.77,.5);bpy.context.object.data.shadow_soft_size=.14
# Replace the plain dining table with rounded warm timber, keeping its footprint.
old=bpy.data.objects.get('Bell retained dining table')
if old:bpy.data.objects.remove(old,do_unlink=True)
box('Bell rounded dining table',(-1.53,3.72,.76),(1.13,1.46,.08),oakmat,.16)
for x in [-1.94,-1.12]:
 for y in [3.17,4.27]:box('Dining table leg',(x,y,.37),(.07,.07,.72),oakmat,.012)
plant('Dining centerpiece',-1.53,3.72,.81,.32)
# Living: the reference restores a coffee table and adds a pouf and pillows.
box('Bell oval coffee table',(-2.74,-1.35,.42),(.57,1.30,.095),oakmat,.25)
for y in [-1.76,-.95]:box('Coffee table support',(-2.74,y,.23),(.30,.09,.37),oakmat,.035)
cyl('Bell leather pouf',(-2.75,-2.43,.23),.30,.43,clay)
for y,m in [(-.35,sage),(-1.0,cream),(-2.22,sage)]:cushion('Bell sofa cushion',(-1.54,y,.65),(.35,.39,.22),m,.12)
# Rugs and throws follow the three existing bed orientations.
for label,cx,cy,ang,cover in [('2',-5.75,3.77,0,sand),('3',-5.82,-1.97,math.pi,sage),('principal',2.70,-1.48,-math.pi/2,clay)]:
 r=box('Bedroom '+label+' woven rug',(cx,cy,.027),(2.25,2.53,.024),rug,.035);r.rotation_euler[2]=ang
 # Foot-of-bed throw, plus a small folded lip down each side.
 dx,dy=math.sin(ang)*.48,-math.cos(ang)*.48
 t=cushion('Bedroom '+label+' bed throw',(cx+dx,cy+dy,.67),(1.68,.93,.045),cover);t.rotation_euler[2]=ang
 for side in [-1,1]:
  x=cx+math.cos(ang)*side*.84+dx;y=cy+math.sin(ang)*side*.84+dy
  t=box('Bedroom '+label+' throw drape',(x,y,.53),(.035,.93,.28),cover,.015);t.rotation_euler[2]=ang
 px,py=cx-math.sin(ang)*.38,cy+math.cos(ang)*.38
 cushion('Bedroom '+label+' accent pillow',(px,py,.85),(.5,.25,.20),cover,ang)
for x,y in [(-6.92,4.65),(-4.58,4.65),(-7,-2.85),(-4.65,-2.85),(3.58,-.31),(3.58,-2.65)]:lamp(x,y)
plant('Living fern',-3.13,.80,.02,.82)
plant('Kitchen herb',.37,4.65,.90,.34)
plant('Console plant',-3.55,.42,.43,.24)
# Garage storage, kept against the right side wall with the drive clear.
for z in [.15,.70,1.25]:box('Garage shelf',(7.18,.20,z),(.47,1.65,.045),oakmat,.01)
for x in [6.98,7.38]:
 for y in [-.57,.97]:box('Garage shelving frame',(x,y,.72),(.025,.025,1.43),black,.004)
for y in [-.25,.47]:box('Garage storage basket',(7.18,y,.34),(.36,.52,.32),sand,.025)
plant('Garage shelf plant',7.18,.65,1.28,.38)
exec(compile((ROOT/'tools/bell-reference-corrections.py').read_text(encoding='utf-8-sig'),str(ROOT/'tools/bell-reference-corrections.py'),'exec'))
def fix_garage_normal(obj):
 bm=bmesh.from_edit_mesh(obj.data)
 for f in bm.faces:
  if 'Bell light garage concrete' in obj.data.materials[f.material_index].name and abs(f.calc_center_median().z-.012)<.001 and f.normal.z<0:f.normal_flip()
 bmesh.update_edit_mesh(obj.data)

# Prepare one lighting atlas. Weld exported seams before recalculating normals.
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
for o in meshes:
 for m in o.data.materials:
  if not m or not m.use_nodes:continue
  for n in list(m.node_tree.nodes):
   if n.type=='GROUP' and n.node_tree and 'glTF Material Output' in n.node_tree.name:m.node_tree.nodes.remove(n)
 if not o.data.uv_layers:o.data.uv_layers.new(name='UVMap')
 for uv in list(o.data.uv_layers)[1:]:o.data.uv_layers.remove(uv)
 o.data.uv_layers[0].name='UVMap'
 for m in o.data.materials:
  if not m or not m.use_nodes:continue
  uv=m.node_tree.nodes.new('ShaderNodeUVMap');uv.uv_map='UVMap'
  for n in m.node_tree.nodes:
   if n.type=='TEX_IMAGE':m.node_tree.links.new(uv.outputs[0],n.inputs['Vector'])
bpy.ops.object.select_all(action='DESELECT')
for o in meshes:o.select_set(True)
bpy.context.view_layer.objects.active=meshes[0];bpy.ops.object.join();o=bpy.context.object;o.name='Bell reference interior'
o.data.uv_layers.new(name='Baked');o.data.uv_layers.active_index=1;o.data.uv_layers['Baked'].active_render=True
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.remove_doubles(threshold=.001);bpy.ops.mesh.normals_make_consistent(inside=False);fix_garage_normal(o);bpy.ops.uv.smart_project(angle_limit=math.radians(75),island_margin=.0015);bpy.ops.object.mode_set(mode='OBJECT')
im=bpy.data.images.new('Bell reference baked finish',width=3072,height=3072,alpha=False,float_buffer=True)
for m in o.data.materials:
 if m and m.use_nodes:
  n=m.node_tree.nodes.new('ShaderNodeTexImage');n.image=im;m.node_tree.nodes.active=n
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32
scene.world=bpy.data.worlds.new('Warm daylight');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.88,.84,.76,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.7
for loc,power,size in [((-5,3,10),1800,7),((3,-3,8),600,6)]:
 bpy.ops.object.light_add(type='AREA',location=loc);l=bpy.context.object;l.data.energy=power;l.data.shape='DISK';l.data.size=size;l.rotation_euler=(Vector((0,0,0))-l.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
scene.render.bake.margin=8;scene.render.bake.use_pass_color=True;scene.render.bake.use_pass_direct=True;scene.render.bake.use_pass_indirect=True
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'bell-reference-editable.blend'))
print('REFERENCE_BAKE_START',flush=True);bpy.ops.object.bake(type='COMBINED',uv_layer='Baked')
# Keep a soft ambient contribution on thin, double-sided imported surfaces.
import numpy as np
base=bpy.data.images.new('Bell reference albedo',width=3072,height=3072,alpha=False,float_buffer=True)
for m in o.data.materials:
 if m and m.use_nodes:
  n=m.node_tree.nodes.new('ShaderNodeTexImage');n.image=base;m.node_tree.nodes.active=n
scene.render.bake.use_pass_direct=False;scene.render.bake.use_pass_indirect=False;scene.cycles.samples=1
bpy.ops.object.bake(type='DIFFUSE',uv_layer='Baked')
a=np.empty(len(im.pixels),dtype=np.float32);im.pixels.foreach_get(a);b=np.empty(len(base.pixels),dtype=np.float32);base.pixels.foreach_get(b)
a=a.reshape(-1,4);b=b.reshape(-1,4);a[:,:3]=np.maximum(a[:,:3],b[:,:3]*.5);im.pixels.foreach_set(a.ravel())
im.filepath_raw=str(OUT/'bell-reference-bake.png');im.file_format='PNG';im.save()
baked=bpy.data.materials.new('Bell reference baked daylight');baked.use_nodes=True;n=baked.node_tree.nodes;n.clear();out=n.new('ShaderNodeOutputMaterial');em=n.new('ShaderNodeEmission');tex=n.new('ShaderNodeTexImage');tex.image=im;uv=n.new('ShaderNodeUVMap');uv.uv_map='Baked';baked.node_tree.links.new(uv.outputs[0],tex.inputs['Vector']);baked.node_tree.links.new(tex.outputs['Color'],em.inputs['Color']);baked.node_tree.links.new(em.outputs[0],out.inputs['Surface'])
# Preserve transparent glass in the web renderer.
for slot in o.material_slots:
 if not any(x in slot.material.name.lower() for x in ['vidrio','glass','utah white interior doors','bell white satin doors']):slot.material=baked
o.data.uv_layers.active_index=1
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/bell/bell-plan-v5.glb'),export_format='GLB',use_selection=True,export_extras=True,export_draco_mesh_compression_enable=True,export_draco_position_quantization=16,export_draco_texcoord_quantization=16)
print('REFERENCE_READY',flush=True)
