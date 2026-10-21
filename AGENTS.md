# AGENTS.md — Guide de Référence pour les Agents IA (`mirror-agent`)

Ce fichier définit le contexte technique, la stack, les commandes, l'architecture et les **règles strictes (interdits)** que tout agent IA intervenant sur le dépôt **`mirror-agent`** doit respecter.

---

## 1. Vue d'Ensemble & Philosophie du Projet

**Mirror Agent** est un assistant d'introspection socratique orchestré avec **LangGraph**. Il combine :
- Une **mémoire à long terme** persistée via **Mem0** (`mem0.ai`).
- Une **recherche documentaire (RAG)** sur les notes personnelles de l'utilisateur (coffre **Obsidian** indexé dans **ChromaDB**, avec support optionnel de Pinecone, Elasticsearch et MongoDB Atlas) et re-ranking via **CohereRerank**.
- Un **raisonnement analytique multi-étapes** via **Gemini 2.0 Flash Thinking** (`gemini-2.0-flash-thinking-exp-01-21`) et une génération de réponses socratiques via **OpenAI GPT-4o** (`openai/gpt-4o`).

### Philosophie « Zero-Runtime QA » (Amélioration & Vérification Statique)
Ce fork met l'accent sur la capacité à améliorer et fiabiliser le code par **analyse théorique des invariants**, **inspection des contrats de types** et **vérification statique** (`py_compile`, `ruff`, `mypy`), sans dépendre d'une exécution complète nécessitant toutes les clés API externes.

---

## 2. Stack Technique

| Catégorie | Technologies / Paquets | Détails & Versions clés (`pyproject.toml` / `langgraph.json`) |
| :--- | :--- | :--- |
| **Langage & Runtime** | Python `>=3.9` (`3.11` dans `langgraph.json`) | Environnement virtuel local dans `.venv/` |
| **Orchestration** | `langgraph>=0.2.6`, `langchain>=0.2.14`, `langchain-core` | Pas de `main.py` : point d'entrée déclaré dans `langgraph.json` |
| **Modèles LLM** | `langchain-openai`, `google-generativeai`, `langchain-anthropic`, `langchain-fireworks` | Requêtes/Réponses : `openai/gpt-4o` (défaut)<br>Raisonnement : `gemini-2.0-flash-thinking-exp-01-21` |
| **Mémoire Long-Terme** | `mem0ai` (`mem0.client.main.MemoryClient`) | Encapsulé dans `src/retrieval_graph/mem0_client.py` (`Mem0Memory`) |
| **Base Vectorielle & Embeddings** | `chromadb==0.5.23`, `sentence-transformers`, `torch==2.1.2` | Défaut : ChromaDB (`data/chroma`, collection `obsidian`) avec `BAAI/bge-large-en-v1.5` mis en cache dans `~/.cache/mirror-agent`<br>Supporte aussi : `langchain-pinecone`, `langchain-elasticsearch`, `langchain-mongodb` |
| **Re-ranking RAG** | `langchain-cohere>=0.2.4` (`CohereRerank`) | Modèle `rerank-english-v3.0` via `ContextualCompressionRetriever` |
| **Qualité, Linting & Tests** | `ruff>=0.6.1`, `mypy>=1.11.1`, `pytest`, `unittest`, `codespell` | Docstrings au format Google (`D`), interdiction de `print()` (`T201`), typage strict |
| **Évaluation & Observabilité** | `weave` (Weights & Biases), `google-cloud-logging` | Évaluation RAG dans `utils/eval_rag_pipeline.py`, logs GCP dans `utils/gcp_logging.py` |

---

## 3. Commandes Utiles

> **Note Windows / PowerShell** : Sur cet environnement Windows (`pwsh`), utilisez les commandes Python directement via `.venv\Scripts\python.exe` (ou activez `.venv\Scripts\Activate.ps1`) plutôt que les cibles `Makefile` qui utilisent une syntaxe shell Unix (`[ ... ]`, `source`).

### Activation de l'environnement virtuel
```powershell
# Windows PowerShell
.\.venv\Scripts\Activate.ps1

# Linux / macOS
source .venv/bin/activate
```

