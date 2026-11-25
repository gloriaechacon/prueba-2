import bpy,bmesh
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'public/utah/utah-lot-v4.glb'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(p))
for o in bpy.context.scene.objects:
 if o.type!='MESH' or o.name!='Entrada de autos':continue
 bpy.context.view_layer.objects.active=o
 o.select_set(True)
 bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
 bm=bmesh.new();bm.from_mesh(o.data)
 bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=.00001,plane_co=(0,-17.151,0),plane_no=(0,1,0),clear_inner=True,clear_outer=False)
 bm.to_mesh(o.data);bm.free();o.data.update()
bpy.ops.export_scene.gltf(filepath=str(p),export_format='GLB',export_extras=True,export_draco_mesh_compression_enable=True,export_draco_position_quantization=16,export_draco_normal_quantization=10)
