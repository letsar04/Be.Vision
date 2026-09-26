# 🔐 FaceCompare API — Identity Verification & KYC Microservice

Microservice de vérification d'identité (KYC) et de recherche d'empreinte faciale reposant à 100% sur les APIs REST de **InsightFace Server** (Computer Vision) et **Qdrant** (Base de données vectorielle).

---

## 🚀 Architecture & APIs

```
                           +------------------------+
                           |  Client / Application  |
                           +------------------------+
                                       |
                                       v
                          +-------------------------+
                          |   FaceCompare API       |
                          |   (FastAPI / Port 8000) |
                          +-------------------------+
                                 /          \
                                /            \
                               v              v
               +----------------------+  +---------------------+
               |  InsightFace Server  |  |  Qdrant Vector DB   |
               |  (Port 8080)         |  |  (Port 6333)        |
               +----------------------+  +---------------------+
```

- **InsightFace Server** : Extraction d'embeddings 512D, comparaison de visages 1:1, contrôle de qualité d'image.
- **Qdrant Vector DB** : Stockage vectoriel, audit trail des vérifications, recherche 1:N à grande échelle avec métadonnées.

---

## 🛠️ Endpoints API

### 1. Verification (1:1 Passeport vs Selfie)
- **`POST /api/v1/verify`**
  - **Form Data** :
    - `source_image` : Image de la pièce d'identité / passeport
    - `target_image` : Photo selfie live
    - `threshold` *(optionnel)* : Seuil de similarité [0.0 - 1.0] (défaut : 0.60)
  - **Réponse** : Score de similarité, résultat de matching, scores de qualité de visage, ID unique de vérification et stockage de l'audit log dans Qdrant.

### 2. Enrôlement d'Identité
- **`POST /api/v1/enroll`**
  - **Form Data** :
    - `image` : Photo du visage à enrôler
    - `person_id` : Identifiant unique de la personne
    - `name` *(optionnel)* : Nom complet
    - `external_id` *(optionnel)* : Identifiant externe (ex: numéro d'employé)
    - `metadata` *(optionnel)* : Chaîne JSON de métadonnées métier

### 3. Recherche 1:N
- **`POST /api/v1/search`**
  - **Form Data** :
    - `image` : Photo du visage à rechercher
    - `threshold` *(optionnel)* : Seuil de similarité
    - `limit` *(optionnel)* : Nombre de résultats max (défaut: 5)

### 4. Audit Log
- **`GET /api/v1/verifications/{verification_id}`**
  - Récupère l'enregistrement complet d'une vérification depuis Qdrant.

### 5. Health Check
- **`GET /health`**
  - Retourne l'état de santé du service et la connectivité vers InsightFace et Qdrant.

---

## 📦 Lancement avec Docker Compose

```bash
docker-compose up --build -d
```

L'API sera disponible sur `http://localhost:8000`. La documentation Swagger interactive est accessible sur `http://localhost:8000/docs`.

---

## ⚙️ Variables d'Environnement

| Variable | Valeur par défaut | Description |
|---|---|---|
| `INSIGHTFACE_URL` | `http://localhost:8080` | URL de l'API InsightFace Server |
| `INSIGHTFACE_API_KEY` | `None` | Clé d'API optionnelle |
| `QDRANT_URL` | `http://localhost:6333` | URL de l'API REST Qdrant |
| `QDRANT_API_KEY` | `None` | Clé d'API optionnelle |
| `DEFAULT_MATCH_THRESHOLD` | `0.60` | Seuil de décision par défaut |
