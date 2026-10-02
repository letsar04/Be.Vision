import Link from "next/link";
import { Activity, AlertTriangle, BarChart3, Camera, CheckCircle2, Cloud, Cpu, ShieldCheck, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="hero-shell">
      <header className="top-nav container">
        <Link className="brand-lockup" href="/">
          <span className="brand-mark">B</span>
          <span>Be<span className="brand-dot">.</span>Vision</span>
        </Link>
        <div className="top-nav-actions">
          <Link className="btn btn-secondary" href="/demo">Voir la démo</Link>
          <Link className="btn btn-primary" href="/login">Accéder à la plateforme</Link>
        </div>
      </header>

      <main>
        <section className="hero container">
          <div className="eyebrow">Physical security intelligence</div>
          <h1>Transformez vos caméras en centre d’opérations.</h1>
          <p>
            Be.Vision réunit caméras IP, reconnaissance, présence, alertes, incidents et analytique.
            Les caméras restent sur site ; le cloud orchestre les opérations et donne une vision multi-sites.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href="/login">Créer mon espace entreprise</Link>
            <Link className="btn btn-secondary" href="/demo">Explorer le produit</Link>
          </div>

          <div className="proof-strip">
            <div className="proof"><strong>Caméras IP</strong><span>RTSP / architecture prête pour ONVIF</span></div>
            <div className="proof"><strong>Présence automatique</strong><span>Arrivée, présence, départ et historique</span></div>
            <div className="proof"><strong>Alertes</strong><span>Règles métier et incidents centralisés</span></div>
            <div className="proof"><strong>Multi-sites</strong><span>Opérations et supervision depuis un seul écran</span></div>
          </div>
        </section>

        <section className="section-pad container">
          <div className="section-head">
            <div>
              <div className="eyebrow">Une plateforme, plusieurs usages</div>
              <h2>Pas seulement de la reconnaissance faciale.</h2>
              <p>Le produit est conçu autour des décisions opérationnelles que les entreprises veulent prendre, pas autour d'une simple caméra.</p>
            </div>
          </div>
          <div className="feature-grid">
            <Feature icon={<Camera size={18}/>} title="Supervision caméra" text="État des appareils, zones, agents de site, dernière activité et configuration des sources." />
            <Feature icon={<Users size={18}/>} title="Personnel & présence" text="Répertoire, enrôlement, horaires, sessions de présence, retards et départs." />
            <Feature icon={<AlertTriangle size={18}/>} title="Alertes & incidents" text="Une règle peut créer une action et un incident à traiter, avec traçabilité." />
            <Feature icon={<BarChart3 size={18}/>} title="Pilotage" text="Tendances d'activité, couverture des sites, présence et performance des systèmes." />
            <Feature icon={<Cpu size={18}/>} title="Edge / site" text="Un agent local relie les caméras du réseau de l'entreprise au cloud sans transformer le smartphone en caméra de production." />
            <Feature icon={<ShieldCheck size={18}/>} title="Gouvernance" text="Rôles, audit, statut des modèles et file de revue pour améliorer les décisions IA dans le temps." />
          </div>
        </section>

        <section className="product-band">
          <div className="product-grid container">
            <div>
              <div className="eyebrow">Architecture opérationnelle</div>
              <h2 style={{fontSize:34,letterSpacing:"-.04em",margin:"13px 0"}}>Le smartphone reste un outil de test. Le déploiement entreprise utilise des caméras adaptées.</h2>
              <p style={{color:"var(--muted)",lineHeight:1.7,maxWidth:700}}>
                Sur site, l’agent Be.Vision récupère les flux vidéo des caméras, exécute les traitements nécessaires,
                puis remonte les événements au cloud. Le centre de contrôle travaille avec les événements structurés plutôt qu’avec une vidéo brute permanente.
              </p>
            </div>
            <div className="arch-box">
              <div className="arch-title">Flux recommandé</div>
              <div className="arch-diagram">
                <ArchNode title="Caméras IP" text="RTSP / ONVIF, entrée, zones sensibles, parkings." />
                <ArchNode title="Agent de site" text="Serveur / mini-PC local, capture et IA edge." />
                <ArchNode title="Be.Vision Cloud" text="Règles, présence, incidents, analytique, administration." />
              </div>
            </div>
          </div>
        </section>

        <section className="section-pad container">
          <div className="section-head">
            <div>
              <div className="eyebrow">Parcours client</div>
              <h2>De l’installation à l’exploitation.</h2>
            </div>
          </div>
          <div className="flow">
            <Flow n="01" title="Créer l’espace" text="Entreprise, sites, utilisateurs et politiques." />
            <Flow n="02" title="Déclarer les caméras" text="RTSP / webcam / mode de test, avec zone et statut." />
            <Flow n="03" title="Enrôler le personnel" text="Identité métier puis capture contrôlée pour l'empreinte." />
            <Flow n="04" title="Installer l’agent de site" text="Connexion des caméras du réseau local au cloud." />
            <Flow n="05" title="Exploiter" text="Présences, alertes, incidents, investigations et KPI." />
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container">Be.Vision · plateforme de vision opérationnelle · 14 jours d’essai · mode de test smartphone réservé aux pilotes</div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="feature"><div className="feature-icon">{icon}</div><h3>{title}</h3><p>{text}</p></div>;
}
function ArchNode({ title, text }: { title: string; text: string }) {
  return <div className="arch-node"><strong>{title}</strong><span>{text}</span></div>;
}
function Flow({ n, title, text }: { n: string; title: string; text: string }) {
  return <div className="flow-step"><div className="flow-no">{n}</div><div><strong>{title}</strong><span>{text}</span></div></div>;
}
