# Améliorer Systématiquement Votre Système RAG (Jason Liu)

**Source** : [https://jxnl.co/writing/2024/05/22/systematically-improving-your-rag/](https://jxnl.co/writing/2024/05/22/systematically-improving-your-rag/)

---

## Introduction

Cet article explique comment améliorer méthodiquement les systèmes de **Génération Augmentée par Récupération (RAG — Retrieval-Augmented Generation)**. Il s'appuie sur les retours d'expérience de Jason Liu et s'inscrit dans une série d'articles complémentaires :
- *RAG is More Than Just Embeddings* : pourquoi le RAG ne se résume pas aux vecteurs d'embeddings.
- *How to Build a Terrible RAG System* : les anti-patterns à éviter pour adopter les bonnes pratiques.
- *Levels of RAG Complexity* : décomposition des architectures RAG par niveaux de complexité.
- *Low Hanging Fruit in RAG* : améliorations rapides et à fort impact.
- *Predictions for the Future of RAG* : évolution des systèmes RAG vers la génération automatisée de rapports.

À travers ce guide pratique étape par étape, nous aborderons les piliers suivants (qui ont inspiré l'architecture d'évaluation de **Mirror Agent** dans `utils/generate_synthetic_questions.py` et `utils/eval_rag_pipeline.py`) :
1. **Générer des questions et réponses synthétiques** pour tester rapidement les performances de récupération.
2. **Exploiter les métadonnées** et la compréhension des requêtes (*query understanding*).
3. **Combiner recherche plein texte (full-text) et recherche vectorielle** pour de meilleurs résultats.
4. **Mettre en place des mécanismes clairs de retour utilisateur (feedback)**.
5. **Regrouper (clustering) et modéliser les thématiques** pour identifier les lacunes par sujet et par capacité.
6. **Surveiller et expérimenter en continu** à mesure que les données réelles arrivent.
7. **Équilibrer latence et performance** selon les exigences métier.

---

## 1. Commencer avec des Données Synthétiques

L'erreur la plus fréquente lors de l'optimisation d'un système RAG consiste à passer trop de temps sur la synthèse (le prompt de réponse) sans vérifier au préalable si les données pertinentes sont correctement récupérées par le retriever.

Pour éviter cet écueil :
- **Créez des questions synthétiques** pour chaque segment de texte (*chunk*) de votre base de données (voir [`utils/generate_synthetic_questions.py`](../utils/generate_synthetic_questions.py)).
- **Utilisez ces questions pour tester votre système de recherche** (voir [`utils/eval_rag_pipeline.py`](../utils/eval_rag_pipeline.py)).
- **Calculez les scores de précision et de rappel (recall)** afin d'établir une ligne de base (*baseline*).
- **Identifiez les axes d'amélioration** à partir de ces scores initiaux.

Avec des données synthétiques simples, on vise généralement un rappel d'environ **97 %**. En pratique, les performances varient fortement selon la nature des documents : sur des essais généraux, la recherche plein texte et la recherche par embeddings peuvent afficher des performances similaires (la recherche plein texte étant jusqu'à 10 fois plus rapide), tandis que sur des tickets ou issues GitHub, la recherche plein texte peut plafonner autour de 55 % de rappel contre 65 % pour les embeddings. Connaître cette ligne de base est indispensable pour orienter vos expérimentations.

---

## 2. Exploiter les Métadonnées

S'assurer que les métadonnées pertinentes (plages de dates, noms de fichiers, auteur/propriétaire, identifiant utilisateur `user_id`) sont extraites et interrogeables est essentiel pour améliorer la pertinence des résultats :
- Extrayez les métadonnées pertinentes de vos documents lors de l'indexation (ex. `utils/obsidian_indexer.py` et `ensure_docs_have_user_id` dans `src/retrieval_graph/index_graph.py`).
- Incluez ces métadonnées dans vos index de recherche.
- Utilisez la compréhension de requête (*query understanding*, comme le nœud `generate_query` dans `src/retrieval_graph/graph.py`) pour extraire ou reformuler les critères temporels et contextuels.
- Enrichissez les requêtes de recherche avec ces métadonnées.

