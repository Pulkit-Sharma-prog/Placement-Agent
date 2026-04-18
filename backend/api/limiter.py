"""
api/limiter.py — Shared slowapi Limiter instance.

Lives in its own module so routes can import it without pulling in
api.main (which imports the routes, creating a cycle).
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
