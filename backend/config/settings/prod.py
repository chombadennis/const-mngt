from .base import *
import os

DEBUG = False

ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=[])

# Security hardening recommended for production
SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", True)
SESSION_COOKIE_SECURE = env.bool("SESSION_COOKIE_SECURE", True)
CSRF_COOKIE_SECURE = env.bool("CSRF_COOKIE_SECURE", True)
SECURE_HSTS_SECONDS = env.int("SECURE_HSTS_SECONDS", 31536000)
SECURE_HSTS_INCLUDE_SUBDOMAINS = env.bool("SECURE_HSTS_INCLUDE_SUBDOMAINS", True)
SECURE_HSTS_PRELOAD = env.bool("SECURE_HSTS_PRELOAD", True)
SECURE_REFERRER_POLICY = "no-referrer-when-downgrade"
X_FRAME_OPTIONS = "DENY"

# CORS: whitelist front-end (Vercel) origin
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=[])

# Database must be provided via DATABASE_URL (Neon etc)
DATABASES = {"default": env.db()}

# Logging: more verbose for prod
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {"format": "%(levelname)s %(asctime)s %(module)s %(process)d %(thread)d %(message)s"},
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "verbose"},
    },
    "root": {"handlers": ["console"], "level": "INFO"},
}
