"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="page-wrap centered-state">
      <div className="state-icon danger">!</div>
      <h1>Le centre de contrôle n’a pas pu charger les données</h1>
      <p>La connexion à l’espace de travail a dépassé le délai prévu ou a rencontré une erreur.</p>
      <button className="btn btn-primary" onClick={() => reset()}>Réessayer</button>
    </div>
  );
}
