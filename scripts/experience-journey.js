/* ==================================================================
   BERMITO — THE JOURNEY (PHYSICAL)
   The descent, rebuilt as matter. A lacquered relief globe under a
   low sun — real raised continents from Natural Earth data — then
   down onto the Malabar coast, arriving at the ceramic tasting mark
   standing on Kozhikode. A circle wipe cuts into the roast: a
   brushed-steel drum of tumbling beans turning green → yellow →
   brown, first crack in coral. A second wipe, and the ribbed
   ceramic cup rises in a deep brown room.
   ================================================================== */

import * as THREE from 'three';
import { RoomEnvironment } from '../assets/vendor/RoomEnvironment.js';

const GEO = window.BERMITO_GEO;

const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);
const ramp=(x,a,b)=>smooth(clamp((x-a)/(b-a),0,1));
const win=(x,a,b,w=.04)=>ramp(x,a-w,a)*(1-ramp(x,b,b+w));

const HEX={
  space:'#1A1512', paper:'#FBFAF7', yellow:'#FFE212', brown:'#51453D',
  ocean:'#22303A', land:'#BCA478', landDeep:'#77664C',
  kerala:'#77D654', keralaDeep:'#2E7D3A', beige:'#D5D8B8',
  coral:'#F45F53', steel:'#C9C3B8',
  roomAmber:'#F6E9CE', roomBrown:'#453B34',
  raw:'#77D654',
};
const C={}; for(const k in HEX) C[k]=new THREE.Color(HEX[k]);

const mercToLat=y=>(2*Math.atan(Math.exp(-y*Math.PI/180))-Math.PI/2)*180/Math.PI;
const R=100;
function sphere(lat,lon,alt=0){
  const la=lat*Math.PI/180, lo=lon*Math.PI/180, r=R+alt;
  return new THREE.Vector3(r*Math.cos(la)*Math.cos(lo), r*Math.sin(la), -r*Math.cos(la)*Math.sin(lo));
}

/* ---- rasterise the (lon, mercY) path data into a soft height mask ---- */
function makeMask(paths, W, H, lonR, latR, blur){
  const cv=document.createElement('canvas'); cv.width=W; cv.height=H;
  const g=cv.getContext('2d',{willReadFrequently:true});
  g.filter=`blur(${blur}px)`;
  g.fillStyle='#fff';
  const toX=lon=>(lon-lonR[0])/(lonR[1]-lonR[0])*W;
  const toY=lat=>(latR[1]-lat)/(latR[1]-latR[0])*H;
  for(const d of paths){
    const p=new Path2D();
    for(const sub of d.split('M')){
      if(!sub.trim()) continue;
      const pts=sub.replace(/Z/g,'').trim().split('L');
      pts.forEach((q,i)=>{
        const [x,my]=q.trim().split(/\s+/).map(Number);
        const X=toX(x), Y=toY(mercToLat(my));
        i? p.lineTo(X,Y): p.moveTo(X,Y);
      });
      p.closePath();
    }
    g.fill(p,'nonzero');
  }
  const data=g.getImageData(0,0,W,H).data;
  return (lon,lat)=>{
    const x=clamp((lon-lonR[0])/(lonR[1]-lonR[0])*W,0,W-1.001);
    const y=clamp((latR[1]-lat)/(latR[1]-latR[0])*H,0,H-1.001);
    const x0=Math.floor(x), y0=Math.floor(y), fx=x-x0, fy=y-y0;
    const a=(X,Y)=>data[(Y*W+X)*4+3]/255;
    return a(x0,y0)*(1-fx)*(1-fy)+a(x0+1,y0)*fx*(1-fy)
         + a(x0,y0+1)*(1-fx)*fy + a(x0+1,y0+1)*fx*fy;
  };
}

function dotTexture(){
  const s=64,c=document.createElement('canvas');c.width=c.height=s;
  const g=c.getContext('2d');
  const grd=g.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);
  grd.addColorStop(0,'rgba(255,255,255,.95)');
  grd.addColorStop(.6,'rgba(255,255,255,.4)');
  grd.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=grd;g.fillRect(0,0,s,s);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}