### Vérification Statique, Linting & Formatage (Sans clés API)
```powershell
# Vérification syntaxique / compilation Python d'un module
python -m py_compile src/retrieval_graph/mem0_client.py

# Linting complet avec Ruff (inclut E, F, I, D, D401, T201, UP)
python -m ruff check src/

# Vérification du formatage et tri des imports
python -m ruff format src/ --diff
python -m ruff check --select I src/

# Application automatique du formatage
python -m ruff format src/
python -m ruff check --select I --fix src/

# Vérification statique des types avec Mypy (mode strict)
python -m mypy --strict src/
```

### Exécution des Tests
```powershell
# Tests unitaires (ne nécessitent pas de clés externes si les variables d'env de base sont présentes)
python -m pytest tests/unit_tests -v

# Tests d'intégration Mem0 (nécessite MEM0_API_KEY, MEM0_ORG_ID, MEM0_PROJECT_ID, MEM0_USER_ID dans .env)
python -m unittest tests/test_mem0_integration.py

# Tests d'intégration du graphe complet
python -m pytest tests/integration_tests -v
```

### Lancement du Serveur LangGraph
```powershell
# Démarrer l'API locale et LangGraph Studio (mode in-memory)
langgraph dev
```

---

## 4. Structure du Projet

```text
mirror-agent/
├── AGENTS.md                        # Ce fichier : règles, stack, structure et interdits pour l'agent IA
├── README.md                        # Documentation principale du projet (en français)
├── langgraph.json                   # Déclaration des graphes LangGraph ("retrieval_graph" et "indexer")
├── pyproject.toml                   # Dépendances Python et configuration Ruff (règles D, T201, etc.)
├── Makefile                         # Raccourcis de lint, format, tests et monitoring
├── .env.example                     # Modèle des variables d'environnement requises
├── src/
│   └── retrieval_graph/             # Cœur de l'application (package principal)
│       ├── graph.py                 # Graphe principal "RetrievalGraph" (should_retrieve -> retrieve -> should_reason -> apply_reasoning -> respond)
│       ├── index_graph.py           # Graphe d'indexation "IndexGraph" (ensure_docs_have_user_id -> index_docs)
│       ├── state.py                 # Dataclasses d'état (State, InputState, IndexState) et réducteurs Mem0 (reduce_messages, reduce_docs)
│       ├── mem0_client.py           # Client Mem0Memory (CRUD souvenirs/messages/documents, mapping MESSAGE_TYPES, logging)
│       ├── configuration.py         # Dataclasses IndexConfiguration et Configuration (modèles, prompts, retriever_provider)
│       ├── retrieval.py             # Fabriques de retrievers (Chroma, Elastic, Pinecone, MongoDB) + CohereRerank
│       ├── prompts.py               # Prompts système par défaut (RESPONSE_SYSTEM_PROMPT, QUERY_SYSTEM_PROMPT)
│       └── utils.py                 # Utilitaires (get_message_text, format_docs XML, load_chat_model)
├── utils/                           # Scripts d'indexation Obsidian, monitoring et évaluation RAG
│   ├── obsidian_indexer.py          # Découpage (chunking) et indexation des notes Markdown Obsidian vers ChromaDB
│   ├── obsidian_monitor.py          # Surveillance continue des modifications du coffre Obsidian
│   ├── file_watcher.py              # Détection d'événements système de fichiers
│   ├── eval_rag_pipeline.py         # Évaluation du retriever avec Weave et distance de Levenshtein
│   ├── generate_synthetic_questions.py # Génération de paires Q/R synthétiques pour l'évaluation RAG
│   └── gcp_logging.py               # Journalisation structurée Google Cloud Logging
├── tools/                           # Outils auxiliaires pour les agents / scripts
│   ├── docs_generator.py            # Génération de fichiers de doc via Firecrawl / BeautifulSoup
│   ├── llm_api.py                   # Interface CLI d'appel LLM
│   ├── search_engine.py             # Recherche web
│   └── web_scraper.py               # Extraction de pages web
├── tests/                           # Suites de tests
│   ├── test_mem0_integration.py     # Tests d'intégration de Mem0Memory (messages, documents, souvenirs)
│   ├── unit_tests/                  # Tests unitaires (ex. test_configuration.py)
│   └── integration_tests/           # Tests d'intégration du graphe (test_graph.py)
├── docs/                            # Application de documentation Fumadocs (Next.js 15 + MDX en français, déployée sur Vercel)
│   ├── package.json                 # Scripts npm/pnpm (dev, build, start) et dépendances Fumadocs
│   ├── source.config.ts             # Configuration Fumadocs MDX (content/docs)
│   ├── lib/metadata.ts              # Configuration SEO centralisée, OpenGraph, JSON-LD et URL canonique Vercel
│   ├── app/                         # Routes Next.js App Router (accueil, /docs/[[...slug]], /api/search, sitemap.ts, robots.ts, llms.txt)
│   └── content/docs/                # Source unique de la doc MDX :
│       ├── architecture/            # Vue d'ensemble, RetrievalGraph, IndexGraph & Configuration
│       ├── memoire-et-rag/          # Client Mem0 (Cloud vs Local), Obsidian & Retrievers, Évaluation RAG
│       ├── bugs/                    # Registre des Bugs Connus & Contournements (BUG-001 à BUG-009 liés aux GitHub Issues #1 à #9)
│       └── roadmap/                 # Feuille de route architecturale (Audit + RFCs P0 à P3)
└── resources/dumps/                 # Dumps bruts de documentation externe isolés hors de docs/
    ├── chroma.md                    # Dump de référence externe ChromaDB (NE PAS TRADUIRE/ÉCRASER)
    ├── contextual_retrieval.txt     # Notes brutes Contextual Retrieval
    ├── langgraph.md                 # Dump de référence externe LangGraph de 8,2 Mo (NE PAS OUVRIR EN ENTIER/ÉCRASER)
    └── mem0ai-mem0.txt              # Dump brut du dépôt Mem0 (2,1 Mo)
```

