# MTG Assassin PWA (Firebase / Firestore)

Ce projet est un squelette complet "Option 1" (calcul + classement côté client), basé sur ta logique Streamlit.

## 1) Prérequis
- Node.js 18+
- Un projet Firebase avec Firestore activé

## 2) Installation
```bash
npm install
npm run dev
```

## 3) Config Firebase
Crée un fichier `.env` à la racine (copie `.env.example`) et renseigne les valeurs depuis la console Firebase.

## 4) Firestore: code d’app
Dans Firestore, crée le document:
- Collection `config`
- Document `app`
- Champ `appCode` (string) ex: `mtg-potes-2026`

Dans l’app, tu entres ce code sur la page `/unlock`.

## 5) Règles Firestore
Copie le fichier `firebase/firestore.rules` dans ton projet Firebase et déploie.

## 6) Modèle de points
- Kill points:
  - cible == tueur: +2
  - cible == victime: +4
  - sinon: +1
- Placement points: + (i+1) selon l'ordre `placements` (morts + survivant en dernier)
- Bonus leader-kill: +1 si la victime était leader du classement global au début de la partie

## 7) Notes
- Lectures publiques (Chemin A). Écritures seulement si `appCode` correspond.
- Les kills sont stockés dans le document `games` (champ `kills`), simple pour démarrer.
