from typing import Optional
from supabase import create_client, Client
from smart_ticket.core.config import settings

_supabase_client: Optional[Client] = None


def get_supabase_client() -> Optional[Client]:
    """
    Returns an initialized Supabase Python Client if credentials are provided in .env
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    if (
        settings.SUPABASE_URL 
        and settings.SUPABASE_KEY 
        and "your-project-id" not in settings.SUPABASE_URL
    ):
        try:
            _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
            return _supabase_client
        except Exception as e:
            print(f"[Supabase Client Init Error]: {e}")
            return None
    return None

