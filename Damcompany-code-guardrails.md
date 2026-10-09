# DAMCOMPANY — CODE GUARDRAILS

Document de règles à placer à la racine d’un projet afin de guider Claude, Codex ou tout agent IA de développement.

Objectif : protéger les projets DamCompany contre les régressions, les modifications inutiles, les refontes non demandées, la surconsommation de tokens et les pertes de temps sur des corrections répétitives.

---

## 1. Règle absolue : aucune régression

Toute modification doit préserver l’existant validé.

L’agent IA doit :

- ne jamais supprimer une section validée sans demande explicite ;
- ne jamais modifier la direction artistique globale sans demande explicite ;
- ne jamais remplacer une image, une vidéo, une police ou une couleur validée sans instruction claire ;
- ne jamais refactoriser un fichier entier si la demande concerne une zone précise ;
- ne jamais modifier le header, le footer, la navigation ou les composants globaux si ce n’est pas demandé ;
- ne jamais casser le responsive mobile déjà validé ;
- ne jamais ajouter de contenu inventé ou non fourni par le client.

Chaque ligne modifiée doit pouvoir être justifiée directement par la demande.

---

## 2. Modification chirurgicale obligatoire

L’agent doit appliquer une méthode ultra ciblée.

Avant toute modification, il doit identifier :

- le fichier concerné ;
- la section concernée ;
- le problème exact ;
- la correction minimale nécessaire ;
- les éléments à ne surtout pas toucher.

Interdictions :

- réécrire toute une page pour une correction locale ;
- changer l’architecture sans demande ;
- renommer des classes sans nécessité ;
- nettoyer du code adjacent non concerné ;
- harmoniser, optimiser ou améliorer des zones non demandées ;
- modifier du contenu déjà validé client.

---

## 3. Simplicité avant complexité

L’agent doit toujours choisir la solution la plus simple qui résout réellement le besoin.

Il doit éviter :

- les abstractions inutiles ;
- les frameworks ou dépendances non demandés ;
- les systèmes complexes pour une simple correction ;
- les animations lourdes non nécessaires ;
- les fichiers supplémentaires inutiles ;
- les fonctions génériques si une correction locale suffit.

Si une solution peut être faite en 20 lignes au lieu de 200, elle doit être faite en 20 lignes.

---

## 4. Respect strict de l’identité visuelle

Pour tous les projets DamCompany, le rendu doit rester :

- premium ;
- moderne ;
- propre ;
- lisible ;
- cohérent ;
- mobile-first ;
- adapté au client final ;
- sans surcharge visuelle.

L’agent ne doit pas dégrader :

- les espacements ;
- l’alignement ;
- la hiérarchie typographique ;
- les contrastes ;
- les CTA ;
- les animations ;
- les images ;
- les vidéos ;
- la cohérence desktop/mobile.

---

## 5. Mobile-first obligatoire

Chaque modification visuelle doit être pensée d’abord pour mobile.

À vérifier systématiquement :

- pas de débordement horizontal ;
- pas de texte coupé ;
- pas d’image trop grande ;
- pas de vidéo mal cadrée ;
- pas de CTA inaccessible ;
- pas de section trop longue inutilement ;
- navigation claire sur petit écran ;
- lisibilité parfaite sur smartphone.

Une correction validée desktop mais cassée mobile est considérée comme non terminée.

---

## 6. Prompts courts, précis et économes en tokens

Les prompts destinés à Claude, Codex ou tout autre agent IA doivent être optimisés pour consommer le moins de tokens possible.

Règles obligatoires :

- aller directement au besoin ;
- éviter les répétitions inutiles ;
- éviter les longs contextes si le fichier `CLAUDE.md` ou ce fichier contient déjà les règles générales ;
- ne pas recopier tout le brief projet si seule une correction locale est demandée ;
- nommer précisément les fichiers et sections concernés ;
- séparer clairement : objectif, fichiers, actions, interdictions, vérifications ;
- utiliser des listes courtes ;
- limiter les descriptions subjectives ;
- éviter les phrases longues ;
- éviter les prompts multi-missions quand une seule correction suffit.

Format recommandé pour économiser les tokens :

```txt
Lis CLAUDE.md + Damcompany-code-guardrails.md.

Mission : [correction précise]

Fichier(s) :
- [nom du fichier]

À faire :
- [action 1]
- [action 2]

Interdictions :
- ne pas modifier [zone protégée]
- ne pas refactoriser
- ne pas changer la DA
- ne pas toucher au responsive sauf nécessité directe

Vérifier :
- desktop
- mobile
- absence de régression
- build OK

Réponse attendue :
- fichiers modifiés
- résumé court
- vérifications faites
```

---

## 7. Toujours définir un critère de réussite

Une tâche n’est terminée que si elle répond à un critère clair.

Exemples :

- le texte demandé est visible au bon endroit ;
- la section supprimée n’apparaît plus ;
- l’image est entièrement visible sur mobile ;
- le formulaire ne montre le dashboard qu’après connexion ;
- le build passe sans erreur ;
- aucune section non concernée n’a changé.

L’agent doit éviter les réponses vagues du type :

- “c’est corrigé” ;
- “ça devrait marcher” ;
- “j’ai amélioré le rendu”.

Il doit indiquer ce qui a été vérifié.

---

## 8. Réponse finale attendue de l’agent IA

Après chaque intervention, l’agent doit répondre de manière courte et structurée :

