import Link from "next/link";
import { getWorkspaceContext } from "../../lib/workspace";
import { WorkspaceRepair } from "../../components/WorkspaceRepair";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const context = await getWorkspaceContext();

  if (!context) {
    return <main className="login-shell">
      <section className="login-panel" style={{ gridColumn: "1 / -1" }}>
        <div className="auth-card">
          <div className="eyebrow">Session requise</div>
          <h1>Connectez-vous pour continuer</h1>
          <p className="auth-sub">Votre espace entreprise doit être associé à un compte Be.Vision.</p>
          <Link className="btn btn-primary" href="/login">Retour à la connexion</Link>
        </div>
      </section>
    </main>;
  }

  return <main className="login-shell">
    <section className="login-visual">
      <div>
        <a className="brand-lockup" href="/">
          <span className="brand-mark">B</span>
          <span>Be<span className="brand-dot">.</span>Vision</span>
        </a>
      </div>
      <div className="login-copy">
        <div className="eyebrow">Première mise en route</div>
        <h1>Votre centre de contrôle va être prêt dans quelques secondes.</h1>
        <p>
          Nous préparons l’environnement de votre entreprise avant de vous donner accès
          aux caméras, au personnel, aux visiteurs, aux alertes, aux incidents et à l’analytique.
        </p>
        <div className="login-points">
          <div className="login-point"><span /> Espace entreprise</div>
          <div className="login-point"><span /> Site principal</div>
          <div className="login-point"><span /> Règles de sécurité initiales</div>
          <div className="login-point"><span /> Centre de contrôle</div>
        </div>
      </div>
    </section>
    <section className="login-panel"><WorkspaceRepair /></section>
  </main>;
}
