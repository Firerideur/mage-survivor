# Mage Survivor — app mobile qui se met à jour

Le dossier contient une **PWA** complète : `index.html`, `manifest.webmanifest`,
`sw.js` et les icônes. Une fois en ligne, c'est une vraie app sur l'écran d'accueil,
plein écran, hors ligne, avec sauvegarde locale.

## Mise en ligne (à faire une seule fois, ~5 minutes)

1. Va sur **github.com** → *New repository* → nom : `mage-survivor` → **Public** → *Create*.
2. Sur la page du dépôt : *Add file* → *Upload files* → dépose **les 6 fichiers**
   de ce dossier → *Commit changes*.
3. *Settings* → *Pages* → **Source : Deploy from a branch**, branche `main`, dossier `/ (root)`
   → *Save*.
4. Attends ~1 minute. L'URL apparaît en haut de la page Pages :
   `https://TON-PSEUDO.github.io/mage-survivor/`

## Installation sur le téléphone

- **iPhone** : ouvre l'URL dans **Safari** (obligatoire, pas Chrome) →
  bouton Partager → *Sur l'écran d'accueil*.
- **Android** : ouvre l'URL dans Chrome → menu ⋮ → *Ajouter à l'écran d'accueil*.

## Le cycle de mise à jour

À chaque nouvelle version que je te donne :

1. Tu remplaces `index.html` dans le dépôt (*Add file → Upload files*, même nom,
   ça écrase) et `sw.js` s'il a changé.
2. GitHub Pages republie tout seul en ~30 s.
3. Tu ouvres l'app : elle récupère la nouvelle version automatiquement.
   Si l'ancienne s'affiche encore, ferme-la complètement et rouvre-la.

Le service worker sert `index.html` en **réseau d'abord** : tu as toujours la
dernière version quand tu as du réseau, et la dernière connue quand tu n'en as pas.
Ta progression (éclats, recherche, sujets débloqués) vit dans le stockage local
du téléphone et **survit aux mises à jour**.

## Sans mise en ligne

Tu peux ouvrir `index.html` directement depuis le téléphone : tout fonctionne
sauf l'installation propre sur l'écran d'accueil et la mise à jour automatique.
Il faudra alors rouvrir le nouveau fichier à chaque version.