function beanGeometry(detail=64){
  const g=new THREE.SphereGeometry(1,detail,Math.round(detail*.75));
  const p=g.attributes.position, v=new THREE.Vector3();
  for(let i=0;i<p.count;i++){
    v.fromBufferAttribute(p,i);
    v.x*=.92; v.y*=1.36; v.z*=.78;
    if(v.z>0){
      const crease=Math.exp(-Math.pow(v.x*3.6,2))*(1-Math.pow(clamp(v.y/1.36,-1,1),2));
      v.z-=crease*.5;
    }
    p.setXYZ(i,v.x,v.y,v.z);
  }
  g.computeVertexNormals();
  return g;
}
function cupGeometry(){
  const prof=[
    [0.0,-5.6],[1.4,-5.6],[2.5,-5.35],[3.5,-4.6],[4.3,-3.4],[4.62,-2.0],
    [4.5,-0.4],[4.05,1.0],[3.86,2.0],[3.98,2.9],[4.18,3.5],[4.24,3.8],
  ].map(([r,y])=>new THREE.Vector2(r,y));
  const g=new THREE.LatheGeometry(prof,96);
  const p=g.attributes.position, v=new THREE.Vector3();
  for(let i=0;i<p.count;i++){
    v.fromBufferAttribute(p,i);
    const rad=Math.hypot(v.x,v.z);
    if(rad>.2){
      const a=Math.atan2(v.z,v.x);
      const flute=1+0.022*Math.sin(a*24)*ramp(v.y,-5.2,-1.2)*(1-ramp(v.y,2.2,3.8));
      v.x=Math.cos(a)*rad*flute; v.z=Math.sin(a)*rad*flute;
    }
    p.setXYZ(i,v.x,v.y,v.z);
  }
  g.computeVertexNormals();
  return g;
}

