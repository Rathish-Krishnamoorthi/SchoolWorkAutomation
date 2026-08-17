"""
MongoDB connection via Motor (async).
Beanie ODM is initialised in main.py on startup using init_beanie().

TLS note for Windows + Python 3.10 + MongoDB Atlas:
  Some Windows + Python 3.10 environments get TLSV1_ALERT_INTERNAL_ERROR
  during the TLS handshake with Atlas.  There are two common causes:

  1. IP not whitelisted in Atlas Network Access  ← most common
     Fix: add your server's public IP in Atlas → Security → Network Access.

  2. Client OpenSSL cipher negotiation fails at SECLEVEL=2.
     Fix: we patch pymongo.ssl_support.get_ssl_context to call
     set_ciphers("DEFAULT@SECLEVEL=1") on every context it creates, which
     relaxes the minimum acceptable cipher strength.
"""
import ssl as _ssl_module
import pymongo.ssl_support as _pymongo_ssl
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

# ── Patch pymongo's SSL context builder to lower cipher security level ─────────
_original_get_ssl_context = _pymongo_ssl.get_ssl_context


def _patched_get_ssl_context(*args, **kwargs):
    ctx = _original_get_ssl_context(*args, **kwargs)
    try:
        ctx.set_ciphers("DEFAULT@SECLEVEL=1")
    except _ssl_module.SSLError:
        pass  # fall through with default ciphers if the string is rejected
    return ctx


_pymongo_ssl.get_ssl_context = _patched_get_ssl_context
# ──────────────────────────────────────────────────────────────────────────────

# Single shared Motor client — created once at import time.
# FastAPI lifespan handler calls init_beanie() before any request is served.
client: AsyncIOMotorClient = AsyncIOMotorClient(
    settings.MONGODB_URI,
    tls=True,
    tlsAllowInvalidCertificates=True,
    serverSelectionTimeoutMS=30000,
    connectTimeoutMS=20000,
    socketTimeoutMS=20000,
)
database = client[settings.MONGODB_DB_NAME]
