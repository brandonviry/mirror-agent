# Mirror Agent : Plan de Projet

## Vue d'ensemble

Le **Mirror Agent** est un assistant IA conçu pour aider les utilisateurs à mieux se comprendre grâce à un questionnement socratique, une réflexion personnalisée et des interactions basées sur la mémoire à long terme. L'agent se distingue par les caractéristiques suivantes :

- **Indépendant du modèle (Model-agnostic)** : L'utilisateur peut configurer le modèle de langage (LLM) sous-jacent pour les requêtes, le raisonnement et les réponses (OpenAI `gpt-4o`, Google `gemini-2.0-flash-thinking-exp-01-21`, Anthropic, etc.).
- **Socratique et réflexif** : Encourage les utilisateurs à explorer leurs propres pensées et émotions en posant des questions ouvertes et en offrant des pistes d'introspection.
- **Enrichi par la mémoire (Mem0)** : Conserve le contexte propre à l'utilisateur, l'historique des conversations et les documents via `mem0.ai` (`src/retrieval_graph/mem0_client.py`) pour des interactions cohérentes et personnalisées dans la durée.
- **Raisonnement multi-étapes & Extensibilité** : Combine un module de recherche documentaire (ChromaDB local pour les notes Obsidian, avec re-ranking Cohere, ainsi que le support de Pinecone, Elasticsearch et MongoDB) et un nœud de raisonnement analytique dédié (`apply_reasoning`).

Basé sur l'architecture **LangGraph** ([documentation officielle](https://langchain-ai.github.io/langgraph/)), ce plan détaille l'architecture, les composants requis et la feuille de route du projet Mirror Agent.

---

## Architecture de Haut Niveau

1. **Interface Utilisateur & LangGraph Studio**  
   - Exposition via **LangGraph Server / LangGraph Studio** (`langgraph dev`), permettant d'interagir avec les graphes compilés via API REST/SDK ou interface graphique.
   - Cette couche assure la médiation entre l'utilisateur et le cœur du Mirror Agent.

2. **Mirror Agent (`RetrievalGraph`)**  
   - **Couche LLM** : Indépendante du fournisseur (`load_chat_model`), configurable séparément pour la formulation de requêtes (`query_model`), le raisonnement (`reasoning_model`) et la réponse finale (`response_model`).
   - **Logique centrale** (`src/retrieval_graph/graph.py`) : Orchestre les décisions conditionnelles entre la recherche documentaire (`should_retrieve`), le raisonnement analytique (`should_reason`) et la réponse socratique (`respond`).
   - **Personnalité / Persona** (`src/retrieval_graph/prompts.py`) : Un guide bienveillant, sage et socratique qui favorise l'introspection.

3. **Module de Recherche (`Retriever` & `IndexGraph`)**  
   - **Ingestion de documents** (`src/retrieval_graph/index_graph.py`, `utils/obsidian_indexer.py`, `utils/obsidian_monitor.py`) : Permet d'indexer automatiquement des notes personnelles (notamment depuis un coffre Obsidian) ou des documents externes.
   - **Recherche et Compression Contextuelle** (`src/retrieval_graph/retrieval.py`) : Utilise **ChromaDB** par défaut (avec embeddings locaux `BAAI/bge-large-en-v1.5` mis en cache) et applique un re-ranking via **CohereRerank** (`rerank-english-v3.0`) au sein d'un `ContextualCompressionRetriever`. Supporte également Elasticsearch, Pinecone et MongoDB Atlas.

4. **Mémoire Persistante (`Mem0`)**  
   - **Profil utilisateur et contexte** (`src/retrieval_graph/mem0_client.py`) : Géré par la classe `Mem0Memory`, qui stocke et filtre les souvenirs par `user_id`, `agent_id` (`mirror-agent`), `app_id` et `run_id`.
   - **Réducteurs d'état LangGraph** (`src/retrieval_graph/state.py`) : Les fonctions `reduce_messages` et `reduce_docs` synchronisent automatiquement l'état du graphe avec l'API `mem0.ai`.