---

## 5. Conventions de Code & Invariants Techniques

1. **Initialisation de `state.py` et `MEM0_USER_ID`** :
   - `src/retrieval_graph/state.py` instancie `mem0 = Mem0Memory()` au niveau du module lors de l'import.
   - `Mem0Memory.__init__` vérifie immédiatement la présence de `MEM0_USER_ID` dans `os.environ` et lève `ValueError("MEM0_USER_ID must be set in the environment.")` s'il est absent. Toute exécution ou test important `state.py` doit donc définir `MEM0_USER_ID`.

2. **Désérialisation des messages LangChain (`mem0_client.py`)** :
   - Dans `langchain_core.messages`, `AnyMessage` est un alias de type (`typing.Union`), **pas une classe concrète**.
   - Utilisez toujours le dictionnaire `MESSAGE_TYPES` (`"human": HumanMessage`, `"ai": AIMessage`, `"system": SystemMessage`) avec `HumanMessage` en valeur de repli par défaut.

3. **Format des requêtes vers l'API `mem0.ai`** :
   - Les identifiants `user_id`, `agent_id`, `app_id` et `run_id` doivent être placés **à la racine** du dictionnaire envoyé à `self.client.add([memory_dict])` et `self.client.search(**search_params)`.

4. **Style des Docstrings (Ruff `D` & `D401`)** :
   - Tous les modules, classes et fonctions publiques dans `src/` doivent posséder une docstring au **format Google**.
   - La première ligne de chaque docstring doit être à **l'impératif** (règle Ruff `D401`, ex. `"""Retrieve stored conversation messages."""` et non `"""Retrieves..."""`).

5. **Langue de la Documentation** :
   - La documentation du projet (`README.md`, `AGENTS.md`, `GEMINI.md`, et tous les fichiers `.mdx` dans `docs/content/docs/`) est rédigée en **français**.
   - Les docstrings et identifiants dans le code Python (`src/`) restent en **anglais** pour respecter les conventions des linters (`codespell`, `pydocstyle`).

6. **Protocole Hybride de Gestion des Bugs (`docs/content/docs/bugs/` ↔ GitHub Issues)** :
   - Tout bug identifié dans la codebase est répertorié simultanément sous forme :
     1. D'une **Fiche Technique MDX** dans `docs/content/docs/bugs/bug-XXX-*.mdx` (indexée dans `docs/content/docs/bugs/meta.json` et `docs/content/docs/bugs/index.mdx`), documentant le symptôme, le fichier/ligne exact, la cause racine et le **contournement immédiat (*workaround*)**.
     2. D'une **Issue GitHub officielle** sur `brandonviry/mirror-agent` via `gh issue create` avec les labels appropriés (`bug`, `contournement-dispo` ou `résolu`, et `priorité:P0`/`P1`/`P2`).
   - Lorsqu'un bug ouvert (`BUG-004` à `BUG-009`, ou tout nouveau bug) est corrigé dans le code :
     1. Ajouter un test unitaire de non-régression dans `tests/unit_tests/`.
     2. Fermer l'Issue GitHub correspondante via `gh issue close <num> --repo brandonviry/mirror-agent --comment "Résolu dans le commit <sha>."` et remplacer le label `contournement-dispo` par `résolu`.
     3. Mettre à jour la fiche MDX dans `docs/content/docs/bugs/` et le tableau synoptique `docs/content/docs/bugs/index.mdx` pour passer son statut de `🔴 OUVERT` à `🟢 RÉSOLU / FERMÉ`.