export function createExperience({canvas}){
  const isMobile=matchMedia('(max-width: 760px)').matches;
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,isMobile?1.7:2));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.05;

  const scene=new THREE.Scene();
  scene.background=C.space.clone();

  const pmrem=new THREE.PMREMGenerator(renderer);
  scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;

  /* the sun: one hard key, warm fill — a globe in a dark room */
  const sun=new THREE.DirectionalLight(0xfff4e0,2.1); scene.add(sun);
  const fill=new THREE.DirectionalLight(0xffe9c9,.28); fill.position.set(-120,-30,-60); scene.add(fill);
  scene.add(new THREE.AmbientLight(0xffffff,.16));

  const cam=new THREE.PerspectiveCamera(46,1,.1,4000);
  sun.position.copy(sphere(24,50,0)).multiplyScalar(2.4);   // over the Arabian Sea

  /* ================= SET 1 — THE RELIEF GLOBE ================= */
  const worldGroup=new THREE.Group(); scene.add(worldGroup);
  const maskWorld=makeMask([GEO.world], 2048, 1024, [-180,180], [-85,85], 2);
  let globeMat;
  {
    const seg=isMobile?[224,160]:[360,240];
    const g=new THREE.SphereGeometry(R,seg[0],seg[1]);
    const pos=g.attributes.position, v=new THREE.Vector3();
    const colors=new Float32Array(pos.count*3);
    const cOcean=C.ocean, cLand=C.land, cDeep=C.landDeep, cc=new THREE.Color();
    for(let i=0;i<pos.count;i++){
      v.fromBufferAttribute(pos,i);
      const lat=Math.asin(clamp(v.y/R,-1,1))*180/Math.PI;
      const lon=Math.atan2(-v.z,v.x)*180/Math.PI;
      const h=maskWorld(lon,lat);
      const r=R + h*2.4;
      const k=r/R; pos.setXYZ(i,v.x*k,v.y*k,v.z*k);
      const t=smooth(clamp((h-.28)/.5,0,1));
      cc.copy(cOcean).lerp(cDeep,Math.min(t*2,1)).lerp(cLand,Math.max(t*2-1,0));
      colors[i*3]=cc.r; colors[i*3+1]=cc.g; colors[i*3+2]=cc.b;
    }
    g.setAttribute('color',new THREE.BufferAttribute(colors,3));
    g.computeVertexNormals();
    globeMat=new THREE.MeshPhysicalMaterial({
      vertexColors:true, roughness:.42, metalness:0,
      clearcoat:.6, clearcoatRoughness:.3, envMapIntensity:.5, transparent:true,
    });
    worldGroup.add(new THREE.Mesh(g,globeMat));
  }

  /* Kerala close-range tile: finer relief, apple-green state */
  const KZ={lat:11.2588, lon:75.7804};
  let tileMat;
  {
    const lonR=[73.6,78.2], latR=[7.4,13.4];
    const mAll=makeMask([GEO.keralaHi, GEO.nearStates], 1024, 1024, lonR, latR, 2.4);
    const mK=makeMask([GEO.keralaHi], 1024, 1024, lonR, latR, 2.4);
    const NX=isMobile?200:320, NY=isMobile?240:400;
    const g=new THREE.PlaneGeometry(1,1,NX,NY);
    const pos=g.attributes.position;
    const colors=new Float32Array(pos.count*3);
    const cc=new THREE.Color();
    for(let i=0;i<pos.count;i++){
      const u=pos.getX(i)+.5, w=pos.getY(i)+.5;      // 0..1
      const lon=lerp(lonR[0],lonR[1],u), lat=lerp(latR[0],latR[1],w);
      const h=mAll(lon,lat), k=mK(lon,lat);
      const s=sphere(lat,lon,.12+h*2.9);
      pos.setXYZ(i,s.x,s.y,s.z);
      const tl=smooth(clamp((h-.3)/.45,0,1));
      cc.copy(C.ocean).lerp(C.beige,tl);
      const tk=smooth(clamp((k-.3)/.45,0,1));
      cc.lerp(C.kerala,tk*.9);
      // a touch of depth: darker toward the ghats side of the state
      colors[i*3]=cc.r; colors[i*3+1]=cc.g; colors[i*3+2]=cc.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors,3));
    g.computeVertexNormals();
    // the plane wraps onto the sphere with inward-facing winding — flip
    {
      const n=g.attributes.normal, pp=g.attributes.position;
      const nv=new THREE.Vector3(), pv=new THREE.Vector3();
      for(let i=0;i<n.count;i++){
        nv.fromBufferAttribute(n,i); pv.fromBufferAttribute(pp,i).normalize();
        if(nv.dot(pv)<0) n.setXYZ(i,-nv.x,-nv.y,-nv.z);
      }
      n.needsUpdate=true;
    }
    tileMat=new THREE.MeshPhysicalMaterial({
      vertexColors:true, roughness:.5, clearcoat:.5, clearcoatRoughness:.35,
      envMapIntensity:.5, transparent:true, opacity:0, side:THREE.DoubleSide,
    });
    worldGroup.add(new THREE.Mesh(g,tileMat));
  }

  /* the ceramic tasting mark, standing on Kozhikode */
  const ceramicYellow=()=>new THREE.MeshPhysicalMaterial({
    color:C.yellow, roughness:.2, clearcoat:1, clearcoatRoughness:.14,
    envMapIntensity:.4, emissive:C.yellow, emissiveIntensity:.28, transparent:true,
  });
  const marker=new THREE.Group();
  {
    const H=[1,.74,.44,.16], Rr=.5; let y=0;
    for(let i=0;i<4;i++){
      const m=new THREE.Mesh(new THREE.SphereGeometry(Rr,32,20),ceramicYellow());
      m.scale.set(1,H[i]*.5,1);
      if(i>0) y-=H[i-1]*.5*Rr + H[i]*.5*Rr + .22;
      m.position.y=y;
      marker.add(m);
    }
    const up=sphere(KZ.lat,KZ.lon,0).normalize();
    marker.position.copy(sphere(KZ.lat,KZ.lon,5.1));
    marker.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),up);
    marker.visible=false;
    worldGroup.add(marker);
  }

  /* ================= SET 2 — THE ROAST ================= */
  const ROAST_O=new THREE.Vector3(0,-4000,0);
  const roastGroup=new THREE.Group(); roastGroup.position.copy(ROAST_O);
  roastGroup.position.x+=isMobile?0:5; scene.add(roastGroup);
  const steel=new THREE.MeshPhysicalMaterial({color:C.steel,metalness:.92,roughness:.34,side:THREE.DoubleSide,transparent:true});
  const drum=new THREE.Group(); roastGroup.add(drum);
  {
    drum.add(new THREE.Mesh(new THREE.CylinderGeometry(9.6,9.6,13,64,1,true),steel));
    const rimF=new THREE.Mesh(new THREE.TorusGeometry(9.6,.42,20,72),steel.clone());
    rimF.rotation.x=Math.PI/2; rimF.position.y=6.5; drum.add(rimF);
    const back=new THREE.Mesh(new THREE.CircleGeometry(9.6,64),
      new THREE.MeshStandardMaterial({color:0x3A332E,roughness:.8,side:THREE.DoubleSide,transparent:true}));
    back.rotation.x=Math.PI/2; back.position.y=-6.4; drum.add(back);
    for(let i=0;i<3;i++){
      const vane=new THREE.Mesh(new THREE.BoxGeometry(1.1,12.4,2.4),steel.clone());
      const a=i/3*Math.PI*2;
      vane.position.set(Math.cos(a)*8.6,0,Math.sin(a)*8.6);
      vane.lookAt(0,0,0); drum.add(vane);
    }
    drum.rotation.x=Math.PI/2-.55; drum.rotation.z=.1;
  }
  const beanGeo=beanGeometry(56);
  const BE=isMobile?150:280;
  const beanMat=new THREE.MeshStandardMaterial({roughness:.5,transparent:true});
  const beansIM=new THREE.InstancedMesh(beanGeo,beanMat,BE);
  beansIM.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  roastGroup.add(beansIM);
  const seeds=[]; const dummy=new THREE.Object3D(); const bc=new THREE.Color();
  const _tilt=new THREE.Euler(Math.PI/2-.55,0,.1);
  for(let i=0;i<BE;i++){
    seeds.push({r:1.5+Math.random()*6.6,a:Math.random()*Math.PI*2,w:.6+Math.random()*1.1,
      d:(Math.random()-.5)*10.5,s:.5+Math.random()*.28,ph:Math.random()*Math.PI*2,
      heat:Math.random(),tumble:new THREE.Vector3(Math.random(),Math.random(),Math.random())});
    beansIM.setColorAt(i,C.raw);
  }

  /* ================= SET 3 — THE CUP ================= */
  const CUP_O=new THREE.Vector3(4000,0,0);
  const cupGroup=new THREE.Group(); cupGroup.position.copy(CUP_O); scene.add(cupGroup);
  const cupParts=[];
  {
    const body=new THREE.Mesh(cupGeometry(),new THREE.MeshPhysicalMaterial({
      color:C.paper,roughness:.2,clearcoat:1,clearcoatRoughness:.14,side:THREE.DoubleSide,transparent:true}));
    cupParts.push(body); cupGroup.add(body);
    const rimBand=new THREE.Mesh(new THREE.TorusGeometry(4.2,.16,16,72),ceramicYellow());
    rimBand.rotation.x=Math.PI/2; rimBand.position.y=3.8; cupParts.push(rimBand); cupGroup.add(rimBand);
    const coffee=new THREE.Mesh(new THREE.CircleGeometry(3.8,64),
      new THREE.MeshPhysicalMaterial({color:0x31261F,roughness:.12,clearcoat:.8,transparent:true}));
    coffee.rotation.x=-Math.PI/2; coffee.position.y=2.6; cupParts.push(coffee); cupGroup.add(coffee);
  }
  const steamTex=dotTexture(); const steam=[];
  for(let i=0;i<10;i++){
    const s=new THREE.Sprite(new THREE.SpriteMaterial({map:steamTex,color:C.paper,transparent:true,opacity:0,depthWrite:false}));
    s.scale.setScalar(.6+Math.random()*.8);
    s.userData={x:(Math.random()-.5)*2,ph:Math.random()*6,sp:.55+Math.random()*.5};
    cupGroup.add(s); steam.push(s);
  }
  const diskMat=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});
  const disk=new THREE.Mesh(new THREE.CircleGeometry(5.4,72),diskMat);
  disk.scale.setScalar(.86); disk.position.set(isMobile?-3.4:-4.6,5.8,-8); cupGroup.add(disk);
  {
    const img=new Image();
    img.onload=()=>{
      const cv=document.createElement('canvas');cv.width=cv.height=512;
      cv.getContext('2d').drawImage(img,0,0,512,512);
      const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;
      diskMat.map=t;diskMat.needsUpdate=true;
    };
    img.src='assets/brand/live-through-coffee-disk.svg';
  }

  /* ================= CAMERA SCRIPT ================= */
  const kz0=sphere(KZ.lat,KZ.lon,0);
  const kzUp=kz0.clone().normalize();
  const kzCam=(alt,side=0,northUp=0)=>{
    const east=new THREE.Vector3(0,1,0).cross(kzUp).normalize();
    const north=kzUp.clone().cross(east).normalize();
    return kz0.clone().addScaledVector(kzUp,alt).addScaledVector(east,side).addScaledVector(north,northUp);
  };

  const BEATS=[
    {a:0.00,b:0.16,arc:true,
     from:{p:new THREE.Vector3(60,150,430),l:new THREE.Vector3(0,0,0)},
     to:  {p:new THREE.Vector3(-30,70,310), l:new THREE.Vector3(0,0,0)}},
    {a:0.16,b:0.34,arc:true,
     from:{p:new THREE.Vector3(-30,70,310),l:new THREE.Vector3(0,0,0)},
     to:  {p:kzCam(170,-45,55),            l:kz0.clone()}},
    {a:0.34,b:0.50,arc:true,upTo:kzUp,
     from:{p:kzCam(170,-45,55),l:kz0.clone()},
     to:  {p:kzCam(30,-9,3),   l:kz0.clone().addScaledVector(kzUp,3)}},
    {a:0.50,b:0.575,up:kzUp,
     from:{p:kzCam(30,-9,3),   l:marker.position.clone()},
     to:  {p:kzCam(6.4,-1.3,-5),l:marker.position.clone().addScaledVector(kzUp,-1.2)}},
    {a:0.575,b:0.80,
     from:{p:ROAST_O.clone().add(new THREE.Vector3(5,3,36)), l:ROAST_O.clone()},
     to:  {p:ROAST_O.clone().add(new THREE.Vector3(-3,1.5,30)),l:ROAST_O.clone()}},
    {a:0.80,b:1.00,
     from:{p:CUP_O.clone().add(new THREE.Vector3(1.6,2.4,34)),l:CUP_O.clone()},
     to:  {p:CUP_O.clone().add(new THREE.Vector3(0,2.2,26.5)),l:CUP_O.clone().add(new THREE.Vector3(0,.4,0))}},
  ];

  const _p=new THREE.Vector3(),_l=new THREE.Vector3();
  const _qa=new THREE.Quaternion(),_qb=new THREE.Quaternion(),_q=new THREE.Quaternion();
  const _da=new THREE.Vector3(),_db=new THREE.Vector3(),_up=new THREE.Vector3(0,1,0);
  function arcLerp(out,a,b,t){
    const ra=a.length(),rb=b.length();
    _da.copy(a).normalize();_db.copy(b).normalize();
    _qa.setFromUnitVectors(_da,_da);_qb.setFromUnitVectors(_da,_db);
    _q.slerpQuaternions(_qa,_qb,t);
    out.copy(_da).applyQuaternion(_q).multiplyScalar(lerp(ra,rb,t));
  }
  function shoot(p){
    let beat=BEATS[0];
    for(const b of BEATS){ if(p>=b.a) beat=b; }
    const t=smooth(clamp((p-beat.a)/(beat.b-beat.a),0,1));
    if(beat.arc) arcLerp(_p,beat.from.p,beat.to.p,t);
    else _p.lerpVectors(beat.from.p,beat.to.p,t);
    _l.lerpVectors(beat.from.l,beat.to.l,t);
    if(beat.up) cam.up.copy(beat.up);
    else if(beat.upTo) cam.up.copy(_up).lerp(beat.upTo,t).normalize();
    else cam.up.copy(_up);
    cam.position.copy(_p); cam.lookAt(_l);
  }

  /* drag: spins the globe (early acts) and the cup (late act) */
  let userRot=0,userRotT=0,dragging=false,px=0;
  renderer.domElement.style.touchAction='pan-y';
  renderer.domElement.addEventListener('pointerdown',e=>{dragging=true;px=e.clientX;});
  addEventListener('pointermove',e=>{if(dragging){userRotT+=(e.clientX-px)*.005;px=e.clientX;}});
  addEventListener('pointerup',()=>dragging=false);

  const bg=new THREE.Color();
  let time=0, spin=0;

  function update(p,dt){
    time+=dt;
    userRotT*=(dragging?1:.985);
    userRot+=(userRotT-userRot)*Math.min(1,dt*7);

    /* room colour: dark space → (wipe) amber roastery → coral → brown */
    if(p<.585)     bg.copy(C.space);
    else if(p<.8)  bg.copy(C.roomAmber).lerp(C.roomBrown,ramp(p,.74,.8));
    else           bg.copy(C.roomBrown).lerp(C.brown,ramp(p,.88,1));
    const crack=win(p,.683,.712,.014);
    if(crack>0) bg.lerp(C.coral,crack*.6);
    scene.background.copy(bg);

    /* sun follows the act: hard over the globe, soft in the rooms */
    sun.intensity = p<.585 ? 2.1 : 1.1;
    fill.intensity = p<.585 ? .28 : .5;

    /* --- SET 1: the globe --- */
    worldGroup.visible = p<.60;
    if(worldGroup.visible){
      spin += dt*.012*(1-ramp(p,.14,.28));
      worldGroup.rotation.y = spin + userRot*(1-ramp(p,.4,.5));
      tileMat.opacity = ramp(p,.30,.42);
      globeMat.opacity = 1;
      marker.visible = p>.30;
      const ms=.5+ramp(p,.32,.5)*1.1+Math.sin(time*2.2)*.025;
      marker.scale.setScalar(ms*1.15);
      marker.traverse(n=>{ if(n.material) n.material.opacity=ramp(p,.30,.36); });
    }

    /* --- SET 2: the roast --- */
    const roastO=ramp(p,.575,.615)*(1-ramp(p,.775,.81));
    roastGroup.visible=roastO>.003;
    if(roastGroup.visible){
      drum.traverse(n=>{ if(n.material) n.material.opacity=roastO; });
      beanMat.opacity=roastO;
      roastGroup.rotation.y=userRot*.4;
      drum.rotation.y=time*.55;
      const heat=ramp(p,.60,.71);
      const kick=win(p,.683,.72,.02);
      for(let i=0;i<BE;i++){
        const s=seeds[i];
        const a=s.a+time*s.w+drum.rotation.y*.25;
        const rr=s.r+kick*2.6*Math.sin(s.ph+time*4);
        dummy.position.set(Math.cos(a)*rr, s.d*.5+Math.sin(time*.9+s.ph)*.5, Math.sin(a)*rr*.9);
        dummy.position.applyEuler(_tilt);
        dummy.rotation.set(s.tumble.x*time*2,s.tumble.y*time*2,s.tumble.z*time*2);
        dummy.scale.setScalar(s.s);
        dummy.updateMatrix();
        beansIM.setMatrixAt(i,dummy.matrix);
        const turned=heat>s.heat;
        bc.copy(turned?C.brown:(heat>s.heat-.15?C.yellow:C.raw));
        beansIM.setColorAt(i,bc);
      }
      beansIM.instanceMatrix.needsUpdate=true;
      if(beansIM.instanceColor) beansIM.instanceColor.needsUpdate=true;
    }

    /* --- SET 3: the cup --- */
    const cupO=ramp(p,.80,.86);
    cupGroup.visible=cupO>.003;
    if(cupGroup.visible){
      for(const m of cupParts) m.material.opacity=cupO;
      cupGroup.rotation.y=userRot+Math.sin(time*.2)*.06;
      cupGroup.position.x=CUP_O.x+(isMobile?0:-2.6)*(1-ramp(p,.955,.995));
      cupGroup.position.y=lerp(-9,-.1,ramp(p,.80,.9))+Math.sin(time*.9)*.15;
      const intO=ramp(p,.85,.9);
      for(const s of steam){
        const u=(time*s.userData.sp+s.userData.ph)%4;
        s.position.set(s.userData.x+Math.sin(u*2)*.4, 4.3+u*1.6, 0);
        s.material.opacity=intO*.34*Math.sin(Math.PI*clamp(u/4,0,1));
      }
      disk.material.opacity=ramp(p,.9,.95)*cupO;
      disk.position.y=5.8+Math.sin(time*.8)*.25;
    }

    shoot(p);
    if(crack>0){
      cam.position.x+=Math.sin(time*40)*.12*crack;
      cam.position.y+=Math.cos(time*36)*.1*crack;
    }
    renderer.render(scene,cam);
  }

  function resize(w,h){
    renderer.setSize(w,h,false);
    cam.aspect=w/h;cam.updateProjectionMatrix();
  }

  return {update,resize};
}
