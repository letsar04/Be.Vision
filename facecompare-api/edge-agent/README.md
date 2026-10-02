# Be.Vision Edge Agent

Agent local destiné à un mini-PC, serveur ou machine du réseau du site.

Architecture:
caméra IP / RTSP -> Edge Agent -> FaceCompare API local -> Be.Vision Cloud.

Le smartphone n'est pas requis en production. Il est réservé au Labo de test.

## Lancement Docker

Copier .env.example vers .env, renseigner les paramètres, puis:

docker build -t bevision-edge-agent .
docker run --rm --env-file .env --network host bevision-edge-agent

L'agent:
- envoie un heartbeat toutes les 30 secondes;
- lit le flux RTSP;
- prend des images échantillonnées;
- demande la recherche d'identité au moteur FaceCompare;
- remonte face_recognized ou unknown_person;
- remonte camera_offline si le flux tombe;
- applique un cooldown pour éviter de créer des milliers d'événements.

Pour un déploiement réel, exécuter cet agent sur l'infrastructure du site, avec le flux vidéo conservé sur le réseau local autant que possible.