7. **Règles Spécifiques à Fumadocs (`docs/`) et au Déploiement Vercel** :
   - **Syntaxe MDX / JSX stricte** : Dans tous les fichiers `docs/content/docs/**/*.mdx`, les balises HTML doivent être auto-fermées (`<br />` et jamais `<br>`), et aucun caractère `<` ou `{` ne doit apparaître en dehors d'un bloc de code ou d'un composant JSX valide (ex. éviter les formules LaTeX brutes contenant `{...}` hors bloc de code).
   - **Déploiement continu** : Le projet Vercel `mirror-agent-docs` (`https://mirror-agent-docs.vercel.app`) a pour racine `docs/`. Tout `git push origin main` déclenche la mise en production.

---

## 6. Les Interdits Stricts (À NE JAMAIS FAIRE)

- **INTERDIT d'utiliser `print()` dans `src/`** :
  - La règle Ruff **`T201`** (`flake8-print`) est activée dans `pyproject.toml`. Tout appel à `print()` dans `src/` fera échouer le linter. Utilisez exclusivement le module `logging` (`logger = logging.getLogger(__name__)`, `logger.info`, `logger.warning`, `logger.exception`).

- **INTERDIT d'instancier `AnyMessage(...)` directement** :
  - Provoque un `TypeError: Cannot instantiate typing.Union` à l'exécution (`BUG-001`). Passez toujours par `MESSAGE_TYPES.get(msg_type, HumanMessage)`.

- **INTERDIT d'englober un appel réseau et une boucle de parsing dans un seul `try...except Exception` muet** :
  - Séparez toujours le `try...except` de récupération réseau (`self.get_memories(...)`) du `try...except` d'instanciation de chaque élément dans la boucle `for` (`BUG-002`), afin qu'une entrée malformée n'annule pas toute la liste retournée et que l'erreur exacte soit tracée via `logger.exception(...)`.

- **INTERDIT de chainer `.get("metadata", {}).get(...)` sans vérifier le type** :
  - Si la clé `"metadata"` existe dans la réponse JSON avec la valeur `None`, `.get("metadata", {})` renvoie `None` et provoque un `AttributeError: 'NoneType' object has no attribute 'get'` (`BUG-002`). Vérifiez toujours `if not isinstance(metadata, dict): metadata = {}`.

- **INTERDIT d'imbriquer les filtres Mem0 sous une clé `"filters"`** :
  - Envoyer `{"text": ..., "filters": {"user_id": ...}}` à l'API Mem0 provoque une erreur `HTTP 400`. Les clés `user_id`, `agent_id`, `app_id` et `run_id` doivent rester au niveau racine du payload.

- **INTERDIT de créer ou chercher un fichier `main.py`** :
  - Ce projet est un graphe **LangGraph** régi par `langgraph.json`. Les points d'entrée sont `src/retrieval_graph/graph.py:graph` et `src/retrieval_graph/index_graph.py:graph`.

- **INTERDIT d'exécuter `pnpm install` ou `npm install` dans `docs/` depuis le terminal de l'agent** :
  - Les dépendances Node.js sont déjà installées dans `docs/node_modules` et le build cloud est assuré par Vercel en ~35 secondes. Lancer un gestionnaire de paquets Node en sous-processus bloque le terminal.

- **INTERDIT de lire en entier ou de modifier `resources/dumps/langgraph.md` (8,2 Mo), `resources/dumps/mem0ai-mem0.txt` (2,1 Mo) et `resources/dumps/chroma.md` (100 Ko)** :
  - Ce sont des dumps bruts de documentation externe servant de base de connaissance locale. Ne les chargez jamais intégralement dans le contexte LLM (utilisez `grep` ou des lectures ciblées par lignes si nécessaire) et ne les déplacez jamais dans `docs/`.

- **INTERDIT de commiter des clés API ou le fichier `.env`** :
  - Seul `.env.example` doit être suivi par Git. Vérifiez toujours `git status` et `git diff` avant un commit.
