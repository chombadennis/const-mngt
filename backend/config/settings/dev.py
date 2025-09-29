from .base import *

DEBUG = True

# For local dev allow everything by default (override in .env)
ALLOWED_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0"]

# Use SQLite by default for tiny local dev if DATABASE_URL not provided
if DATABASES["default"]["ENGINE"].endswith("sqlite3"):
    # keep default sqlite
    pass

# Allow local frontend host
CORS_ALLOWED_ORIGINS += [
    "http://localhost:3000",
]

# Simplified email backend for dev
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
