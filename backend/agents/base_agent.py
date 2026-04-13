"""
base_agent.py — Abstract base class for all Placements Agent System agents.
"""

import logging
from abc import ABC, abstractmethod
from typing import Any, Dict

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s — %(message)s",
)


class BaseAgent(ABC):
    name: str = "BaseAgent"
    version: str = "1.0.0"

    def __init__(self):
        self.logger = logging.getLogger(self.name)

    @abstractmethod
    async def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the agent's primary task."""
        pass

    async def validate_input(self, input_data: Dict[str, Any]) -> bool:
        return True

    def log(self, message: str, level: str = "INFO"):
        getattr(self.logger, level.lower(), self.logger.info)(
            f"[{self.name} v{self.version}] {message}"
        )
