/* ==================================================================
   BERMITO — THE OBJECT
   One physical object holds the centre of the screen for the whole
   visit. Scrolling transforms it:

     THE MARK  →  THE BEAN  →  THE ROAST  →  FIRST CRACK  →  THE CUP

   Ceramic, metal and light — studio-lit PBR materials, environment
   reflections, a soft contact shadow, and drag-to-rotate. The colour
   of the room follows the roast: paper → raw green → warm amber →
   coral flash → deep roasted brown.
   ================================================================== */

import * as THREE from 'three';
import { RoomEnvironment } from '../assets/vendor/RoomEnvironment.js';

const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);
const ramp=(x,a,b)=>smooth(clamp((x-a)/(b-a),0,1));
const win=(x,a,b,w=.04)=>ramp(x,a-w,a)*(1-ramp(x,b,b+w));

const HEX={
  paper:'#FBFAF7', yellow:'#FFE212', brown:'#51453D',
  raw:'#77D654', rawDeep:'#2E7D3A', beige:'#D5D8B8',
  coral:'#F45F53', steel:'#C9C3B8', roomGreen:'#EEF3E2',
  roomAmber:'#F7ECD2', roomBrown:'#453B34',
};
const C={}; for(const k in HEX) C[k]=new THREE.Color(HEX[k]);

/* soft round sprite for steam */
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
/* radial contact shadow */
function shadowTexture(){
  const s=256,c=document.createElement('canvas');c.width=c.height=s;
  const g=c.getContext('2d');
  const grd=g.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);
  grd.addColorStop(0,'rgba(0,0,0,.55)');
  grd.addColorStop(.55,'rgba(0,0,0,.22)');
  grd.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=grd;g.fillRect(0,0,s,s);
  return new THREE.CanvasTexture(c);
}

