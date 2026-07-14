# Gestion Commerciale — Application Django (MVT)

Application de gestion commerciale inspirée de logiciels professionnels type Sage Saari, développée en Django selon l'architecture **MVT (Model - Vue - Template)**.

## Objectif du projet

Permettre à une entreprise de gérer efficacement :
- ses clients et fournisseurs ;
- ses produits et catégories ;
- ses achats et ventes ;
- son stock en temps réel ;
- ses factures et règlements ;
- ses utilisateurs et leurs rôles ;
- des tableaux de bord décisionnels (achats, ventes, produits, stock, finances).

Le projet est enrichi de fonctionnalités professionnelles supplémentaires liées à la gestion financière et au stock :
1. **Gestion du stock de sécurité et réapprovisionnement intelligent** — détection des risques de rupture, calcul des jours de couverture, suggestion automatique de quantité à commander.
2. **Calcul automatique de la marge et de la rentabilité** — marge unitaire, marge par vente, marge par produit, marge globale, classement des produits les plus rentables.
3. **Gestion financière avancée des factures** — suivi des échéances, factures en retard, créances/dettes par ancienneté, alertes de paiement.

## Architecture du projet

Le projet suit une organisation modulaire, avec toutes les applications regroupées dans un dossier `apps/` pour une meilleure maintenabilité :

```
gestion_commercial/
├── config/                  # Projet principal Django (settings, urls, wsgi, asgi)
│
├── apps/
│   ├── users/                # Utilisateurs & rôles (Custom User)
│   ├── produits/              # Produits & catégories
│   ├── clients/               # Clients
│   ├── fournisseurs/          # Fournisseurs
│   ├── achats/                # Achats & factures d'achat
│   ├── ventes/                # Ventes & factures de vente
│   ├── stocks/                # Mouvements de stock
│   ├── factures/              # Facturation (achat/vente)
│   ├── reglements/            # Règlements et suivi des paiements
│   └── dashboard/             # Tableaux de bord décisionnels
│
├── templates/                 # Templates globaux, organisés par application
└── manage.py
```

### Convention de nommage des applications

Chaque application déclarée dans `INSTALLED_APPS` utilise l'alias `apps.<nom_application>` :

```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    "apps.users",
    "apps.achats",
    "apps.clients",
    "apps.dashboard",
    "apps.factures",
    "apps.fournisseurs",
    "apps.produits",
    "apps.reglements",
    "apps.stocks",
    "apps.ventes",
]
```

En cohérence avec cet alias, chaque `apps.py` a été adapté avec un `label` explicite, par exemple pour `users` :

```python
from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.users'
    label = "users"
```

Le `label` court (`users`, `produits`, etc.) permet à Django de référencer proprement les modèles (`users.User`, `produits.Produit`, ...) malgré le chemin d'import complet `apps.<nom>`.

## Commandes exécutées, phase par phase

### Phase 1 — Création du dossier racine du projet
```bash
mkdir gestion_commercial
cd gestion_commercial
```

### Phase 2 — Création de l'environnement virtuel et installation de Django
```bash
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux / Mac

pip install django
```

### Phase 3 — Création du projet `config`
```bash
django-admin startproject config .
```
*(le `.` permet de créer `config/` directement à la racine de `gestion_commercial/`, sans dossier intermédiaire redondant)*

### Phase 4 — Création des dossiers structurants à la racine
```bash
mkdir templates
mkdir static
mkdir media
mkdir apps
```

### Phase 5 — Création des applications dans `apps/`
```bash
cd apps

django-admin startapp users
django-admin startapp clients
django-admin startapp fournisseurs
django-admin startapp produits
django-admin startapp achats
django-admin startapp ventes
django-admin startapp stocks
django-admin startapp factures
django-admin startapp reglements
django-admin startapp dashboard

cd ..
```

### Phase 6 — Ajout d'un `__init__.py` dans `apps/` (pour en faire un package Python)
```bash
type nul > apps\__init__.py        # Windows
# touch apps/__init__.py           # Linux / Mac
```

### Phase 7 — Modification de `apps.py` pour chaque application
Pour chaque application, adaptation de `name` avec le préfixe `apps.` et ajout d'un `label` explicite, par exemple pour `users` :
```python
from django.apps import AppConfig

class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.users'
    label = "users"
```
*(même logique répétée pour `clients`, `fournisseurs`, `produits`, `achats`, `ventes`, `stocks`, `factures`, `reglements`, `dashboard`)*

