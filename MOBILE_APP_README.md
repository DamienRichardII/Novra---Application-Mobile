# NOVRA — Application mobile (V1)

Expo SDK 57 · React Native 0.86 · TypeScript strict · expo-router · Supabase (lecture publique + Edge Functions).

## Commandes
```bash
npm install
npm start            # Expo (QR code → Expo Go / simulateur)
npm run web          # version web locale
npm run typecheck && npm run lint && npm test   # 29 tests
npm run snapshot     # régénère src/data/catalogue-fallback.json depuis la base
npx expo export --platform web                  # build web → dist/
```

## Variables d'environnement (publiques uniquement)
Voir `.env.example` : `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `EXPO_PUBLIC_MEDIA_BASE`, `EXPO_PUBLIC_SITE_URL`.
Aucun secret côté app (ni `service_role`, ni clés SumUp/Resend — elles restent dans les secrets Supabase).

## Publier : GitHub puis Vercel
1. `git init && git add . && git commit -m "NOVRA mobile V1"` puis push vers `DamienRichardII/Novra---Application-Mobile`.
2. Vercel → Import du dépôt. `vercel.json` fournit : build `npx expo export --platform web`, sortie `dist`, réécriture SPA.
3. Ajouter les 4 variables `EXPO_PUBLIC_*` dans Vercel (Settings → Environment Variables), puis déployer.

## Mobile natif
- Test sur téléphone : Expo Go (`npm start`). Build : EAS (`eas build`) — profils EAS et soumission stores **non configurés** en V1.
- Identifiants : scheme `novra`, bundle/package `paris.novra.app`.

## Ce qui fonctionne (V1)
Accueil piloté par le CMS (hero vidéo) · Shop (recherche, filtres, tri, ajout rapide) · Fiche produit (galerie, zoom, tailles, accordéons) · Favoris · Panier persistant · Checkout 4 étapes (livraison, relais, retrait) · Paiement SumUp en navigateur avec relecture serveur de `order-status` (le panier n'est vidé que si `paid`) · Suivi de commande + reçu PDF · Pages À propos / Contact / Légal · Espace pro (admin : dashboard, commandes, stocks, prix avec confirmation, rôles, verrouillage 5 min).
Catalogue : base live → cache → snapshot embarqué (18 produits).

## Vérifié / non vérifié
- Vérifié : typecheck, lint, 29 tests, export web, rendu navigateur mobile 390 px (accueil, shop, fiche, commandes, favoris, à propos, login admin), contrat `create-order` sondé avec des corps invalides.
- **Non vérifié** : paiement réel de bout en bout (pour ne pas créer de vraies commandes), appareils iOS/Android physiques, admin connecté (pas d'identifiants).

## Points ouverts / différés
- Paiement : peut échouer tant que les clés SumUp ne sont pas dans les secrets Supabase (doc 12, point bloquant n°1).
- Une commande de test existe en base (NVR-260929-P703).
- Pages légales incomplètes côté site.
- Différé : déverrouillage biométrique, bascule `track_inventory` (tous stocks à 0 → bloquerait toute vente ; avertissement seulement), édition photos / promotions / clients en admin, notifications push (backend B2/B3), retour profond `client:'app'` (B1), liens universels, Sentry, profils EAS, thème clair, guide des tailles (aucune donnée source — non inventé).
- Icône 1024 px agrandie depuis un 512 px : à remplacer par un master.

## Recette R1–R17
À exécuter sur appareil avec les clés SumUp en place (voir doc 13). Statut actuel : parcours catalogue/panier/checkout OK en navigateur ; R paiement et admin à valider.
