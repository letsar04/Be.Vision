"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImageUp, Play, ScanFace } from "lucide-react";

export default function TestLabPage(){
  const videoRef=useRef<HTMLVideoElement>(null);
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const [cameraOn,setCameraOn]=useState(false);
  const [result,setResult]=useState("");
  const [busy,setBusy]=useState(false);

  async function start(){
    const stream=await navigator.mediaDevices.getUserMedia({video:true,audio:false});
    if(videoRef.current){videoRef.current.srcObject=stream;await videoRef.current.play();}
    setCameraOn(true);
  }
  function stop(){
    const stream=videoRef.current?.srcObject as MediaStream|null;
    stream?.getTracks().forEach(t=>t.stop());
    setCameraOn(false);
  }
  async function recognize(){
    const video=videoRef.current,canvas=canvasRef.current;
    if(!video||!canvas)return;
    canvas.width=video.videoWidth||640;canvas.height=video.videoHeight||480;
    const ctx=canvas.getContext("2d");if(!ctx)return;
    ctx.drawImage(video,0,0,canvas.width,canvas.height);
    setBusy(true);setResult("");
    await new Promise<void>(resolve=>canvas.toBlob(async blob=>{if(!blob){resolve();return;}const fd=new FormData();fd.append("image",blob,"test.jpg");try{const r=await fetch("/api/test/recognize",{method:"POST",body:fd});const b=await r.json();setResult(r.ok?JSON.stringify(b.matches||b,null,2):(b.error||"Erreur moteur vision"));}catch(e){setResult(e instanceof Error?e.message:"Erreur réseau");}finally{resolve();}}, "image/jpeg",.88));
    setBusy(false);
  }
  async function simulate(){
    setBusy(true);setResult("");
    try{const r=await fetch("/api/simulate/event",{method:"POST"});const b=await r.json();setResult(r.ok?"Événement simulé pour "+b.person+" · confiance "+Math.round(b.confidence*100)+"%":(b.error||"Simulation impossible"));}finally{setBusy(false);}
  }
  useEffect(()=>()=>stop(),[]);
  return <div className="page-wrap"><div className="page-title"><div><div className="eyebrow">TEST MAISON</div><h1>Labo de test</h1><p>Ce mode utilise le smartphone ou la webcam uniquement pour valider le produit chez vous. Ce n’est pas l’architecture de production.</p></div></div><div className="dashboard-grid"><div className="panel"><div className="panel-head"><div><h2>Caméra locale</h2><span>getUserMedia · navigateur</span></div></div><div style={{aspectRatio:"16/10",background:"#061017",borderRadius:14,overflow:"hidden",border:"1px solid var(--line)",display:"grid",placeItems:"center"}}>{cameraOn?<video ref={videoRef} playsInline muted style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div className="empty-state"><Camera size={30}/><strong>Caméra inactive</strong><p>Autorisez la caméra du téléphone ou du PC pour le test.</p></div>}</div><canvas ref={canvasRef} hidden/><div style={{display:"flex",gap:8,marginTop:12}}>{!cameraOn?<button className="btn btn-primary" onClick={()=>void start()}><Camera size={15}/> Démarrer</button>:<><button className="btn btn-secondary" onClick={stop}>Arrêter</button><button className="btn btn-primary" onClick={()=>void recognize()} disabled={busy}><ScanFace size={15}/>{busy?"Analyse…":"Reconnaître"}</button></>}<button className="btn btn-secondary" onClick={()=>void simulate()} disabled={busy}><Play size={15}/> Simuler un événement</button></div></div><div className="panel"><div className="panel-head"><div><h2>Résultat</h2><span>Retour du moteur / pipeline métier</span></div><ImageUp size={18}/></div>{result?<pre style={{whiteSpace:"pre-wrap",wordBreak:"break-word",fontSize:11,color:"#b6cbc4"}}>{result}</pre>:<div className="empty-state"><strong>Prêt à tester</strong><p>Le bouton de simulation ne dépend pas du moteur IA. La reconnaissance réelle nécessite FACECOMPARE_API_URL sur l’environnement.</p></div>}</div></div></div>
}