5. **Module de Raisonnement & Réflexion (`Reasoner / Reflector`)**  
   - **Routage analytique** (`should_reason`) : Évalue si la requête de l'utilisateur nécessite une décomposition logique, scientifique ou multi-étapes.
   - **Exécution du raisonnement** (`apply_reasoning`) : Mobilise `gemini-2.0-flash-thinking-exp-01-21` pour produire une trace de raisonnement (`reasoning_trace`) injectée dans le contexte du nœud `respond`.

6. **Intégration LangGraph (`langgraph.json`)**  
   - **`retrieval_graph`** (`./src/retrieval_graph/graph.py:graph`) : Graphe d'état principal gérant le flux conversationnel (`__start__` → `should_retrieve` → [`generate_query` → `retrieve`] → `should_reason` → [`apply_reasoning`] → `respond`).
   - **`indexer`** (`./src/retrieval_graph/index_graph.py:graph`) : Graphe dédié à l'indexation asynchrone des documents avec marquage `user_id`.

---

## Aspects Techniques Clés

1. **Sélection et Configuration des Modèles LLM (`configuration.py`)**
   - `IndexConfiguration` : Configure `user_id`, `embedding_model`, `retriever_provider` (par défaut `"chroma"`) et `search_kwargs`.
   - `Configuration` (hérite de `IndexConfiguration`) : Configure `query_model` (`openai/gpt-4o`), `response_model` (`openai/gpt-4o`), `reasoning_model` (`gemini-2.0-flash-thinking-exp-01-21`) ainsi que les prompts système.

2. **Ingénierie des Prompts (`prompts.py`)**
   - `RESPONSE_SYSTEM_PROMPT` : Définit la posture socratique, réflexive et bienveillante de l'agent et intègre les documents récupérés ainsi que la trace de raisonnement.
   - `QUERY_SYSTEM_PROMPT` : Guide la reformulation des questions utilisateur en requêtes de recherche pertinentes en tenant compte de l'historique des requêtes précédentes.

3. **Gestion de la Mémoire (`mem0_client.py` & `state.py`)**
   - Stockage des souvenirs textuels (`add_memory`), des messages de conversation (`add_message`) et des documents (`add_document`).
   - Désérialisation robuste des messages via la table de correspondance `MESSAGE_TYPES` (`HumanMessage`, `AIMessage`, `SystemMessage`), isolation granulaire des erreurs réseau/parsing et journalisation structurée (`logging`).

4. **Module de Recherche et Surveillance Obsidian (`retrieval.py` & `utils/`)**
   - Surveillance en temps réel des fichiers Markdown d'un coffre Obsidian (`utils/obsidian_monitor.py` et `utils/file_watcher.py`).
   - Découpage intelligent (chunking), extraction de métadonnées et détection des mises à jour dans ChromaDB (`utils/obsidian_indexer.py`).
   - Outils d'évaluation de la pipeline RAG (`utils/eval_rag_pipeline.py`, `utils/generate_synthetic_questions.py`).

5. **Déploiement & Qualité du Code**
   - Configuration déclarative dans `langgraph.json` et `pyproject.toml` (Ruff, Mypy, Pytest).
   - Vérification statique sans exécution (*Zero-Runtime QA*) garantissant le respect des contrats de types et des règles de linting (comme la règle Ruff `T201`).

---

## Phases du Projet & Liste de Suivi

### Phase 1 : Configuration Initiale et Fonctionnalités de Base ✅
- Mise en place de la structure du projet LangGraph (`src/retrieval_graph/`)
- Implémentation du chargement de documents de base (`IndexGraph`)
- Intégration des bases vectorielles (Chroma, Pinecone, Elasticsearch, MongoDB)
- Création du mécanisme de recherche initial

### Phase 2 : Traitement Avancé des Documents ✅
- Prise en charge des coffres Obsidian et fichiers Markdown (`utils/obsidian_indexer.py`)
- Implémentation des stratégies de découpage (chunking)
- Extraction de métadonnées et horodatage
- Détection automatique des modifications de fichiers (`utils/obsidian_monitor.py`)

### Phase 3 : Optimisation de la Recherche (RAG) ✅
- Optimisation des requêtes vers la base vectorielle (`generate_query`)
- Mise en cache locale des modèles d'embeddings HuggingFace (`BAAI/bge-large-en-v1.5`)
- Intégration de la compression contextuelle et du re-ranking via `CohereRerank` (`rerank-english-v3.0`)
- Filtrage conditionnel en amont (`should_retrieve`)