Puis déclaration dans `config/settings.py` :
```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    "apps.users",
    "apps.achats",
    "apps.clients",
    "apps.dashboard",
    "apps.factures",
    "apps.fournisseurs",
    "apps.produits",
    "apps.reglements",
    "apps.stocks",
    "apps.ventes",
]
```

### Phase 8 — Installation de la dépendance PostgreSQL
```bash
pip install psycopg2-binary
```

### Phase 9 — Connexion à la base de données PostgreSQL
Configuration initiale dans `config/settings.py` :
```python
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "gestion_commerciale_db",
        "USER": "postgres",
        "PASSWORD": "********",
        "HOST": "localhost",
        "PORT": "5432",
    }
}
```

### Phase 10 — Externalisation des informations sensibles dans `.env`
```bash
pip install django-environ
```
Création du fichier `.env` à la racine :
```
DEBUG=True
SECRET_KEY=django-insecure-xxxxxxxxxxxxxxxx
DB_NAME=gestion_commerciale_db
DB_USER=postgres
DB_PASSWORD=********
DB_HOST=localhost
DB_PORT=5432
```
Utilisation dans `config/settings.py` :
```python
import environ
import os

env = environ.Env()
environ.Env.read_env(os.path.join(BASE_DIR, ".env"))

SECRET_KEY = env("SECRET_KEY")
DEBUG = env.bool("DEBUG", default=False)

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": env("DB_NAME"),
        "USER": env("DB_USER"),
        "PASSWORD": env("DB_PASSWORD"),
        "HOST": env("DB_HOST"),
        "PORT": env("DB_PORT"),
    }
}
```
*(penser à ajouter `.env` dans `.gitignore`)*

### Phase 11 — Création des modèles (Models)
Rédaction de `models.py` pour chaque application (`users`, `produits`, `clients`, `fournisseurs`, `achats`, `ventes`, `stocks`, `factures`, `reglements`), conformément au cahier des charges fourni.

### Phase 12 — Résolution de l'erreur de migration sur `users`
```bash
mkdir apps\users\migrations
type nul > apps\users\migrations\__init__.py
```
Réorganisation de `INSTALLED_APPS` avec `apps.users` en première position, puis :
```bash
python manage.py makemigrations users
```
Repartir sur une base propre (le projet venant de démarrer) :
```sql
DROP DATABASE gestion_commerciale_db;
CREATE DATABASE gestion_commerciale_db;
```
```bash
python manage.py makemigrations
python manage.py migrate
```

### Phase 13 — Création du premier compte administrateur
```bash
python manage.py createsuperuser
```

### Phase 14 — Mise en place des templates du module `users`
```bash
mkdir templates\users
type nul > templates\users\login.html
```

### Phase 15 — Formulaires, vues et URLs du module `users`
- Création de `apps/users/forms.py` (`UserCreationFormCustom`, `UserUpdateForm`).
- Création de `apps/users/urls.py` (routes nommées sous le namespace `users`).
- Rédaction des vues dans `apps/users/views.py` (`LoginViewCustom`, `LogoutViewCustom`, `UserListView`, `UserCreateView`, `UserUpdateView`, `UserDeleteView`).
- Inclusion des routes dans `config/urls.py` :
```python
urlpatterns = [
    path("admin/", admin.site.urls),
    path("users/", include("apps.users.urls")),
]
```

### Vérification à ce stade
```bash
python manage.py runserver
```
Puis ouverture de `http://127.0.0.1:8000/users/login/`.

## Étapes réalisées jusqu'à présent

### 1. Mise en place du projet et de la base de données
- Création du projet Django avec la structure `config/` + `apps/`.
- Connexion à une base **PostgreSQL** (`gestion_commerciale_db`).
- Définition d'un **Custom User** (`AUTH_USER_MODEL = "users.User"`) avec des rôles métier (Admin, Commercial, Caissier, Gestionnaire de stock).