/* the coffee bean: a squashed sphere with a real crease */
function beanGeometry(detail=64){
  const g=new THREE.SphereGeometry(1,detail,Math.round(detail*.75));
  const p=g.attributes.position;
  const v=new THREE.Vector3();
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

/* the ribbed cup: lathe of the tasting-cup silhouette + flutes */
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
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,isMobile?1.8:2));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.05;

  const scene=new THREE.Scene();
  scene.background=C.paper.clone();

  /* studio: environment reflections + key/rim lights */
  const pmrem=new THREE.PMREMGenerator(renderer);
  scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;
  const key=new THREE.DirectionalLight(0xffffff,1.15); key.position.set(6,10,8); scene.add(key);
  const rim=new THREE.DirectionalLight(0xfff3c4,.55); rim.position.set(-8,4,-7); scene.add(rim);
  scene.add(new THREE.AmbientLight(0xffffff,.28));

  const cam=new THREE.PerspectiveCamera(38,1,.1,300);

  /* the stage the visitor can spin */
  const stage=new THREE.Group(); scene.add(stage);

  /* contact shadow */
  const shadow=new THREE.Mesh(
    new THREE.PlaneGeometry(26,26),
    new THREE.MeshBasicMaterial({map:shadowTexture(),transparent:true,opacity:.28,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2; shadow.position.y=-7.4; scene.add(shadow);

  /* ---------- helpers to fade whole groups ---------- */
  const faders=[];
  function fadeable(mesh){
    mesh.material.transparent=true;
    faders.push(mesh);
    return mesh;
  }
  function setOpacity(group,o){
    group.visible=o>0.003;
    group.traverse(n=>{ if(n.material) n.material.opacity=o; });
  }

  /* ================= ACT 1 — THE MARK ================= */
  const markGroup=new THREE.Group(); stage.add(markGroup);
  const ceramicYellow=()=>new THREE.MeshPhysicalMaterial({
    color:C.yellow, roughness:.2, metalness:0,
    clearcoat:1, clearcoatRoughness:.14,
    emissive:C.yellow, emissiveIntensity:.3, envMapIntensity:.4,
  });
  const markDiscs=[];
  {
    const H=[1,.74,.44,.16], R=3.1; let y=0, gap=.34;
    for(let i=0;i<4;i++){
      const m=fadeable(new THREE.Mesh(new THREE.SphereGeometry(R,64,40),ceramicYellow()));
      m.scale.set(1,H[i]*.5,1);
      if(i>0) y-=H[i-1]*.5*R + H[i]*.5*R + gap;
      m.position.y=y; m.userData.homeY=y;
      markDiscs.push(m); markGroup.add(m);
    }
    markGroup.position.y=0;  // recentre: stack now spans ~7.5 units
    { let top=0, bot=markDiscs[3].userData.homeY-H[3]*.5*R;
      const mid=(top+bot)/2; markDiscs.forEach(m=>{m.position.y-=mid; m.userData.homeY-=mid;}); }
    markGroup.scale.setScalar(1.32);
  }

  /* ================= ACT 2 — THE BEAN ================= */
  const beanGroup=new THREE.Group(); stage.add(beanGroup);
  const beanGeo=beanGeometry(72);
  const heroBean=fadeable(new THREE.Mesh(beanGeo,new THREE.MeshPhysicalMaterial({
    color:C.raw, roughness:.42, clearcoat:.55, clearcoatRoughness:.3,
    envMapIntensity:.6, emissive:C.raw, emissiveIntensity:.12,
  })));
  heroBean.scale.setScalar(4.6);
  beanGroup.add(heroBean);
  beanGroup.position.x=isMobile?0:-3.4;

  /* ================= ACT 3 — THE ROAST ================= */
  const roastGroup=new THREE.Group(); stage.add(roastGroup);
  roastGroup.position.x=isMobile?0:5.0;
  const steel=new THREE.MeshPhysicalMaterial({
    color:C.steel, metalness:.92, roughness:.34, side:THREE.DoubleSide,
  });
  const drum=new THREE.Group(); roastGroup.add(drum);
  {
    const shell=fadeable(new THREE.Mesh(new THREE.CylinderGeometry(9.6,9.6,13,64,1,true),steel));
    drum.add(shell);
    const rimF=fadeable(new THREE.Mesh(new THREE.TorusGeometry(9.6,.42,20,72),steel.clone()));
    rimF.rotation.x=Math.PI/2; rimF.position.y=6.5; drum.add(rimF);
    const back=fadeable(new THREE.Mesh(new THREE.CircleGeometry(9.6,64),
      new THREE.MeshStandardMaterial({color:0x3A332E,roughness:.8,side:THREE.DoubleSide})));
    back.rotation.x=Math.PI/2; back.position.y=-6.4; drum.add(back);
    for(let i=0;i<3;i++){
      const vane=fadeable(new THREE.Mesh(new THREE.BoxGeometry(1.1,12.4,2.4),steel.clone()));
      const a=i/3*Math.PI*2;
      vane.position.set(Math.cos(a)*8.6,0,Math.sin(a)*8.6);
      vane.lookAt(0,0,0);
      drum.add(vane);
    }
    // drum axis toward the viewer, tilted so we see inside
    drum.rotation.x=Math.PI/2-.55; drum.rotation.z=.1;
  }
  const BE=isMobile?150:280;
  const beanMat=new THREE.MeshStandardMaterial({roughness:.5,metalness:0});
  const beansIM=new THREE.InstancedMesh(beanGeo,beanMat,BE);
  beansIM.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  roastGroup.add(beansIM);
  const seeds=[]; const dummy=new THREE.Object3D(); const bc=new THREE.Color();
  const _tilt=new THREE.Euler(Math.PI/2-.55,0,.1);
  for(let i=0;i<BE;i++){
    seeds.push({
      r:1.5+Math.random()*6.6, a:Math.random()*Math.PI*2,
      w:.6+Math.random()*1.1, d:(Math.random()-.5)*10.5,
      s:.5+Math.random()*.28, ph:Math.random()*Math.PI*2,
      heat:Math.random(),
      tumble:new THREE.Vector3(Math.random(),Math.random(),Math.random()),
    });
    beansIM.setColorAt(i,C.raw);
  }

  /* ================= ACT 4 — THE CUP ================= */
  const cupGroup=new THREE.Group(); stage.add(cupGroup);
  {
    const body=fadeable(new THREE.Mesh(cupGeometry(),new THREE.MeshPhysicalMaterial({
      color:C.paper, roughness:.2, clearcoat:1, clearcoatRoughness:.14, side:THREE.DoubleSide,
    })));
    cupGroup.add(body);
    const rimBand=new THREE.Mesh(new THREE.TorusGeometry(4.2,.16,16,72),ceramicYellow());
    rimBand.material.transparent=true;
    rimBand.rotation.x=Math.PI/2; rimBand.position.y=3.8; cupGroup.add(rimBand);
    const coffee=new THREE.Mesh(new THREE.CircleGeometry(3.8,64),
      new THREE.MeshPhysicalMaterial({color:0x31261F,roughness:.12,clearcoat:.8,transparent:true}));
    coffee.rotation.x=-Math.PI/2; coffee.position.y=2.6; cupGroup.add(coffee);
    var cupInterior=[rimBand,coffee];
  }
  // steam
  const steamTex=dotTexture();
  const steam=[];
  for(let i=0;i<10;i++){
    const s=new THREE.Sprite(new THREE.SpriteMaterial({
      map:steamTex,color:C.paper,transparent:true,opacity:0,depthWrite:false}));
    s.scale.setScalar(.6+Math.random()*.8);
    s.userData={x:(Math.random()-.5)*2.0,ph:Math.random()*6,sp:.55+Math.random()*.5};
    cupGroup.add(s); steam.push(s);
  }
  // the tagline disk, floating behind the cup
  const diskMat=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});
  const disk=new THREE.Mesh(new THREE.CircleGeometry(5.4,72),diskMat);
  disk.scale.setScalar(.86);
  disk.position.set(isMobile?-3.4:-4.2,5.8,-8); cupGroup.add(disk);
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

  /* ---------------- drag to rotate ---------------- */
  let userRot=0,userRotT=0,dragging=false,px=0;
  const el=renderer.domElement;
  el.style.touchAction='pan-y';
  el.addEventListener('pointerdown',e=>{dragging=true;px=e.clientX;});
  addEventListener('pointermove',e=>{
    if(!dragging)return;
    userRotT+=(e.clientX-px)*.006; px=e.clientX;
  });
  addEventListener('pointerup',()=>dragging=false);

  /* ---------------- the film ---------------- */
  const bg=new THREE.Color();
  let time=0;

  function update(p,dt){
    time+=dt;
    userRotT*= (dragging?1:.985);          // gentle return
    userRot+=(userRotT-userRot)*Math.min(1,dt*7);

    /* room colour follows the roast */
    if(p<.30)      bg.copy(C.paper).lerp(C.roomGreen,ramp(p,.16,.30));
    else if(p<.52) bg.copy(C.roomGreen).lerp(C.roomAmber,ramp(p,.42,.52));
    else if(p<.76) bg.copy(C.roomAmber).lerp(C.roomBrown,ramp(p,.66,.76));
    else           bg.copy(C.roomBrown).lerp(C.brown,ramp(p,.86,1));
    const crack=win(p,.655,.685,.014);
    if(crack>0) bg.lerp(C.coral,crack*.55);
    scene.background.copy(bg);

    /* ---------- ACT 1: the mark ---------- */
    const markO=1-ramp(p,.18,.28);
    setOpacity(markGroup,markO);
    if(markGroup.visible){
      markGroup.rotation.y=time*.25+userRot;
      markGroup.position.y=Math.sin(time*1.1)*.22;
      const spread=ramp(p,.16,.27);
      markDiscs.forEach((m,i)=>{
        m.position.y=m.userData.homeY*(1+spread*1.35);
        m.scale.x=m.scale.z=1-spread*.5;
      });
    }

    /* ---------- ACT 2: the bean ---------- */
    const beanO=ramp(p,.22,.30)*(1-ramp(p,.44,.52));
    setOpacity(beanGroup,beanO);
    if(beanGroup.visible){
      const grow=.2+ramp(p,.22,.34)*.8;
      const shrink=1-ramp(p,.44,.52)*.72;
      heroBean.scale.setScalar(4.6*grow*shrink);
      beanGroup.rotation.set(Math.sin(time*.4)*.25,time*.5+userRot,.32);
      beanGroup.position.y=Math.sin(time*1.3)*.3;
    }

    /* ---------- ACT 3: the roast ---------- */
    const roastO=ramp(p,.47,.55)*(1-ramp(p,.72,.79));
    setOpacity(roastGroup,roastO);
    beansIM.visible=roastO>.003;
    beanMat.transparent=true; beanMat.opacity=roastO;
    if(roastGroup.visible){
      roastGroup.rotation.y=userRot*.4;
      drum.rotation.y=time*.55;
      const heat=ramp(p,.55,.71);
      const kick=win(p,.655,.70,.02);
      for(let i=0;i<BE;i++){
        const s=seeds[i];
        const a=s.a+time*s.w+ (drum.rotation.y*.25);
        const rr=s.r+kick*2.6*Math.sin(s.ph+time*4);
        // beans live inside the tilted drum: build in drum-local, apply drum tilt
        dummy.position.set(Math.cos(a)*rr, s.d*.5 + Math.sin(time*.9+s.ph)*.5, Math.sin(a)*rr*.9);
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

    /* ---------- ACT 4: the cup ---------- */
    const cupO=ramp(p,.74,.82);
    setOpacity(cupGroup,cupO);
    const intO=ramp(p,.81,.86);
    for(const m of cupInterior) m.material.opacity=intO;
    if(cupGroup.visible){
      cupGroup.position.x=(isMobile?0:-2.6)*(1-ramp(p,.955,.995));
      cupGroup.rotation.y=userRot+Math.sin(time*.2)*.06;
      cupGroup.position.y=lerp(-9,-.1,ramp(p,.74,.84))+Math.sin(time*.9)*.15;
      for(const s of steam){
        const u=(time*s.userData.sp+s.userData.ph)%4;
        s.position.set(s.userData.x+Math.sin(u*2)*0.4, 4.3+u*1.6, 0);
        s.material.opacity=intO*.34*Math.sin(Math.PI*clamp(u/4,0,1));
      }
      disk.material.opacity=ramp(p,.86,.93)*cupO;
      disk.position.y=5.8+Math.sin(time*.8)*.25;
    }

    /* ---------- shadow tracks the act ---------- */
    const shScale=lerp(.9,1.5,ramp(p,.47,.55))*(1-ramp(p,.72,.79)*.35);
    shadow.scale.setScalar(shScale);
    shadow.material.opacity=.26*(p<.74?1:cupO)* (1-crack*.4);
    shadow.position.y=p>.74?-8.2:-7.4;

    /* ---------- camera ---------- */
    const acts=[
      {a:0.00,b:0.20,f:[0,1.6,30],t:[0,1.2,28],lf:[0,1.4,0],lt:[0,1.2,0]},
      {a:0.20,b:0.47,f:[0,1.2,28],t:[0,.6,24.5],lf:[0,1.2,0],lt:[0,.2,0]},
      {a:0.47,b:0.74,f:[0,.6,24.5],t:[1.6,2.4,34],lf:[0,.2,0],lt:[0,0,0]},
      {a:0.74,b:1.00,f:[1.6,2.4,34],t:[0,2.2,26.5],lf:[0,0,0],lt:[0,.4,0]},
    ];
    let A=acts[0]; for(const x of acts){ if(p>=x.a) A=x; }
    const t=smooth(clamp((p-A.a)/(A.b-A.a),0,1));
    cam.position.set(lerp(A.f[0],A.t[0],t),lerp(A.f[1],A.t[1],t),lerp(A.f[2],A.t[2],t));
    // first-crack punch
    if(crack>0){
      cam.position.x+=Math.sin(time*40)*.12*crack;
      cam.position.y+=Math.cos(time*36)*.1*crack;
    }
    cam.lookAt(lerp(A.lf[0],A.lt[0],t),lerp(A.lf[1],A.lt[1],t),lerp(A.lf[2],A.lt[2],t));

    renderer.render(scene,cam);
  }

  function resize(w,h){
    renderer.setSize(w,h,false);
    cam.aspect=w/h;cam.updateProjectionMatrix();
    stage.scale.setScalar(clamp(w/h*1.02,.68,1));   // keep the object composed on narrow screens
  }

  return {update,resize};
}