### Phase 4 : Intégration de la Mémoire (Mem0) et Raisonnement ✅
- Intégration complète du client `Mem0Memory` (`src/retrieval_graph/mem0_client.py`)
- Persistance automatique de l'état via les réducteurs `reduce_messages` et `reduce_docs`
- Ajout du routage de raisonnement (`should_reason`) et du nœud analytique (`apply_reasoning` avec Gemini 2.0 Flash Thinking)
- Fiabilisation et refactoring de `mem0_client.py` (instanciation concrète via `MESSAGE_TYPES`, isolation des erreurs de parsing, conformité Ruff `T201` avec `logging`)

### Phase 4.5 : Évaluation et Optimisation du RAG ✅
- Conception du cadre d'évaluation (`utils/eval_rag_pipeline.py`)
- Génération de questions synthétiques (`utils/generate_synthetic_questions.py`)
- Génération automatisée de documentation technique (`tools/docs_generator.py`)

### Phase 5 : Surveillance et Observabilité 🚧
- Intégration de la journalisation Google Cloud Platform (`utils/gcp_logging.py`) ✅
  - Logs structurés pour les opérations d'indexation
  - Suivi des métriques de performance
  - Surveillance des erreurs et avertissements
  - Suivi des échecs par lot (batch)
  - Statistiques de traitement des documents
- Collecte élargie de métriques
- Mise en place d'alertes automatisées
- Création de tableaux de bord de supervision

### Phase 6 : Interface Utilisateur et Expérience
- Conception et implémentation d'une interface web dédiée (au-delà de LangGraph Studio)
- Ajout de capacités de visualisation des réflexions et souvenirs
- Collecte des retours utilisateurs (feedback explicite)
- Options de personnalisation du guide socratique

### Phase 7 : Fonctionnalités Avancées
- Fonctionnalités collaboratives
- Gestion de versions pour les documents indexés
- Fonctionnalités de sécurité avancées
- Mécanismes de sauvegarde et de restauration

### Phase 8 : Optimisation des Performances
- Mise en cache avancée des requêtes et réponses
- Équilibrage de charge
- Optimisation de l'utilisation des ressources
- Mise à l'échelle automatique (auto-scaling)

### Phase 9 : Préparation à la Production
- Documentation complète et traduite en français ✅
- Couverture de tests unitaires et d'intégration complète (`tests/`)
- Automatisation du déploiement (Docker / LangGraph Cloud)
- Procédures de maintenance

### Phase 10 : Lancement et Maintenance
- Déploiement en production
- Surveillance des performances en continu
- Collecte des retours utilisateurs en conditions réelles
- Planification des évolutions futures

---

## Conclusion

En suivant ces étapes, **Mirror Agent** offre un compagnon d'introspection capable de mener un dialogue socratique, de personnaliser ses échanges grâce à une mémoire persistante (`Mem0`), de mobiliser les notes personnelles de l'utilisateur (`ChromaDB` / Obsidian) et de décomposer des problèmes complexes (`Gemini 2.0 Flash Thinking`). L'orchestration via **LangGraph** garantit la modularité, l'extensibilité et la clarté des interactions entre chaque sous-système.

---

## Historique des Changements Récents
- **Refactoring `mem0_client.py` (Zero-Runtime QA)** : Correction du bug d'instanciation `AnyMessage` (`typing.Union`) via `MESSAGE_TYPES`, isolation des erreurs par élément dans `get_messages()` et `get_documents()`, validation défensive des métadonnées nulles et remplacement de `print()` par le module standard `logging` (conformité Ruff `T201`).
- **Raisonnement analytique** : Ajout des nœuds `should_reason` et `apply_reasoning` utilisant `gemini-2.0-flash-thinking-exp-01-21`.
- **Recherche locale & Re-ranking** : Passage à ChromaDB (`BAAI/bge-large-en-v1.5`) par défaut avec compression contextuelle `CohereRerank`.
- **Résolution des conflits de dépendances** : Suppression de la contrainte `langchain-pinecone>=0.1.3,<0.2.0` pour s'aligner avec `langchain-core>=0.3.0,<0.4`.
