import Link from "next/link";
import { CheckCircle2, Mail, RefreshCw } from "lucide-react";

export default function CheckEmailPage() {
  return <main className="login-shell">
    <section className="login-visual">
      <div>
        <a className="brand-lockup" href="/">
          <span className="brand-mark">B</span>
          <span>Be<span className="brand-dot">.</span>Vision</span>
        </a>
      </div>
      <div className="login-copy">
        <div className="eyebrow">Vérification de votre email</div>
        <h1>Votre compte est presque prêt.</h1>
        <p>
          Un message de confirmation vient d’être envoyé à votre adresse email.
          Ouvrez-le et cliquez sur le bouton de confirmation. Après validation,
          Be.Vision préparera automatiquement votre espace et ouvrira le centre de contrôle.
        </p>
        <div className="login-points">
          <div className="login-point"><span /> Ouvrez l’email de confirmation</div>
          <div className="login-point"><span /> Cliquez sur « Confirmer mon email »</div>
          <div className="login-point"><span /> Votre espace sera préparé automatiquement</div>
          <div className="login-point"><span /> Le centre de contrôle s’ouvrira ensuite</div>
        </div>
      </div>
    </section>
    <section className="login-panel">
      <div className="auth-card">
        <div className="onboarding-icon"><Mail size={25}/></div>
        <div className="eyebrow">Action requise</div>
        <h1>Vérifiez votre boîte mail</h1>
        <p className="auth-sub">
          Pensez à regarder dans les courriers indésirables ou l’onglet Promotions.
          Après confirmation, vous n’aurez pas à recréer votre compte.
        </p>
        <div className="auth-status info">
          <CheckCircle2 size={14} style={{ verticalAlign: "middle", marginRight: 6 }}/>
          Votre compte reste associé aux informations d’entreprise saisies.
        </div>
        <div style={{ display: "grid", gap: 8, marginTop: 18 }}>
          <Link className="btn btn-primary" href="/login"><RefreshCw size={15}/> Se connecter</Link>
          <Link className="btn btn-secondary" href="/">Retour à l’accueil</Link>
        </div>
      </div>
    </section>
  </main>;
}
