# Documentation de l'Intégration Python Mem0.ai (`Mem0Memory`)

## Vue d'ensemble

Le module [`src/retrieval_graph/mem0_client.py`](../src/retrieval_graph/mem0_client.py) fournit l'intégration avec l'API **mem0.ai** pour gérer l'état de la mémoire à long terme de l'agent. Il permet d'ajouter, de rechercher et de récupérer différents types de souvenirs — notamment des souvenirs en texte brut, des messages de conversation LangChain et des documents — via la classe `Mem0Memory`.

---

## Configuration de l'Environnement

Avant d'utiliser `Mem0Memory`, assurez-vous que les variables d'environnement suivantes sont définies :

- `MEM0_API_KEY` : Votre clé API mem0.ai
- `MEM0_ORG_ID` : L'identifiant de votre organisation Mem0
- `MEM0_PROJECT_ID` : L'identifiant de votre projet Mem0
- `MEM0_USER_ID` : Un identifiant unique pour l'utilisateur (ex. `'test-user'`). **Obligatoire** (une exception `ValueError` est levée à l'initialisation s'il est absent ; les guillemets superflus éventuels sont nettoyés automatiquement).
- `MEM0_APP_ID` : L'identifiant de l'application (par défaut `"mirror-agent"`)
- `MEM0_RUN_ID` : L'identifiant d'exécution (par défaut `"test-run"`)

### Exemple d'initialisation (en Python)

```python
import os

os.environ["MEM0_API_KEY"] = "votre_cle_api"
os.environ["MEM0_ORG_ID"] = "votre_org_id"
os.environ["MEM0_PROJECT_ID"] = "votre_project_id"
os.environ["MEM0_USER_ID"] = "test-user"
os.environ["MEM0_APP_ID"] = "mirror-agent"
os.environ["MEM0_RUN_ID"] = "test-run"

from src.retrieval_graph.mem0_client import Mem0Memory

mem0 = Mem0Memory()
```

---

## Méthodes Principales

### 1. Ajouter un Souvenir (`add_memory`)

Utilisez `add_memory` pour enregistrer un souvenir textuel simple (`metadata={"type": "memory"}`).

```python
mem0.add_memory("Ceci est un exemple de souvenir textuel.")
```

En interne, la méthode privée `_add_memory_item` construit un dictionnaire contenant :
- `text` : Le contenu textuel du souvenir
- `metadata` : `{"type": "memory"}`
- `user_id` : L'identifiant utilisateur issu de `MEM0_USER_ID`
- `agent_id` : Fixé à `"mirror-agent"`
- `app_id` et `run_id` : Issus des variables d'environnement (ou de leurs valeurs par défaut)

### 2. Ajouter un Message (`add_message`)

Utilisez `add_message` pour enregistrer des messages de conversation. Cette méthode accepte tout objet message LangChain (`HumanMessage`, `AIMessage`, `SystemMessage` de `langchain_core.messages`).

```python
from langchain_core.messages import HumanMessage

human_msg = HumanMessage(content="Bonjour, Mirror Agent !")
mem0.add_message(human_msg)
```

La méthode enregistre le contenu du message avec les métadonnées suivantes :
- `type` : `"message"`
- `message_type` : Le type du message (`"human"`, `"ai"` ou `"system"`)
- `additional_kwargs` : Les arguments additionnels associés au message

### 3. Ajouter un Document (`add_document`)

Utilisez `add_document` pour enregistrer un document (`langchain.schema.Document`).

```python
from langchain.schema import Document

doc = Document(
    page_content="Contenu du document personnel.",
    metadata={"source": "obsidian", "timestamp": "2026-10-21T12:00:00"}
)
mem0.add_document(doc)
```

Cette méthode stocke `doc.page_content` et fusionne `doc.metadata` avec `"type": "document"`.

### 4. Rechercher des Souvenirs (`get_memories`)

Utilisez `get_memories(query="", metadata=None)` pour rechercher et récupérer les entrées correspondant à une requête et à un filtre de métadonnées optionnel. Les filtres `user_id`, `agent_id`, `app_id` et `run_id` sont appliqués automatiquement.

```python
results = mem0.get_memories("exemple")
for mem in results:
    print(mem)
```

### 5. Récupérer les Messages et Documents Stockés (`get_messages` & `get_documents`)

La bibliothèque fournit deux méthodes spécialisées utilisées par les réducteurs d'état LangGraph (`reduce_messages` et `reduce_docs` dans [`src/retrieval_graph/state.py`](../src/retrieval_graph/state.py)) :

- **`get_messages() -> Sequence[AnyMessage]`** :
  - Récupère les souvenirs ayant `metadata={"type": "message"}`.
  - Résout la classe concrète via la table `MESSAGE_TYPES` (`"human": HumanMessage`, `"ai": AIMessage`, `"system": SystemMessage`), évitant l'erreur `TypeError: Cannot instantiate typing.Union` liée à l'alias `AnyMessage`.
  - Extrait le texte de manière résiliente (`memory.get("text") or memory.get("memory") or ""`) et vérifie que `metadata` et `additional_kwargs` sont bien des dictionnaires (`isinstance(..., dict)`).
  - Isole les erreurs réseau/API des erreurs de parsing d'un élément individuel et journalise les anomalies via `logging` (`logger.exception` / `logger.warning`).

- **`get_documents() -> Sequence[Document]`** :
  - Récupère les souvenirs ayant `metadata={"type": "document"}`.
  - Reconstruit chaque objet `Document(page_content=..., metadata=...)` avec la même tolérance aux pannes et validation défensive des types.

```python
stored_messages = mem0.get_messages()
for msg in stored_messages:
    print(f"[{msg.type}] {msg.content}")

stored_docs = mem0.get_documents()
for doc in stored_docs:
    print(doc.page_content)
```

---

## Notes Importantes sur l'API Mem0

### Filtres Obligatoires à la Racine

L'API `mem0.ai` exige au moins l'un des filtres suivants pour chaque requête :
- `agent_id`
- `user_id`
- `app_id`
- `run_id`

Ces filtres doivent figurer **à la racine** de la charge utile (payload), et non imbriqués sous une clé `"filters"` :

```python
# Format correct (utilisé par Mem0Memory._add_memory_item)
memory_message = {
    "text": "Contenu du souvenir",
    "metadata": {"type": "memory"},
    "user_id": "test-user",      # Filtre à la racine
    "agent_id": "mirror-agent",  # Filtre à la racine
    "app_id": "mirror-agent",    # Filtre à la racine
    "run_id": "test-run"         # Filtre à la racine
}

# Format incorrect (provoque une erreur HTTP 400)
memory_message_invalide = {
    "text": "Contenu du souvenir",
    "filters": {  # Ne pas imbriquer sous "filters"
        "user_id": "test-user",
        "agent_id": "mirror-agent",
        "app_id": "mirror-agent",
        "run_id": "test-run"
    }
}
```

Configurez vos variables d'environnement dans votre fichier `.env` avant de lancer l'application ou les tests :

```bash
export MEM0_USER_ID="test-user"
export MEM0_APP_ID="mirror-agent"
export MEM0_RUN_ID="test-run"
```
