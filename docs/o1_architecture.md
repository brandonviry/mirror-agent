# Architecture Détaillée de Mirror Agent

```text
                                                    ┌───────────────────────────────────────────────────┐
                                                    │               Interface Utilisateur               │
                                                    │  - Reçoit les réponses finales de l'IA            │
                                                    │  - Envoie les requêtes/messages à l'Agent         │
                                                    └───────────────▲───────────────────────────────────┘
                                                                    │
                                                                    │ (1) messages & entrée utilisateur
                                                                    │
                 ┌──────────────────────────────────────────────────┴──────────────────────────────────────────────────┐
                 │                                   mirror-agent "RetrievalGraph"                                     │
                 │           (Défini dans src/retrieval_graph/graph.py, compilé dans `graph`)                          │
                 │                                                                                                     │
                 │   ┌─────────────────────────────────────────────────────────────────────────────────────────────┐   │
                 │   │  Nœuds du Flux (StateGraph de langgraph.graph)                                              │   │
                 │   │---------------------------------------------------------------------------------------------│   │
                 │   │                                                                                             │   │
                 │   │  1) "__start__" ────────────────────> "should_retrieve" (fonction should_retrieve)          │   │
                 │   │                               │ (décide s'il faut chercher des documents ou continuer)      │   │
                 │   │                               └────────────────────────────────────────────────────────────▶│   │
                 │   │                                                                                             │   │
                 │   │  2) "should_retrieve" ──(si next="retrieve")─> "generate_query" (fonction generate_query)   │   │
                 │   │                       └─(si next="respond")──> "should_reason" (fonction should_reason)     │   │
                 │   │                                                                                             │   │
                 │   │  3) "generate_query" ─────────────────────────────────────────────────────┬───────────────▶ │   │
                 │   │       (utilise ChatPromptTemplate & LLM pour formuler une requête)        │                 │   │
                 │   │                                                                           │ (queries)       │   │
                 │   │  4) "retrieve" (fonction retrieve)                                        ▼                 │   │
                 │   │       (exécute la recherche via make_retriever(...) -> ainvoke)     "retrieved_docs"        │   │
                 │   │       puis dirige vers ──────────────────────────────────────────────> "should_reason"      │   │
                 │   │                                                                                             │   │
                 │   │  5) "should_reason" ────(si next="reason")───> "apply_reasoning" (Gemini 2.0 Flash Thinking)│   │
                 │   │                     └───(si next="respond")──> "respond"                                    │   │
                 │   │                                                                                             │   │
                 │   │  6) "apply_reasoning" ───────────────────────> produit `reasoning_trace` ──> "respond"      │   │
                 │   │                                                                                             │   │
                 │   │  7) "respond" (fonction respond) ──────────────────────────────────────────────────────────▶│   │
                 │   │       (génère la réponse socratique finale via LLM, prompt système, docs et raisonnement)   │   │
                 │   │                                                                                             │   │
                 │   └─────────────────────────────────────────────────────────────────────────────────────────────┘   │
                 │                                                                                                     │
                 │                     Structures de Données Internes & Mémoire (state.py, mem0_client.py)             │
                 │   ┌─────────────────────────────────────────────────────────────────────────────────────────────┐   │
                 │   │ class InputState:                                                                           │   │
                 │   │    - messages: Annotated[Sequence[AnyMessage], reduce_messages] (persisté dans Mem0)        │   │
                 │   │                                                                                             │   │
                 │   │ class State(InputState):                                                                    │   │
                 │   │    - queries: Annotated[list[str], add_queries] (requêtes de recherche générées)            │   │
                 │   │    - retrieved_docs: list[Document]             (documents issus du retriever)              │   │
                 │   │    - next: str                                  (routage : "retrieve"/"reason"/"respond")   │   │
                 │   │    - reasoning_trace: Optional[str]             (trace analytique de Gemini Thinking)       │   │
                 │   └─────────────────────────────────────────────────────────────────────────────────────────────┘   │
                 │                                                                                                     │
                 │                        Intégration des Prompts & LLM (prompts.py, utils.py)                         │
                 │   ┌─────────────────────────────────────────────────────────────────────────────────────────────┐   │
                 │   │ - RESPONSE_SYSTEM_PROMPT & QUERY_SYSTEM_PROMPT définissent les instructions système         │   │
                 │   │ - load_chat_model(...) charge un BaseChatModel (ex. openai/gpt-4o)                          │   │
                 │   │ - apply_reasoning utilise le SDK Google GenAI (gemini-2.0-flash-thinking-exp-01-21)         │   │
                 │   │ - Le nœud "respond" combine retrieved_docs + reasoning_trace + messages                     │   │
                 │   └─────────────────────────────────────────────────────────────────────────────────────────────┘   │
                 │                                                                                                     │
                 └─────────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                                    │
                                                                    │ (2) appelle la logique "retriever" avec la config
                                                                    ▼
        ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
        │                                          retrieval.py : make_retriever(...)                                             │
        │                                                                                                                         │
        │  Ce module crée dynamiquement un VectorStoreRetriever à partir du fournisseur choisi :                                  │
        │     - "chroma" (Par défaut : ChromaDB local, collection "obsidian", embeddings BAAI/bge-large-en-v1.5 mis en cache)     │
        │     - "elastic" / "elastic-local" (Elasticsearch)                                                                       │
        │     - "pinecone" (Base vectorielle Pinecone)                                                                            │
        │     - "mongodb" (MongoDB Atlas Vector Search)                                                                           │
        │                                                                                                                         │
        │  Étapes :                                                                                                               │
        │  1) Lecture de la configuration utilisateur (IndexConfiguration ou Configuration) depuis RunnableConfig                 │
        │  2) Instanciation des embeddings (make_text_encoder(...) ou load_embeddings_model(...) avec cache local)                │
        │  3) Connexion à la base vectorielle cible (k=20 par défaut pour Chroma)                                                 │
        │  4) Enveloppement avec create_compressed_retriever(...) utilisant CohereRerank ("rerank-english-v3.0")                  │
        │  5) Fourniture (yield) du retriever au nœud "retrieve"                                                                  │
        └─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                                    │
                                                                    │ (3) obtient les documents pertinents (re-rankés)
                                                                    ▼
                                ┌───────────────────────────────────────────────────────────────────────────────────┐
                                │                        Documents Récupérés                                        │
                                │    - Objets Document de langchain_core.documents.Document                         │
                                │    - Contiennent "page_content" et "metadata" (incluant "user_id", source, etc.)  │
                                └───────────────────────────────────────────────────────────────────────────────────┘
                                                                    │
                                                                    │ (4) étape optionnelle de raisonnement + LLM final
                                                                    ▼
                  ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
                  │                           Nœuds "apply_reasoning" & "respond" (graph.py)                                │
                  │ - Si should_reason="reason" : apply_reasoning génère une analyse étape par étape (`reasoning_trace`)    │
                  │ - respond combine l'historique des messages, les prompts système, retrieved_docs et reasoning_trace     │
                  │ - Le modèle "response_model" est chargé depuis "Configuration" (par défaut : openai/gpt-4o)             │
                  │ - La sortie est ajoutée comme AIMessage dans "messages" (et sauvegardée dans Mem0 via reduce_messages)  │
                  └─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                                    │
                                                                    │ (5) réponse finale
                                                                    ▼
                                                    ┌───────────────────────────────────────────────────┐
                                                    │               Interface Utilisateur               │
                                                    │  <--- Reçoit la réponse finale de "respond"       │
                                                    └───────────────────────────────────────────────────┘


                                          ( Pipeline Parallèle pour l'Indexation de Documents )
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                                                    │
│    ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│    │                                              mirror-agent "IndexGraph"                                                    │   │
│    │               (Défini dans src/retrieval_graph/index_graph.py, compilé dans `graph`)                                      │   │
│    │                                                                                                                           │   │
│    │  Nœud du Flux (StateGraph avec input=IndexState) :                                                                        │   │
│    │                                                                                                                           │   │
│    │     "__start__"  ─────>  "index_docs" (fonction index_docs)  ───────────────────────────────────────────────────────────▶ │   │
│    │               - Prend state.docs (Sequence[Document], préalablement enregistrés dans Mem0 via reduce_docs)                │   │
│    │               - Garantit la présence de user_id dans les métadonnées (ensure_docs_have_user_id(...))                      │   │
│    │               - Les ajoute à la base vectorielle (await retriever.aadd_documents(...))                                    │   │
│    │               - Retourne {"docs": "delete"} pour vider la liste des documents de l'état courant                           │   │
│    │                                                                                                                           │   │
│    └───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                                                    │
│    ┌───────────────────────────────────────────── IndexState (depuis state.py) ────────────────────────────────────────────────┐   │
│    │  @dataclass                                                                                                               │   │
│    │  class IndexState:                                                                                                        │   │
│    │     docs: Annotated[Sequence[Document], reduce_docs]                                                                      │   │
│    └───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                                                    │
│       (Exemple de flux : Obsidian Monitor ou une requête API déclenche l'indexation → index_docs → documents interrogeables)       │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘


                    ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
                    │                                      Classes de Configuration                                           │
                    │                          (depuis configuration.py : IndexConfiguration, Configuration)                  │
                    │   - IndexConfiguration stocke :                                                                         │
                    │        user_id ("1"), embedding_model (None), retriever_provider ("chroma"), search_kwargs ({})         │
                    │   - Configuration hérite de IndexConfiguration et ajoute :                                              │
                    │        response_model ("openai/gpt-4o"), query_model ("openai/gpt-4o"),                                 │
                    │        reasoning_model ("gemini-2.0-flash-thinking-exp-01-21"), et les prompts système                  │
                    │   - from_runnable_config(...) fusionne un RunnableConfig avec les champs de la dataclass                │
                    └─────────────────────────────────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
                    │                                   Client Mémoire Mem0 (mem0_client.py)                                  │
                    │   - Mem0Memory gère la persistance via l'API mem0.ai (filtré par user_id, agent_id, app_id, run_id)     │
                    │   - add_memory / add_message / add_document : enregistre souvenirs, messages et documents               │
                    │   - get_messages : reconstruit HumanMessage / AIMessage / SystemMessage via MESSAGE_TYPES               │
                    │   - get_documents : reconstruit les objets Document avec gestion d'erreurs isolée et logging structuré  │
                    └─────────────────────────────────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
                    │                                   Fonctions Utilitaires (utils.py)                                      │
                    │   - get_message_text(msg) : extrait le contenu textuel d'un AnyMessage (str, dict ou liste)             │
                    │   - format_docs(docs) : enveloppe les documents dans une balise XML <documents> ... </documents>        │
                    │   - load_chat_model(name) : initialise un BaseChatModel à partir du format "provider/model"             │
                    └─────────────────────────────────────────────────────────────────────────────────────────────────────────┘


┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│     Outils Complémentaires & Contexte (`utils/`, `tools/`) :                                                                       │
│     - Surveillance et indexation Obsidian : `utils/obsidian_monitor.py`, `utils/obsidian_indexer.py`, `utils/file_watcher.py`      │
│     - Journalisation structurée GCP : `utils/gcp_logging.py`                                                                       │
│     - Évaluation de la pipeline RAG : `utils/eval_rag_pipeline.py`, `utils/generate_synthetic_questions.py`                        │
│     - Génération de documentation : `tools/docs_generator.py`                                                                      │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Résumé des Interactions Clés

1. **Entrée Utilisateur** : L'utilisateur envoie un message (ou des documents à indexer) via LangGraph Studio / SDK.
2. **Aiguillage du Graphe** : `IndexGraph` est appelé pour l'ingestion de documents ; `RetrievalGraph` est appelé pour la conversation.
3. **Décision et Recherche (`RetrievalGraph`)** :
   - Le nœud `should_retrieve` détermine si la question nécessite un contexte personnel (`"retrieve"`) ou non (`"respond"`).
   - Si `"retrieve"`, `generate_query` formule une requête optimisée et `retrieve` interroge la base vectorielle configurée via `make_retriever(...)` (par défaut **ChromaDB** + re-ranking **CohereRerank**).
4. **Raisonnement Analytique** :
   - Le nœud `should_reason` évalue si la requête exige une analyse complexe, logique ou multi-étapes.
   - Si `"reason"`, `apply_reasoning` appelle **Gemini 2.0 Flash Thinking** (`gemini-2.0-flash-thinking-exp-01-21`) et stocke sa réflexion dans `state.reasoning_trace`.
5. **Génération de la Réponse Socratique** :
   - Le nœud `respond` assemble l'historique des messages, les documents récupérés (`retrieved_docs`) et la trace de raisonnement (`reasoning_trace`) pour générer une réponse socratique via `response_model` (`openai/gpt-4o`).
6. **Persistance dans Mem0** :
   - À chaque mise à jour de l'état, les réducteurs `reduce_messages` et `reduce_docs` synchronisent les messages et documents avec `mem0.ai` via `Mem0Memory`.
