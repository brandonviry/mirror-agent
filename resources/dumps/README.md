# Dumps de Référence Externes (`resources/dumps/`)

Ce dossier isole les dumps bruts de documentation externe scrappés initialement dans `docs/` afin de ne pas polluer l'application de documentation **[Fumadocs](../../docs/)** :

- `langgraph.md` (8,2 Mo) : Dump complet de la documentation officielle LangGraph.
- `mem0ai-mem0.txt` (2,1 Mo) : Dump brut du dépôt Mem0.
- `chroma.md` (100 Ko) : Documentation officielle de ChromaDB.
- `contextual_retrieval.txt` (46 Ko) : Notes techniques sur le Contextual Retrieval.

> **Note pour les Agents IA** : Ne chargez jamais ces fichiers intégralement dans le contexte LLM (voir [`AGENTS.md`](../../AGENTS.md)).