Par exemple, si un utilisateur demande : *« Quels sont les derniers développements sur X ? »*, ni la recherche lexicale ni la recherche sémantique pure ne savent ce que signifie « derniers » sans interprétation de la date (`system_time`) et filtrage sur les métadonnées temporelles.

---

## 3. Combiner Recherche Plein Texte et Recherche Vectorielle (et Re-ranking)

Utilisez conjointement la recherche plein texte (lexicale) et la recherche vectorielle (embeddings) — ou un pipeline de récupération large suivi d'un **re-ranker** — pour récupérer les documents les plus pertinents, idéalement au sein d'un système unifié afin d'éviter les problèmes de désynchronisation entre plusieurs bases de données.

- Testez les performances de chaque méthode sur votre cas d'usage spécifique.
- Privilégiez une base unique ou un pipeline cohérent (dans **Mirror Agent**, `src/retrieval_graph/retrieval.py` récupère `k=20` candidats dans ChromaDB avec `BAAI/bge-large-en-v1.5` puis applique une compression contextuelle via `CohereRerank` avec `rerank-english-v3.0`).
- Évaluez les compromis entre vitesse d'exécution et rappel.

---

## 4. Mettre en Place des Mécanismes Clairs de Retour Utilisateur

L'intégration de mécanismes de feedback explicites (ex. pouce haut / pouce bas) est indispensable pour collecter des données réelles sur les performances du système :
- Ajoutez des mécanismes de retour utilisateur dès les premières versions.
- Formulez explicitement la question associée au feedback : préférez une question précise comme *« Avons-nous répondu correctement à votre question ? (Oui / Non) »* plutôt qu'une question vague qui mélangerait l'exactitude factuelle, le ton de la réponse et la latence.
- Utilisez ces retours pour construire un jeu de données d'évaluation réel et prioriser les correctifs.

---

## 5. Regrouper (Clustering) et Modéliser les Thématiques

Analysez les requêtes des utilisateurs et leurs retours pour identifier deux grands types de motifs :
1. **Groupes thématiques (Topic Clusters)** : Les utilisateurs posent-ils fréquemment des questions sur un sujet précis pour lequel la documentation est obsolète ou absente ?
2. **Lacunes de capacités (Capability Gaps)** : Existe-t-il des catégories entières de questions auxquelles le système ne sait pas répondre par construction (ex. synthèse multi-documents, comparaison, raisonnement logique complexe — d'où l'ajout du nœud `should_reason` / `apply_reasoning` dans Mirror Agent) ?

Une fois ces catégories identifiées avec les experts du domaine, il est possible de classifier automatiquement chaque nouvelle requête entrante (thématique + capacité requise) et de suivre l'évolution de la satisfaction par segment.

---

## 6. Surveiller et Expérimenter en Continu

- Mettez en place une journalisation structurée et un suivi des performances dans le temps (ex. `utils/gcp_logging.py` et `weave` dans `utils/eval_rag_pipeline.py`).
- Concevez et exécutez des expériences (modification des paramètres de recherche `search_kwargs`, changement de modèle d'embedding, ajustement du chunking).
- Mesurez systématiquement l'impact de chaque modification sur la précision et le rappel avant de la déployer.

---

## 7. Équilibrer Latence et Performance

Enfin, prenez des décisions éclairées concernant le compromis entre la latence du système et la qualité de recherche en fonction des besoins de vos utilisateurs :
- Si une fonctionnalité double le rappel au prix d'une hausse de 20 % de la latence, le gain est généralement décisif.
- À l'inverse, si la latence double pour un gain de 1 % de rappel, la pertinence dépend du domaine d'application (critique pour un outil d'aide au diagnostic médical ou d'analyse approfondie, mais pénalisant pour une recherche documentaire rapide).
- Votre jeu de questions synthétiques vous permet de mesurer objectivement à la fois le gain de rappel et le coût en latence de chaque composant.
