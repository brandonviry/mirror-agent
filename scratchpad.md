# Lessons

- Pour les chemins d'images sur un site web, toujours utiliser le chemin relatif correct (ex. `'images/filename.png'`) et vérifier que le dossier `images` existe.
- Pour les résultats de recherche et le scraping, garantir une gestion propre de l'encodage `UTF-8` pour les requêtes internationales.
- Envoyer les informations de débogage vers `stderr` ou via `logging` tout en gardant la sortie principale propre sur `stdout` pour faciliter l'intégration dans les pipelines.
- Dans `src/`, la règle Ruff `T201` interdit tout appel à `print()` : utiliser exclusivement `logging.getLogger(__name__)`.
- Dans `langchain_core.messages`, `AnyMessage` est un alias `typing.Union` non instanciable : toujours passer par la table de correspondance `MESSAGE_TYPES` (`HumanMessage`, `AIMessage`, `SystemMessage`).
- Avec l'API `mem0.ai`, les filtres `user_id`, `agent_id`, `app_id` et `run_id` doivent être placés à la racine du payload (jamais imbriqués sous `"filters"`).
- Lors de l'utilisation de styles seaborn dans matplotlib, utiliser `'seaborn-v0_8'` au lieu de `'seaborn'`.
- Ne jamais charger en entier les dumps bruts (`resources/dumps/langgraph.md` de 8,2 Mo) dans le contexte d'un LLM.
- Dans `src/retrieval_graph/state.py`, `State` doit hériter de `InputState` (`class State(InputState):`) car `graph.py` accède à `state.messages` dans tous ses nœuds.
- Dans `src/retrieval_graph/retrieval.py`, la sérialisation `pickle` sur `HuggingFaceEmbeddings` est un anti-pattern ; préférer `@functools.lru_cache` combiné au cache disque natif de HuggingFace.

# Scratchpad

## Mission Actuelle : Refonte Complète de `docs/` avec Fumadocs (Next.js + Fumadocs MDX)
Objectif : Transformer `docs/` en une véritable application de documentation moderne basée sur **Fumadocs** (`fumadocs-ui`, `fumadocs-core`, `fumadocs-mdx`) entièrement en français, et isoler les dumps bruts scrappés dans `resources/dumps/`.

- [X] Isoler les dumps bruts (`langgraph.md`, `chroma.md`, `mem0ai-mem0.txt`, `contextual_retrieval.txt`) dans `resources/dumps/`
- [X] Configurer l'application Next.js + Fumadocs dans `docs/` (`package.json`, `source.config.ts`, `next.config.mjs`, `app/`, `lib/source.ts`)
- [X] Créer l'arborescence structurée MDX dans `docs/content/docs/` avec `meta.json` :
  - `index.mdx`, `installation.mdx`, `zero-runtime-qa.mdx`, `plan-projet.mdx`
  - `architecture/` (`vue-ensemble.mdx`, `retrieval-graph.mdx`, `index-graph-et-configuration.mdx`)
  - `memoire-et-rag/` (`mem0-client.mdx`, `obsidian-et-retrievers.mdx`, `ameliorer-et-evaluer-rag.mdx`)
  - `roadmap/` (`index.mdx`, `00-audit-codebase.mdx`, `01-p0-decouplage-etat.mdx`, `02-p1-fournisseurs-locaux-ollama.mdx`, `03-p1-boucle-reflexive.mdx`, `04-p2-rag-hybride-obsidian.mdx`, `05-p3-observabilite-tests-ui.mdx`)
- [X] Mettre à jour `.gitignore`, `README.md`, `AGENTS.md` et `scratchpad.md`
