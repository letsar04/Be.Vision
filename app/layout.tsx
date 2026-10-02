import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Be.Vision — Physical security & workforce intelligence",
  description: "Caméras IP, présence, contrôle d'accès, alertes et analytique dans une plateforme cloud.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fr"><body>{children}</body></html>;
}
