"""Build web photos and perspective cube faces from the matched Luminar exports."""
from pathlib import Path
from PIL import Image, ImageOps
import numpy as np, json, csv, sys
src=Path(sys.argv[1]); root=Path(__file__).resolve().parents[1]
out=root/'public/assets/lot-photos'; out.mkdir(parents=True,exist_ok=True)
groups=[[90,91,92,93,4,5,6,7],[94,95,96,97,8,9,10,11,1382,1384],[98,99,100,102,1386,1387,1388],[103,104,105,106,1389,1390,1391],[3293,3294,3295,3296],[1392,1393,1394]]
catalog={}; rows=[]
for p in sorted(src.rglob('*.jpg')):
    n=int(p.stem.split('_')[-2 if p.stem.startswith('DJI') else -1])
    lot=next(i for i,g in enumerate(groups,1) if n in g)
    key=f'RP-{lot:02}'; items=catalog.setdefault(key,[])
    im=ImageOps.exif_transpose(Image.open(p)).convert('RGB'); w,h=im.size
    kind='vertical' if h>=w else '360' if n in [92,93,97,102,106] else 'photo'
    dest=out/key; dest.mkdir(exist_ok=True); stem=p.stem
    rows.append([key,p.name,w,h,kind])
    if kind=='vertical' or (lot,n) in {(1,4),(1,5),(2,9),(2,1384),(5,3295)}: continue
    item=dict(type=kind,file=f'{key}/{stem}.jpg'); items.append(item)
    if kind=='360':
        assert w==2*h
        im.thumbnail((6144,3072)); a=np.asarray(im); H,W=a.shape[:2]
        N=1536; axis=(np.arange(N)+.5)*2/N-1; u,v=np.meshgrid(axis,axis)
        for face,(x,y,z) in enumerate([(u,-v,np.ones_like(u)),(np.ones_like(u),-v,-u),(-u,-v,-np.ones_like(u)),(-np.ones_like(u),-v,u),(u,np.ones_like(u),v),(u,-np.ones_like(u),-v)]):
            xx=((np.arctan2(x,z)/(2*np.pi)+.5)*W).astype(int)%W
            yy=((.5-np.arctan2(y,np.hypot(x,z))/np.pi)*H).astype(int).clip(0,H-1)
            Image.fromarray(a[yy,xx]).save(dest/f'{stem}-{face}.jpg',quality=86,optimize=True)
    im.thumbnail((1920,1280)); im.save(dest/(stem+'.jpg'),quality=86,optimize=True)
    im.thumbnail((280,158)); im.save(dest/(stem+'-thumb.jpg'),quality=78)
(out/'catalog.json').write_text(json.dumps(catalog,indent=2))
with (root/'lot-photo-inventory.csv').open('w',newline='') as f:
    writer=csv.writer(f);writer.writerow(['lot','original','width','height','type']);writer.writerows(rows)
