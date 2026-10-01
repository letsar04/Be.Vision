import "./globals.css";
import type { Metadata } from "next";
export const metadata:Metadata={title:"Be.Vision — Vision intelligence for teams",description:"Présence, contrôle d'accès et événements caméra pour les PME."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="fr"><body>{children}</body></html>}