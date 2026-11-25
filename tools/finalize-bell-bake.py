from pathlib import Path
from PIL import Image
import json,struct
ROOT=Path(__file__).resolve().parents[1]
Image.open(ROOT.parent/'outputs/bell-stage1/bell-current-lightmap.png').convert('RGB').save(ROOT/'public/bell/bell-current-lightmap.webp',quality=94)
p=ROOT/'public/bell/bell-plan-v4.glb';b=p.read_bytes();ln=struct.unpack_from('<I',b,12)[0];j=json.loads(b[20:20+ln])
j['asset']['extras']={'rainbowPark':{'lightMap':{'file':'bell-current-lightmap.webp','intensity':1},'currentBellBake':True}}
def color(code):
 rgb=[int(code[i:i+2],16)/255 for i in (0,2,4)]
 return [((c+.055)/1.055)**2.4 if c>.04045 else c/12.92 for c in rgb]+[1]
for m in j['materials']:
 name=m.get('name','')
 if '70006203' in name:
  m.pop('extensions',None)
  m['pbrMetallicRoughness']={'baseColorFactor':[.8,.8,.76,1],'roughnessFactor':.95,'metallicFactor':0}
 if 'Piso roble' in name:m.setdefault('pbrMetallicRoughness',{})['baseColorFactor']=color('a18b73')
 if 'Hormigón exterior' in name and name.endswith('.001'):m.setdefault('pbrMetallicRoughness',{})['baseColorFactor']=color('828587')
# The real atlas is external WebP; drop duplicate embedded atlas payload.
import io
anchors={m['occlusionTexture']['index'] for m in j['materials'] if 'occlusionTexture' in m}
views=set()
for idx in anchors:
 tex=j['textures'][idx];src=tex.get('source')
 if src is not None:views.add(j['images'][src]['bufferView'])
raw=b[28+ln:];chunks=[];offset=0
pixel=io.BytesIO();Image.new('RGB',(1,1),'white').save(pixel,format='PNG')
for i,v in enumerate(j['bufferViews']):
 payload=pixel.getvalue() if i in views else raw[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']]
 v['byteOffset']=offset;v['byteLength']=len(payload)
 payload+=b'\0'*((-len(payload))%4);chunks.append(payload);offset+=len(payload)
raw=b''.join(chunks);j['buffers'][0]['byteLength']=len(raw)
data=json.dumps(j,separators=(',',':'),ensure_ascii=True).encode();data+=b' '*((-len(data))%4);tail=struct.pack('<II',len(raw),0x004e4942)+raw
p.write_bytes(struct.pack('<III',0x46546c67,2,20+len(data)+len(tail))+struct.pack('<II',len(data),0x4e4f534a)+data+tail)
print('Finalized Bell baked model',p.stat().st_size)