### 2. Résolution des problèmes de migrations
- Erreur rencontrée : `ValueError: Dependency on app with no migrations: users`.
- Cause : absence du dossier `migrations/` et de la migration initiale pour l'app `users`, alors que d'autres apps en dépendent via le Custom User.
- Résolution :
  - création du dossier `apps/users/migrations/` avec un `__init__.py` ;
  - repositionnement de `apps.users` en tête de `INSTALLED_APPS` ;
  - génération de la migration initiale dédiée avant les autres : `python manage.py makemigrations users` ;
  - recréation propre de la base PostgreSQL pour repartir sur un schéma cohérent avec le Custom User ;
  - exécution de `makemigrations` puis `migrate` sur l'ensemble du projet.

### 3. Conception des modèles (Models)
- Modélisation complète des entités métier : produits, catégories, clients, fournisseurs, achats, ventes, factures, règlements, mouvements de stock, utilisateurs/rôles.
- Prise en compte dès la conception des champs nécessaires aux fonctionnalités avancées (seuil d'alerte, stock de sécurité, prix d'achat/vente, etc.).

### 4. Démarrage de la couche Vues (Views) — Module `users`

Mise en place du premier module fonctionnel complet, choisi en priorité car toutes les autres applications (ventes, achats, stock, règlements) dépendent de l'utilisateur connecté.

**Organisation du module :**
```
apps/users/
├── migrations/
├── models.py
├── forms.py
├── views.py
├── urls.py
├── admin.py
└── templates/users/
    ├── login.html
    ├── user_list.html
    ├── user_form.html
    └── user_confirm_delete.html
```

**Formulaires (`forms.py`)** — basés sur `UserCreationForm` et `UserChangeForm` de Django afin de bénéficier nativement de :
- la validation de mot de passe (`password1` / `password2`) ;
- le hashage automatique du mot de passe (jamais de mot de passe en clair) ;
- les validations de sécurité standard de Django.

**Vues (`views.py`)** — utilisation des **Class Based Views** génériques pour limiter le code répétitif :
- `LoginViewCustom` / `LogoutViewCustom` : authentification ;
- `UserListView` : liste des utilisateurs ;
- `UserCreateView` : création d'un utilisateur ;
- `UserUpdateView` : modification (sans re-saisie du mot de passe) ;
- `UserDeleteView` : suppression avec confirmation.

**URLs (`urls.py`)** — routes nommées sous le namespace `users` (`users:login`, `users:list`, `users:create`, `users:update`, `users:delete`), incluses dans `config/urls.py` via `include("apps.users.urls")`.

## Stratégie retenue pour la suite du développement

Ordre de développement des modules restants, chaque étape s'appuyant sur la précédente :

1. **Produits** — CRUD + catégories, avec seuil d'alerte et stock de sécurité déjà présents dans le modèle.
2. **Clients** — CRUD + historique d'achats.
3. **Fournisseurs** — CRUD + historique de livraisons.
4. **Achats** — création d'un achat avec lignes d'articles, génération automatique de la facture d'achat, mise à jour automatique du stock (entrée), gestion des échéances de paiement.
5. **Ventes** — même logique que les achats, avec sortie de stock automatique et règlements en un ou plusieurs versements.
6. **Règlements** — enregistrement des paiements (date, montant, mode, solde restant), suivi des factures soldées/non soldées.
7. **Factures** — génération automatique (achat/vente), calcul HT/TVA/TTC, export/impression (piste retenue : **ReportLab** côté Python pour une génération PDF server-side, cohérente avec une architecture full Django).
8. **Dashboard** — indicateurs décisionnels sur achats, ventes, produits, stock et finances.

### Choix techniques structurants
- **CRUD simples** (produits, clients, fournisseurs, utilisateurs) : Class Based Views génériques Django (`ListView`, `CreateView`, `UpdateView`, `DeleteView`) avec `ModelForm`.
- **Opérations métier complexes** (achats, ventes) : vues fonctionnelles classiques encapsulées dans `transaction.atomic()`, afin de garantir que la création de la facture, la mise à jour du stock et l'enregistrement de la vente/achat soient traitées comme une seule opération indivisible (annulation complète en cas d'échec).
- **Sécurité et rôles** : mise en place prévue du décorateur `@login_required` et de contrôles d'accès selon le rôle de l'utilisateur (ex. seul un Admin peut créer un utilisateur, un Caissier gère uniquement les règlements).

## État actuel
✅ Structure du projet et des applications
✅ Base de données PostgreSQL fonctionnelle avec Custom User
✅ Modèles de données complets
✅ Module `users` : formulaires, vues CRUD et routes en place
🔄 Prochaine étape : templates du module `users`, puis démarrage du module `produits`