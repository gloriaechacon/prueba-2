import bpy,math
from pathlib import Path
R=Path(__file__).resolve().parents[2];bpy.ops.wm.open_mainfile(filepath=str(R/'outputs/bell-stage1/bell-current-bake.blend'))
o=next(o for o in bpy.context.scene.objects if o.type=='MESH');bpy.context.view_layer.objects.active=o
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='DESELECT');bpy.ops.object.mode_set(mode='OBJECT')
idx=next(i for i,m in enumerate(o.data.materials) if m.name=='70006203')
for p in o.data.polygons:p.select=p.material_index==idx
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.separate(type='SELECTED');bpy.ops.object.mode_set(mode='OBJECT')
sofa=next(x for x in bpy.context.scene.objects if x.type=='MESH' and x!=o)
bpy.ops.object.select_all(action='DESELECT');sofa.select_set(True);bpy.context.view_layer.objects.active=sofa
sofa.data.uv_layers.active_index=sofa.data.uv_layers.find('Lightmap');sofa.data.uv_layers['Lightmap'].active_render=True
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.remove_doubles(threshold=.001);bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.uv.smart_project(angle_limit=math.radians(80),island_margin=.005);bpy.ops.object.mode_set(mode='OBJECT')
im=bpy.data.images.new('Sofa soft baked finish',width=1024,height=1024,alpha=False)
mat=bpy.data.materials.new('Bell sofa baked upholstery');mat.use_nodes=True;bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(.8,.8,.76,1);bs.inputs['Roughness'].default_value=.95
sofa.data.materials.clear();sofa.data.materials.append(mat)
for p in sofa.data.polygons:p.material_index=0
tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=im;mat.node_tree.nodes.active=tex
bpy.context.scene.render.bake.use_pass_color=True;bpy.context.scene.render.bake.margin=4;bpy.context.scene.cycles.samples=24
bpy.ops.object.bake(type='DIFFUSE',uv_layer='Lightmap')
im.filepath_raw=str(R/'outputs/bell-stage1/sofa-bake.png');im.file_format='PNG';im.save()
mat.node_tree.nodes.remove(bs);em=mat.node_tree.nodes.new('ShaderNodeEmission');uv=mat.node_tree.nodes.new('ShaderNodeUVMap');uv.uv_map='Lightmap';mat.node_tree.links.new(uv.outputs[0],tex.inputs['Vector']);mat.node_tree.links.new(tex.outputs['Color'],em.inputs['Color']);mat.node_tree.links.new(em.outputs[0],mat.node_tree.nodes.get('Material Output').inputs['Surface'])
bpy.ops.export_scene.gltf(filepath=str(R/'prueba-2-publicacion/public/bell/bell-sofa-baked-v4.glb'),export_format='GLB',use_selection=True,export_draco_mesh_compression_enable=True)
print('SOFA_BAKED')
