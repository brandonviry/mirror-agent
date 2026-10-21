# Documentation Weave (Weights & Biases)

**Source** : [https://weave-docs.wandb.ai/](https://weave-docs.wandb.ai/)

**Weave** est une boîte à outils légère conçue par **Weights & Biases** pour le suivi (tracking) et l'évaluation des applications basées sur des modèles de langage (LLM).

---

## Introduction

L'objectif de Weave est d'apporter de la rigueur, des bonnes pratiques et de la composabilité au processus intrinsèquement expérimental du développement d'applications IA, sans alourdir la charge cognitive des développeurs.

Pour démarrer, il suffit de décorer vos fonctions Python avec `@weave.op()`.

Vous pouvez utiliser Weave pour :
- **Journaliser et déboguer** les entrées, sorties et traces d'exécution des modèles de langage.
- **Construire des évaluations rigoureuses et comparables** pour vos cas d'usage LLM (`weave.Evaluation`).
- **Organiser l'ensemble des informations générées** tout au long du cycle de vie LLM, de l'expérimentation à l'évaluation jusqu'à la mise en production.

---

## Utilisation dans Mirror Agent (`utils/eval_rag_pipeline.py`)

Dans ce dépôt, **Weave** est utilisé par le script [`utils/eval_rag_pipeline.py`](../utils/eval_rag_pipeline.py) pour évaluer la qualité de la recherche documentaire (RAG) sur ChromaDB à partir de questions synthétiques générées via [`utils/generate_synthetic_questions.py`](../utils/generate_synthetic_questions.py) :

- La fonction `evaluate_retrieval_only` est décorée avec `@weave.op()` pour tracer chaque requête envoyée au retriever (`retriever_provider="chroma"`, `k=5`).
- Le modèle d'évaluation `RetrievalOnlyModel` (`weave.Model`) et les métriques de précision (`exact_match_metric`, `similarity_score_metric` basées sur la distance de Levenshtein) sont orchestrés via `weave.Evaluation` sous le projet `weave.init("obsidian-rag-eval")`.
