import Link from "next/link";
import { Activity, AlertTriangle, Camera, CheckCircle2, ClipboardClock, Users, ShieldCheck } from "lucide-react";

const events=[
  ["07:58","Arrivée","Awa Traoré","Entrée principale","0.98"],
  ["08:07","Arrivée","Moussa Kaboré","Atelier 1","0.96"],
  ["09:12","Zone restreinte","Inconnue","Local électrique","—"],
  ["10:21","Présence","Idrissa Zongo","Entrepôt","0.94"]
];

export default function DemoPage(){
  return <main className="container section-pad"><div className="page-title"><div><div className="eyebrow">Démo produit</div><h1>Un centre de contrôle, pas une simple caméra.</h1><p>Exemple visuel de ce qu’un responsable de site voit après déploiement des caméras et de l’agent local.</p></div><Link className="btn btn-primary" href="/login">Créer mon espace</Link></div><div className="kpi-grid"><DemoKpi icon={<Camera size={17}/>} v="18" l="Caméras surveillées"/><DemoKpi icon={<Users size={17}/>} v="142" l="Identités actives"/><DemoKpi icon={<ClipboardClock size={17}/>} v="126" l="Présents aujourd’hui"/><DemoKpi icon={<AlertTriangle size={17}/>} v="3" l="Incidents ouverts"/></div><div className="dashboard-grid section-card"><div className="panel"><div className="panel-head"><div><h2>Flux opérationnel</h2><span>Exemple</span></div><Activity size={17}/></div><table className="table"><thead><tr><th>Heure</th><th>Événement</th><th>Personne</th><th>Zone</th><th>Confiance</th></tr></thead><tbody>{events.map((e,i)=><tr key={i}><td>{e[0]}</td><td><strong>{e[1]}</strong></td><td>{e[2]}</td><td className="muted">{e[3]}</td><td>{e[4]}</td></tr>)}</tbody></table></div><div className="panel"><div className="panel-head"><div><h2>Posture du site</h2><span>Exemple</span></div><ShieldCheck size={17}/></div><div className="empty-state" style={{paddingTop:28}}><CheckCircle2 size={34} style={{color:"var(--accent)"}}/><strong>Opérations stables</strong><p>16/18 caméras joignables · 2 agents edge en ligne · 0 incident critique.</p></div></div></div></main>
}
function DemoKpi({icon,v,l}:{icon:React.ReactNode;v:string;l:string}){return <div className="kpi-card"><div className="kpi-top">{icon}<span>Live</span></div><div className="kpi-value">{v}</div><div className="kpi-label">{l}</div></div>}
