# MTG-Assassination-Firebase
🗡️ MTG Assassination – PWA

MTG Assassination est une Progressive Web App (PWA) destinée à gérer le mode de jeu Assassin sur Magic: The Gathering.

L’application permet de :

gérer les joueurs et leurs decks

créer et suivre des parties Assassin

saisir les kills en temps réel (un seul téléphone fait l’arbitrage)

calculer automatiquement les points selon les règles du mode Assassin

conserver l’historique des parties

afficher un classement global cumulatif (points, victoires, parties jouées)

✨ Fonctionnalités clés

📱 PWA installable (mobile-first, fluide, rapide)

🧮 Calcul des scores fidèle aux règles Assassin

🗂️ Historique complet des parties

🏆 Classement global avec accumulation des points

🔐 Accès par code global (sans compte, sans login)

🔄 Parties en parallèle possibles

☁️ Données stockées sur Firebase Firestore

🛠️ Stack technique

Frontend : React + TypeScript + Vite

Backend : Firebase Firestore

Architecture : client-side scoring (sans Cloud Functions)

Sécurité : écriture protégée par code global (niveau 1)

Déploiement : Firebase Hosting (ou équivalent)

🎯 Philosophie du projet

Ce projet est pensé pour un usage entre amis :

pas de comptes utilisateurs

pas de contraintes d’authentification

un seul téléphone gère la saisie, mais tout le monde peut jouer et reprendre la main

priorité à la simplicité, la fluidité et le fun
