"""Optimize the Bell reference bake without changing geometry or UVs."""
from pathlib import Path
from PIL import Image
import io,json,struct
p=Path(__file__).resolve().parents[1]/'public/bell/bell-plan-v5.glb'
b=p.read_bytes();ln=struct.unpack_from('<I',b,12)[0];j=json.loads(b[20:20+ln]);raw=b[28+ln:]
replacement={};converted=set()
for i,im in enumerate(j.get('images',[])):
 if im.get('mimeType')!='image/png':continue
 v=j['bufferViews'][im['bufferView']];payload=raw[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']]
 img=Image.open(io.BytesIO(payload))
 if img.width<2000:continue
 out=io.BytesIO();img.convert('RGB').save(out,format='WEBP',quality=94);replacement[im['bufferView']]=out.getvalue();im['mimeType']='image/webp';converted.add(i)
for t in j.get('textures',[]):
 if t.get('source') in converted:t.setdefault('extensions',{})['EXT_texture_webp']={'source':t.pop('source')}
if converted:
 for key in ['extensionsUsed','extensionsRequired']:
  if 'EXT_texture_webp' not in j.setdefault(key,[]):j[key].append('EXT_texture_webp')
parts=[];offset=0
for i,v in enumerate(j['bufferViews']):
 payload=replacement.get(i,raw[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']]);v['byteOffset']=offset;v['byteLength']=len(payload);payload+=b'\0'*((-len(payload))%4);parts.append(payload);offset+=len(payload)
raw=b''.join(parts);j['buffers'][0]['byteLength']=len(raw)
j['asset']['extras']={'rainbowPark':{'referenceStyle':'Bell warm natural interior, user references 2026-11-25','bakedColor':True}}
data=json.dumps(j,separators=(',',':')).encode();data+=b' '*((-len(data))%4);tail=struct.pack('<II',len(raw),0x004e4942)+raw
p.write_bytes(struct.pack('<III',0x46546c67,2,20+len(data)+len(tail))+struct.pack('<II',len(data),0x4e4f534a)+data+tail)
print('Bell reference optimized:',p.stat().st_size)
