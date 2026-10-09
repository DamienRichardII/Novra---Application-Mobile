# NOVRA — Application mobile
React Native + Expo (TypeScript strict, expo-router). Contexte produit : Project claude.ai « NOVRA - Application Mobile » (docs 00–14).
Lire aussi Damcompany-code-guardrails.md : modification chirurgicale, zéro régression, réponses courtes.
Règles : français partout dans l'UI ; noir/blanc/gris uniquement ; Barlow Condensed (titres, majuscules) + Inter ;
jamais de prix, stock ou statut de paiement décidé par le client ; aucune clé secrète ; aucune donnée inventée
(états vides explicites) ; URL/clé Supabase uniquement via variables EXPO_PUBLIC_* ; ne jamais porter les faux avis.
Pas de bouton « Marquer payée » dans l'admin.
Après chaque intervention : pas d'erreur console, pas de débordement 320–430 pt, panier persistant, boutons fonctionnels.
