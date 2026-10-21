# Lessons

- Pour les chemins d'images sur un site web, toujours utiliser le chemin relatif correct (ex. `'images/filename.png'`) et vérifier que le dossier `images` existe.
- Pour les résultats de recherche et le scraping, garantir une gestion propre de l'encodage `UTF-8` pour les requêtes internationales.
- Envoyer les informations de débogage vers `stderr` ou via `logging` tout en gardant la sortie principale propre sur `stdout` pour faciliter l'intégration dans les pipelines.
- Dans `src/`, la règle Ruff `T201` interdit tout appel à `print()` : utiliser exclusivement `logging.getLogger(__name__)`.
- Dans `langchain_core.messages`, `AnyMessage` est un alias `typing.Union` non instanciable : toujours passer par la table de correspondance `MESSAGE_TYPES` (`HumanMessage`, `AIMessage`, `SystemMessage`).
- Avec l'API `mem0.ai`, les filtres `user_id`, `agent_id`, `app_id` et `run_id` doivent être placés à la racine du payload (jamais imbriqués sous `"filters"`).
- Lors de l'utilisation de styles seaborn dans matplotlib, utiliser `'seaborn-v0_8'` au lieu de `'seaborn'`.
- Ne jamais charger en entier `docs/langgraph.md` (8,2 Mo) dans le contexte d'un LLM.

# Scratchpad

- [X] Mettre à jour et traduire en français la documentation du projet dans `docs/` et `README.md`
- [X] Créer `AGENTS.md` à la racine de `mirror-agent` (stack, commandes, structure, conventions et interdits)
- [X] Créer `GEMINI.md` à la racine de `mirror-agent` (conditionnement de l'agent, langue, format, prudence et méthode de travail issue de `.windsurfrules`)
