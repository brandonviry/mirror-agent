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
- Dans les fichiers `.mdx` de Fumadocs (`docs/content/docs/`), respecter le JSX strict : balises `<br />` auto-fermées et aucune accolade `{}` hors bloc de code (pas de formules LaTeX brutes `\frac{a}{b}`).
- Suivi Hybride des Bugs : chaque bug (`BUG-001` à `BUG-009`) possède une fiche MDX dans `docs/content/docs/bugs/` ET une Issue GitHub synchronisée sur `brandonviry/mirror-agent` (`#1` à `#9`).

# Scratchpad

## Mission Actuelle : Complétion Étape par Étape des 12 Piliers de la Documentation Fumadocs (`https://mirror-agent-docs.vercel.app`)

- [X] **Socle Fumadocs, SEO & Déploiement Continu Vercel** (`/sitemap.xml`, `/robots.txt`, `/llms.txt`, OpenGraph, JSON-LD)
- [X] **Pilier #8 — Limites connues, Bugs & Contournements (`docs/content/docs/bugs/` + GitHub Issues `#1` à `#9`)** :
  - Issues `#1`, `#2`, `#3` créées et fermées (`BUG-001` à `BUG-003` résolus dans `60c5871`)
  - Issues `#4` à `#9` créées et ouvertes (`BUG-004` à `BUG-009` avec contournements documentés)
  - 10 fichiers créés dans `docs/content/docs/bugs/` et déployés en production (`HTTP 200` sur `/docs/bugs`)
  - Mise à jour de `AGENTS.md` et `GEMINI.md` avec le protocole hybride de suivi des bugs
- [ ] **Prochains Piliers à traiter étape par étape (selon validation utilisateur)** :
  - [ ] Pilier #3 : Quick Start (`quick-start.mdx` — Premier lancement en 5 min avec code court)
  - [ ] Pilier #5 : Données & Modèles (`architecture/modele-donnees.mdx` — Schémas ER Mermaid Mem0, Chroma, LangGraph State)
  - [ ] Pilier #6 : API & Interfaces (`api-et-interfaces.mdx` — Endpoints LangGraph Server `/runs`, `/threads`, payloads JSON, erreurs)
  - [ ] Pilier #7 : Configuration Exhaustive & CLI (`configuration-reference.mdx` — Tableau complet des options, défauts, variables `.env` et CLI)
  - [ ] Pilier #9 : Exigences Non-Fonctionnelles (`non-fonctionnel.mdx` — Latence, coûts, sécurité, scalabilité)
  - [ ] Pilier #10 : Dépendances & Hypothèses (`dependances-et-hypotheses.mdx` — Matrice des services tiers et versions critiques)
  - [ ] Pilier #11 : Risques & Compromis (`risques-et-compromis.mdx` — ADR et analyse de défaillance)
  - [ ] Pilier #12 : Guide de Contribution (`CONTRIBUTING.md` + `contribution.mdx`)