```txt
Fichiers modifiés :
- fichier-1.html
- style.css

Changements effectués :
- correction ciblée de [élément]
- aucun changement sur [zone protégée]

Vérifications :
- desktop OK
- mobile OK
- aucune régression constatée
- build OK si applicable

Points de vigilance :
- [uniquement si nécessaire]
```

Ne pas produire de longue explication si ce n’est pas nécessaire.

---

## 9. Gestion des fichiers et du Git

Avant modification :

- vérifier l’état du projet ;
- identifier la branche active ;
- ne pas écraser des changements non commités ;
- ne pas modifier des fichiers hors scope.

Après modification :

- lister les fichiers modifiés ;
- vérifier qu’aucun fichier inutile n’a été créé ;
- supprimer uniquement les fichiers temporaires créés par l’intervention ;
- ne pas supprimer de fichiers existants sans demande explicite.

Commandes de contrôle recommandées :

```bash
git status
git diff --stat
git diff
```

---

## 10. Règles pour les sites HTML / CSS / JavaScript

Pour les projets statiques :

- préserver la structure existante ;
- éviter les dépendances inutiles ;
- garder le CSS lisible ;
- ne pas dupliquer massivement le code ;
- ne pas casser les liens entre pages ;
- vérifier les chemins d’assets ;
- vérifier les images et vidéos sur mobile ;
- éviter les effets trop lourds ;
- préserver les sections validées.

---

## 11. Règles pour les projets Next.js / React

Pour les projets React ou Next.js :

- respecter l’architecture existante ;
- ne pas changer le routing sans demande ;
- ne pas modifier les composants globaux sans instruction ;
- ne pas ajouter de dépendance sans justification ;
- préserver les props et types existants ;
- vérifier le build ;
- corriger les erreurs TypeScript sans contourner abusivement les types ;
- ne pas désactiver ESLint ou TypeScript pour masquer une erreur.

---

## 12. Règles pour backend / API

Pour les projets backend :

- ne pas changer les endpoints existants sans demande ;
- ne pas modifier les schémas de base de données sans instruction claire ;
- ne pas casser les routes déjà branchées au frontend ;
- préserver les variables d’environnement existantes ;
- vérifier les migrations ;
- vérifier les logs de démarrage ;
- vérifier les routes de santé ;
- ne pas exposer de secrets ;
- ne pas inventer de credentials.

---

## 13. Règles pour les prompts de correction

Un bon prompt de correction DamCompany doit être :

- court ;
- précis ;
- localisé ;
- non ambigu ;
- orienté vérification ;
- protégé contre les régressions ;
- économique en tokens.

Structure recommandée :

```txt
MISSION CIBLÉE — [PROJET]

Lis CLAUDE.md + Damcompany-code-guardrails.md.

Objectif : [résultat attendu]

Fichier(s) à modifier :
- [fichier]

Actions :
- [action précise]

Ne pas toucher :
- [zone 1]
- [zone 2]

Vérifications :
- mobile
- desktop
- absence de régression
- build si applicable
```

---

## 14. Règles pour les prompts de refonte

Une refonte doit toujours préciser ce qui est protégé.

Le prompt doit indiquer :

- pages concernées ;
- sections concernées ;
- sections à préserver ;
- direction artistique attendue ;
- contraintes mobile ;
- contenus réels fournis ;
- éléments interdits ;
- critères de validation.

Interdiction de faire une refonte globale si la demande concerne uniquement une section.

---

## 15. Règles anti-contenu parasite

L’agent doit vérifier qu’aucun contenu technique ne devient visible sur le site.

À éviter absolument :

- `<!DOCTYPE html>` visible dans la page ;
- balises HTML affichées comme texte ;
- commentaires visibles ;
- placeholder oublié ;
- texte lorem ipsum non validé ;
- bouton de test ;
- console log inutile ;
- ancienne version de contenu mélangée à la nouvelle.

---

## 16. Règles de vérification finale

Avant de conclure, l’agent doit vérifier :

- fichiers modifiés cohérents avec la demande ;
- aucune modification hors scope ;
- rendu desktop correct ;
- rendu mobile correct ;
- aucune section validée supprimée ;
- aucun contenu parasite ;
- chemins assets corrects ;
- build ou lancement local OK si applicable.

---

## 17. Formule courte à utiliser dans tous les prompts

Pour économiser les tokens, cette phrase peut remplacer un long rappel de règles :

```txt
Respecte strictement CLAUDE.md + Damcompany-code-guardrails.md : modification chirurgicale, zéro régression, aucune refonte non demandée, prompt et réponse économes en tokens.
```

---

## 18. Priorité des règles

En cas de conflit :

1. demande explicite de l’utilisateur ;
2. sécurité et protection des données ;
3. absence de régression ;
4. modification chirurgicale ;
5. simplicité ;
6. optimisation tokens ;
7. amélioration esthétique.

Une amélioration esthétique ne doit jamais passer avant la stabilité du projet.

---

## 19. Conclusion

Ce fichier doit être utilisé comme garde-fou permanent pour tous les projets DamCompany.

Il sert à obtenir des interventions IA :

- plus courtes ;
- plus propres ;
- plus ciblées ;
- moins coûteuses en tokens ;
- plus fiables ;
- sans régression.

Toute IA travaillant sur un projet DamCompany doit lire et respecter ce fichier avant intervention.
