# Be.Vision

Be.Vision est une plateforme SaaS de supervision et d’intelligence vidéo pour les entreprises.

## Positionnement

Le smartphone n’est pas une caméra de production.

En production:
- caméras IP du site, généralement RTSP et compatibles avec les standards d’interopérabilité;
- agent Be.Vision installé sur un mini-PC, serveur ou machine du réseau local;
- moteur FaceCompare / InsightFace et Qdrant côté infrastructure de vision;
- Be.Vision Cloud pour les règles, présences, incidents, visiteurs, audit, analytique et facturation.

Le smartphone et la webcam du PC sont conservés dans le Labo de test maison.

## Flux métier

Caméra -> Edge Agent -> moteur vision -> événement -> policy engine -> action / incident -> centre de contrôle.

Pour une identité reconnue:
1. l’agent détecte un visage;
2. le moteur produit un embedding et recherche dans Qdrant avec le tenant de l’entreprise;
3. Be.Vision reçoit un événement face_recognized;
4. la première apparition ouvre une session de présence;
5. les apparitions suivantes prolongent la session;
6. les règles actives peuvent déclencher notification, revue ou incident.

## Modules SaaS

- Centre de contrôle multi-sites
- Caméras et zones
- Personnel et enrôlement
- Présences
- Visiteurs
- Règles et alertes
- Gestion d’incidents
- Agents de site
- Analytique
- Audit
- Apprentissage / versions de modèles
- Abonnement Stripe

## Déploiement

Le frontend Next.js est déployé sur Vercel.

Supabase fournit l’authentification et la donnée multi-tenant.

FaceCompare API et Qdrant sont destinés à être exécutés sur une infrastructure séparée, proche des sites ou dans une infrastructure contrôlée.

Chaque agent de site utilise un token dédié. Le cloud ne stocke que le hash du token.

## Variables Vercel

Variables publiques:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
- NEXT_PUBLIC_SITE_URL

Variables serveur:
- SUPABASE_SERVICE_ROLE_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- FACECOMPARE_API_URL

Les secrets ne doivent jamais être préfixés par NEXT_PUBLIC_ ni commités.

## Labo de test

/ dashboard / test-lab permet de:
- utiliser la caméra du navigateur sur PC ou smartphone;
- envoyer une capture au moteur vision quand FACECOMPARE_API_URL est configuré;
- simuler un événement complet pour tester présence, règles et incidents sans moteur IA.

## Roadmap entreprise

Les prochains blocs sont le contrôle d’accès matériel, le monitoring avancé des caméras, les connecteurs NVR/VMS, les notifications multicanales, les rapports exportables et l’amélioration continue du modèle avec revue humaine.

## Open Data Burkina

Be.Vision inclut maintenant un atelier **Open Data Burkina** sous `/dashboard/data`.

Fonctions :
- import sécurisé de CSV, JSON et GeoJSON depuis les sources open-data autorisées ;
- stockage multi-tenant dans Supabase avec RLS ;
- détection automatique des colonnes et conservation des géométries GeoJSON ;
- premières analyses : comptage, statistiques numériques et top catégories ;
- architecture prête à accueillir des connecteurs BODI, OpenStreetMap et des agents IA spécialisés.

Le portail BODI actuellement référencé par un site gouvernemental est **https://www.data.gov.bf/**. Utilisez l’URL directe d’un fichier public depuis cet espace dans l’importateur.
