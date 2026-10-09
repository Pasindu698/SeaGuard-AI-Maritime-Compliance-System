
"""
Reusable authentication and authorization dependencies
for SeaGuard AI agents.
"""

from backend.routes.auth import get_current_user, require_role

__all__ = ["get_current_user", "require_role"]
