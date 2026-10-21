"""
Mem0 client integration for memory management.

This module provides integration with mem0.ai for managing an agent's memory state.
It handles memory storage, retrieval, and management through the mem0.ai API.

Environment Setup
-----------------
Before using the library, ensure you have set the following environment variables:
  - MEM0_API_KEY: Your mem0.ai API key
  - MEM0_ORG_ID: Your organization ID
  - MEM0_PROJECT_ID: Your project ID
  - MEM0_USER_ID: A unique identifier for the user (e.g., 'test-user')
  - MEM0_APP_ID: The application ID (default is "mirror-agent")
  - MEM0_RUN_ID: The run ID (default is "test-run")

Example (in Python):

    import os
    os.environ['MEM0_API_KEY'] = 'your_api_key'
    os.environ['MEM0_ORG_ID'] = 'your_org_id'
    os.environ['MEM0_PROJECT_ID'] = 'your_project_id'
    os.environ['MEM0_USER_ID'] = 'test-user'
    os.environ['MEM0_APP_ID'] = 'mirror-agent'
    os.environ['MEM0_RUN_ID'] = 'test-run'

    from src.retrieval_graph.mem0_client import Mem0Memory
    mem0 = Mem0Memory()
    mem0.add_memory("This is a sample memory text.")
"""

import logging
import os
from typing import Any, Dict, List, Optional, Sequence

from langchain.schema import Document
from langchain_core.messages import AIMessage, AnyMessage, HumanMessage, SystemMessage
from mem0.client.main import MemoryClient

logger = logging.getLogger(__name__)

MESSAGE_TYPES: Dict[str, type[HumanMessage | AIMessage | SystemMessage]] = {
    "human": HumanMessage,
    "ai": AIMessage,
    "system": SystemMessage,
}


class Mem0Memory:
    """Memory management using mem0.ai."""

    def __init__(self):
        """Initialize the mem0 client with configuration from environment variables."""
        self.user_id = os.getenv('MEM0_USER_ID')
        if not self.user_id:
            raise ValueError("MEM0_USER_ID must be set in the environment.")
        self.user_id = self.user_id.strip("'").strip('"')

        self.app_id = os.getenv("MEM0_APP_ID", "mirror-agent")
        self.run_id = os.getenv("MEM0_RUN_ID", "test-run")
        self.agent_id = "mirror-agent"

        self.client = MemoryClient(
            api_key=os.getenv('MEM0_API_KEY'),
            org_id=os.getenv('MEM0_ORG_ID'),
            project_id=os.getenv('MEM0_PROJECT_ID')
        )

    def _add_memory_item(self, text: str, metadata: Dict[str, Any]) -> None:
        """Helper method to add a memory item with proper filtering."""
        memory_dict = {
            "text": text,
            "metadata": metadata,
            "agent_id": self.agent_id,
            "user_id": self.user_id,
            "app_id": self.app_id,
            "run_id": self.run_id
        }
        self.client.add([memory_dict])

    def get_memories(self, query: str = "", metadata: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Search for and retrieve memories matching the query and filters."""
        search_params = {
            "query": query,
            "agent_id": self.agent_id,
            "user_id": self.user_id,
            "app_id": self.app_id,
            "run_id": self.run_id
        }
        if metadata:
            search_params["metadata"] = metadata
        return self.client.search(**search_params)

    def add_memory(self, memory: str) -> None:
        """Store a simple text memory.

        Args:
            memory (str): The memory text to be stored.
        """
        self._add_memory_item(memory, {"type": "memory"})

    def add_message(self, message: AnyMessage) -> None:
        """Store a conversation message.

        Args:
            message (AnyMessage): A message object (e.g., HumanMessage or AIMessage).
        """
        metadata = {
            "type": "message",
            "message_type": message.type,
            "additional_kwargs": message.additional_kwargs
        }
        self._add_memory_item(message.content, metadata)

    def add_document(self, document: Document) -> None:
        """Store a document.

        Args:
            document (Document): A Document object containing page content and metadata.
        """
        metadata = {
            "type": "document",
            **document.metadata
        }
        self._add_memory_item(document.page_content, metadata)

    def get_messages(self) -> Sequence[AnyMessage]:
        """Retrieve stored conversation messages.

        Returns:
            Sequence[AnyMessage]: List of conversation messages.
        """
        try:
            memories = self.get_memories(metadata={"type": "message"})
        except Exception:
            logger.exception("Failed to retrieve message memories from storage")
            return []

        messages: List[AnyMessage] = []
        for memory in memories or []:
            if not isinstance(memory, dict):
                logger.warning(
                    "Skipping invalid memory entry (expected dict, got %s)",
                    type(memory).__name__,
                )
                continue

            metadata = memory.get("metadata")
            if not isinstance(metadata, dict):
                metadata = {}

            content = memory.get("text") or memory.get("memory") or ""
            msg_type = metadata.get("message_type") or "human"
            additional_kwargs = metadata.get("additional_kwargs")
            if not isinstance(additional_kwargs, dict):
                additional_kwargs = {}

            message_cls = MESSAGE_TYPES.get(msg_type, HumanMessage)
            try:
                msg = message_cls(
                    content=str(content),
                    additional_kwargs=additional_kwargs,
                )
                messages.append(msg)
            except Exception:
                logger.exception("Failed to parse memory into message: %s", memory)

        return messages

    def get_documents(self) -> Sequence[Document]:
        """Retrieve stored documents.

        Returns:
            Sequence[Document]: List of stored documents.
        """
        try:
            memories = self.get_memories(metadata={"type": "document"})
        except Exception:
            logger.exception("Failed to retrieve document memories from storage")
            return []

        documents: List[Document] = []
        for memory in memories or []:
            if not isinstance(memory, dict):
                logger.warning(
                    "Skipping invalid document memory entry (expected dict, got %s)",
                    type(memory).__name__,
                )
                continue

            metadata = memory.get("metadata")
            if not isinstance(metadata, dict):
                metadata = {}

            content = memory.get("text") or memory.get("memory") or ""
            try:
                doc = Document(
                    page_content=str(content),
                    metadata=metadata,
                )
                documents.append(doc)
            except Exception:
                logger.exception("Failed to parse memory into Document: %s", memory)

        return documents