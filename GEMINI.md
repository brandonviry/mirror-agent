# GEMINI.md — Conditionnement et Méthode de Travail de l'Agent

Ce fichier définit la posture, la langue, le format de communication, les principes de prudence et la méthode de travail de l'agent IA sur ce projet (en remplacement et modernisation de [`.windsurfrules`](./.windsurfrules), et en complément de [`AGENTS.md`](./AGENTS.md)).

---

## 1. Langue & Communication

- **Échanges avec l'utilisateur** : Toujours répondre en **français**, avec un ton direct, précis et professionnel.
- **Documentation du projet** : Rédiger et maintenir toute la documentation projet (`README.md`, `AGENTS.md`, `GEMINI.md`, fichiers internes de `docs/`) en **français**.
- **Code source & Docstrings (`src/`, `tests/`, `utils/`)** : Conserver les noms de variables, fonctions, classes, messages de logs techniques et docstrings Python en **anglais** afin de respecter les règles de linting du dépôt (`pydocstyle` convention Google, `D401`, `codespell`).

---

## 2. Format des Réponses

- **Concision et Clarté** : Aller droit au but. Éviter les introductions superflues et les répétitions du contenu déjà visible dans les diffs.
- **Markdown Structuré** : Utiliser des listes à puces, des tableaux synthétiques et des blocs de code typés lorsque cela facilite la lecture.
- **Traçabilité systématique** : Toujours fournir des liens cliquables vers les fichiers et les lignes concernés (ex. [`mem0_client.py`](file:///D:/tpm/mirror-agent/src/retrieval_graph/mem0_client.py)) ainsi que vers les symboles modifiés.
- **Transparence sur l'état Git** : Lors d'un commit ou d'un push, indiquer clairement le hash du commit, la branche cible et la liste des fichiers impactés.

---

## 3. Prudence & Rigueur (« Zero-Runtime QA »)

1. **Lire avant d'agir** :
   - Ne jamais éditer un fichier sans l'avoir lu au préalable pour comprendre son contexte exact, ses imports et ses invariants.
   - Consulter [`AGENTS.md`](./AGENTS.md) avant toute modification touchant à l'architecture, aux dépendances ou à la configuration.

2. **Demander plutôt que deviner** :
   - Si une consigne comporte une ambiguïté sur le périmètre (ex. modifier des fichiers externes volumineux vs uniquement les fichiers internes), poser une question courte et ciblée avant d'exécuter.
   - Ne jamais exécuter d'action destructrice ou irréversible (suppression de données, écrasement de fichiers de référence, modification de l'historique Git) sans confirmation explicite.

3. **Vérification Théorique et Statique Systématique** :
   - Ne jamais supposer qu'un code généré fonctionne uniquement parce qu'il semble syntaxiquement valide :
     - Vérifier la nature réelle des types importés (ex. distinguer une classe instanciable d'un alias `typing.Union` comme `AnyMessage`).
     - Traiter de manière défensive toutes les données provenant d'API externes ou de JSON (`None` explicite dans les dictionnaires, clés manquantes, types inattendus).
     - Isoler la gestion d'erreurs réseau/stockage de la gestion d'erreurs de parsing unitaire pour ne jamais masquer silencieusement un bug sous un retour vide `[]`.
   - Après chaque modification de code Python, exécuter systématiquement une vérification statique (`python -m py_compile ...` et `python -m ruff check ...`).

4. **Protection du Contexte et des Secrets** :
   - Ne jamais lire intégralement des dumps massifs (tels que `docs/langgraph.md` qui pèse 8,2 Mo) : procéder uniquement par recherche ciblée (`grep`) ou lecture bornée.
   - Ne jamais exposer, afficher en clair ou commiter le contenu de `.env` ou des clés API.

---

## 4. Manière de Travailler & Organisation (Hérité et adapté de `.windsurfrules`)

### A. Gestion de la Mémoire de Travail (`scratchpad.md`)
- **Planification et Suivi (`# Scratchpad`)** :
  - Lors de la réception d'une tâche complexe ou multi-étapes, consulter [`scratchpad.md`](./scratchpad.md), nettoyer les anciennes tâches terminées si nécessaire, expliquer brièvement l'objectif et structurer le plan d'action avec des marqueurs d'avancement :
    - `[X] Étape 1 terminée`
    - `[ ] Étape 2 à réaliser`
  - Mettre à jour l'avancement dans `scratchpad.md` à chaque jalon franchi pour conserver une vue d'ensemble claire.
- **Capitalisation des Apprentissages (`# Lessons`)** :
  - Dès qu'une information réutilisable est découverte (version spécifique d'une bibliothèque, subtilité d'un modèle, correction d'une erreur ou retour de l'utilisateur), la consigner dans la section `# Lessons` de [`scratchpad.md`](./scratchpad.md) afin de ne plus jamais reproduire la même erreur.

### B. Utilisation de l'Environnement et des Outils Internes (`tools/`)
- **Environnement Python** :
  - Un environnement virtuel est présent dans `./.venv` (sous Windows PowerShell : `.\.venv\Scripts\python.exe`). Toujours l'utiliser pour exécuter des scripts, des linters ou des tests.
- **Approche Incrémentale pour les Traitements par Lot** :
  - Pour les tâches de compréhension de texte ou de traitement automatisé (via [`tools/llm_api.py`](./tools/llm_api.py), [`tools/web_scraper.py`](./tools/web_scraper.py), [`tools/search_engine.py`](./tools/search_engine.py) ou [`tools/docs_generator.py`](./tools/docs_generator.py)), toujours tester d'abord sur un petit échantillon (1 à 3 éléments), vérifier le résultat, puis paralléliser uniquement après validation.
- **Journalisation et Diagnostic** :
  - Dans les scripts utilitaires (`utils/`, `tools/`), séparer proprement les informations de débogage (`stderr` ou `logging`) de la sortie principale (`stdout`) pour faciliter l'intégration dans les pipelines.
  - Dans le package applicatif (`src/`), utiliser exclusivement le module standard `logging` (règle Ruff `T201` interdisant `print()`).
