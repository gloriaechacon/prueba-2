import bpy,math,re,json,struct
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT.parent/'outputs/bell-stage1'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/bell/bell-plan-v3.glb'))
for o in list(bpy.context.scene.objects):
 if o.type!='MESH':continue
 if o.get('roof') or re.match(r'^(60|61|62|63|64|65) ',o.name) or 'puerta interior' in o.name:
  bpy.data.objects.remove(o,do_unlink=True)
# Strip the original layout's occlusion atlas from every source material.
for m in bpy.data.materials:
 if not m.use_nodes:continue
 for n in list(m.node_tree.nodes):
  if n.type=='GROUP' and n.node_tree and 'glTF Material Output' in n.node_tree.name:m.node_tree.nodes.remove(n)
def tint(m,hexcolor):
 m=m.copy();bs=m.node_tree.nodes.get('Principled BSDF');rgb=[int(hexcolor[i:i+2],16)/255 for i in (0,2,4)];rgb=[((c+.055)/1.055)**2.4 if c>.04045 else c/12.92 for c in rgb]
 socket=bs.inputs['Base Color'];links=list(socket.links)
 if links:
  node=m.node_tree.nodes.new('ShaderNodeMixRGB');node.blend_type='MULTIPLY';node.inputs[0].default_value=1;node.inputs[2].default_value=(*rgb,1)
  m.node_tree.links.new(links[0].from_socket,node.inputs[1]);m.node_tree.links.new(node.outputs[0],socket)
 else:socket.default_value=(*rgb,1)
 return m
floor=bpy.data.objects['03 Piso interior'];oak=bpy.data.objects['Bell · piso roble dormitorio 2'].data.materials[0]
floor.data.materials.clear();floor.data.materials.append(oak)
uv=floor.data.uv_layers[0]
for loop in floor.data.loops:
 co=floor.data.vertices[loop.vertex_index].co;uv.data[loop.index].uv=(-co.y/1.2,co.x/1.2)
for o in bpy.context.scene.objects:
 if o.type=='MESH' and (o==floor or re.search('piso roble|piso vestidor',o.name)):
  for slot in o.material_slots:slot.material=tint(slot.material,'a18b73')
tile=bpy.data.images.load(str(ROOT/'public/bell/bell-bath-utah.webp'))
for o in bpy.context.scene.objects:
 if o.type!='MESH' or not (o.name.startswith(('67 ','68 ')) or 'piso baño' in o.name):continue
 for slot in o.material_slots:
  name=slot.material.name;porcelain=any(x in name for x in ['Porcelana sanitaria','Aluminio bronce oscuro'])
  if not (porcelain or 'piso baño' in o.name or any(x in name for x in ['Porcelánico','Cuarzo'])):continue
  m=bpy.data.materials.new('Bell bathroom white' if porcelain else 'Utah beige bathroom tile');m.use_nodes=True
  bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(1,1,1,1);bs.inputs['Roughness'].default_value=.23 if porcelain else .45
  if not porcelain:
   n=m.node_tree.nodes.new('ShaderNodeTexImage');n.image=tile;m.node_tree.links.new(n.outputs['Color'],bs.inputs['Base Color'])
  slot.material=m
m=tint(bpy.data.objects['04 Piso garaje'].data.materials[0],'828587')
bpy.ops.mesh.primitive_plane_add(size=1,location=(5.69,-.405,.012));o=bpy.context.object;o.name='Bell garage concrete';o.scale=(3.55,6.39,1);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
for file in ['bell-living-kitchen-v4.glb','bell-furniture-v4.glb']:bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/bell'/file))
# Bake all current furniture and architecture together. No roof or external lot.
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
for o in meshes:
 # Retain color UVs explicitly while a separate atlas is active for baking.
 if not o.data.uv_layers:o.data.uv_layers.new(name='UVMap')
 o.data.uv_layers[0].name='UVMap'
 for uv in list(o.data.uv_layers)[1:]:o.data.uv_layers.remove(uv)
 for m in o.data.materials:
  if not m or not m.use_nodes:continue
  for n in list(m.node_tree.nodes):
   if n.type=='GROUP' and n.node_tree and 'glTF Material Output' in n.node_tree.name:m.node_tree.nodes.remove(n)
  uvnode=m.node_tree.nodes.get('Base UV') or m.node_tree.nodes.new('ShaderNodeUVMap');uvnode.name='Base UV';uvnode.uv_map='UVMap'
  for n in m.node_tree.nodes:
   if n.type=='TEX_IMAGE' and not n.inputs['Vector'].is_linked:m.node_tree.links.new(uvnode.outputs['UV'],n.inputs['Vector'])
bpy.ops.object.select_all(action='DESELECT')
for o in meshes:o.select_set(True)
bpy.context.view_layer.objects.active=meshes[0];bpy.ops.object.join();o=bpy.context.object;o.name='Bell current furnished floorplan'
o.data.uv_layers.new(name='Lightmap');o.data.uv_layers.active_index=1;o.data.uv_layers['Lightmap'].active_render=True
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.remove_doubles(threshold=.00005);bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=.001);bpy.ops.object.mode_set(mode='OBJECT')
image=bpy.data.images.new('Bell current indirect illumination',width=2048,height=2048,alpha=False,float_buffer=True)
for m in o.data.materials:
 if not m or not m.use_nodes:continue
 n=m.node_tree.nodes.new('ShaderNodeTexImage');n.image=image;n.name='Bake target';m.node_tree.nodes.active=n
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.world=bpy.data.worlds.new('Soft studio world');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.78,.84,1,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.7
bpy.ops.object.light_add(type='AREA',location=(-3,-5,12));light=bpy.context.object;light.data.energy=1600;light.data.shape='DISK';light.data.size=8;light.rotation_euler=(Vector((0,0,0))-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
scene.render.bake.use_pass_color=False;scene.render.bake.use_pass_direct=True;scene.render.bake.use_pass_indirect=True;scene.render.bake.margin=12
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'bell-current-bake.blend'))
print('START_BAKE',flush=True)
bpy.ops.object.bake(type='DIFFUSE',uv_layer='Lightmap')
image.filepath_raw=str(OUT/'bell-current-lightmap.png');image.file_format='PNG';image.save()
# Reference the atlas through glTF occlusion so TEXCOORD_1 is retained by exporter.
group=bpy.data.node_groups.new('glTF Material Output','ShaderNodeTree');group.interface.new_socket(name='Occlusion',in_out='INPUT',socket_type='NodeSocketFloat')
for m in o.data.materials:
 if not m or not m.use_nodes:continue
 node=m.node_tree.nodes.new('ShaderNodeGroup');node.node_tree=group
 tex=m.node_tree.nodes.get('Bake target');uvn=m.node_tree.nodes.new('ShaderNodeUVMap');uvn.uv_map='Lightmap';m.node_tree.links.new(uvn.outputs[0],tex.inputs['Vector']);m.node_tree.links.new(tex.outputs['Color'],node.inputs['Occlusion'])
o.data.uv_layers.active_index=0
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/bell/bell-plan-v4.glb'),export_format='GLB',use_selection=True,export_extras=True,export_draco_mesh_compression_enable=True,export_draco_position_quantization=16)
print('BAKE_COMPLETE',flush=True)
