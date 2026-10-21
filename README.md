# Mirror Agent - Your AI Guide to Self-Reflection

Mirror Agent is an innovative AI companion designed to help you understand yourself better through guided introspection and meaningful dialogue. Drawing inspiration from Socratic methods and modern psychological practices, it serves as a digital mirror, reflecting your thoughts and patterns back to you in ways that foster deeper self-awareness.

## The Vision

The inspiration behind Mirror Agent comes from the understanding that self-reflection is a powerful tool for personal growth, yet it's often challenging to practice effectively on our own. By combining AI capabilities with principles of introspective dialogue, Mirror Agent creates a unique space for:

- **Socratic Guidance**: Asking thoughtful questions that encourage you to explore your thoughts and feelings more deeply
- **Personalized Reflection**: Learning from your past interactions to provide increasingly meaningful and context-aware responses
- **Memory-Enhanced Understanding**: Building a comprehensive understanding of your journey through careful documentation of your insights and patterns
- **Self Exploration**: Offering a judgment-free space to explore your thoughts and feelings

## Core Features

- **Model-Agnostic Architecture**: Freedom to choose your preferred LLM backend
- **Memory System**: Maintains context of your journey while respecting privacy
- **Document Integration**: References your personal documents and past reflections
- **Reflective Intelligence**: Helps identify patterns and insights in your thinking
- **Multi-Modal Interface**: Supports text, audio, and video interactions

## Getting Started

> **Important Note**: This project is a **LangGraph** application defined in [`langgraph.json`](./langgraph.json) (not a standalone `main.py` script). It exposes two graphs:
> - `retrieval_graph` (`./src/retrieval_graph/graph.py:graph`): Conversational retrieval and reasoning graph.
> - `indexer` (`./src/retrieval_graph/index_graph.py:graph`): Document indexing graph.

### 1. Create a Virtual Environment & Install Dependencies

```bash
python -m venv .venv
# On Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# On macOS/Linux:
source .venv/bin/activate

pip install -e .
pip install mem0ai langgraph-cli[inmem] pytest
```

### 2. Configure Environment Variables (`.env`)

Copy `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

Required environment variables (note that `MEM0_USER_ID` is required at import time by `Mem0Memory`):
- `OPENAI_API_KEY`: For the default query and response model (`openai/gpt-4o`)
- `GOOGLE_API_KEY`: For the reasoning node (`gemini-2.0-flash-thinking-exp-01-21`)
- `MEM0_API_KEY`, `MEM0_ORG_ID`, `MEM0_PROJECT_ID`: Your [mem0.ai](https://mem0.ai) credentials
- `MEM0_USER_ID`: Unique identifier for the user (e.g., `test-user`)

### 3. Run the Agent

Start the local LangGraph development server (LangGraph Studio):

```bash
langgraph dev
```

Or run the test suites:

```bash
# Unit tests
pytest tests/unit_tests

# Mem0 integration tests
python -m unittest tests/test_mem0_integration.py
```

## Recent Improvements (`mem0_client.py`)

- **Fixed `AnyMessage` instantiation bug**: Replaced invalid `AnyMessage(...)` calls (`typing.Union` cannot be instantiated at runtime) with concrete LangChain message classes (`HumanMessage`, `AIMessage`, `SystemMessage`) mapped from `metadata["message_type"]`.
- **Granular error handling & logging**: Isolated storage retrieval errors from per-item parsing errors in `get_messages()` and `get_documents()`, replacing `print()` statements with structured `logging.exception()` calls (compliant with Ruff `T201`).
- **Null-safe metadata and content parsing**: Added defensive checks when `metadata` or `additional_kwargs` is `None` and added fallback support for both `"text"` and `"memory"` payload keys.

## Connect

Created by [@daniel_mac8](https://twitter.com/daniel_mac8) on X

---

Mirror Agent is more than just a chatbot - it's your companion in the journey of self-discovery and personal growth. Through thoughtful dialogue and persistent memory, it helps you understand your patterns, challenge your assumptions, and grow in self-awareness.