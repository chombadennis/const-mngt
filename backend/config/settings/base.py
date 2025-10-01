"""
Base Django settings for all environments.
Environment variables are read using django-environ.
This version is adapted to use the cloudinary Python SDK for direct uploads
and django-storages (boto3) for S3-compatible R2 storage.
"""

from pathlib import Path
import environ
import os

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env(
    SECRET_KEY=(str, ""),
    DEBUG=(bool, True),
    ALLOWED_HOSTS=(list, ["localhost", "127.0.0.1"]),
    DATABASE_URL=(str, "sqlite:///{}".format(BASE_DIR / "db.sqlite3")),
    STORAGE_PROVIDER=(str, "local"),  # local | cloudinary | r2
)

# Read .env if present
ENV_FILE = os.path.join(BASE_DIR, ".env")
if os.path.exists(ENV_FILE):
    environ.Env.read_env(ENV_FILE)

SECRET_KEY = env("SECRET_KEY")
DEBUG = env("DEBUG")

ALLOWED_HOSTS = env("ALLOWED_HOSTS")

# Application definition
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # 3rd-party
    "rest_framework",
    "corsheaders",
    "storages",

    # local apps
    "core.apps.CoreConfig",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# Database: use DATABASE_URL env var
DATABASES = {"default": env.db()}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_L10N = True
USE_TZ = True

# Static & media
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# Default primary key - use UUIDs where models define it explicitly
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Custom user model (we'll define core.User)
AUTH_USER_MODEL = "core.User"

# DRF & JWT configuration
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
}

# Simple JWT
from datetime import timedelta
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "AUTH_HEADER_TYPES": ("Bearer",),   # accept Bearer
    "USER_ID_FIELD": "id",              # UUID support
    "USER_ID_CLAIM": "user_id",
}

# CORS
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=[])
CORS_ALLOW_CREDENTIALS = True

# -----------------------
# Storage provider config
# -----------------------
# Choose STORAGE_PROVIDER via env: "local" | "cloudinary" | "r2"
STORAGE_PROVIDER = env("STORAGE_PROVIDER", default="local")

# Cloudinary SDK configuration (for direct uploads via the cloudinary Python SDK)
# Requires the `cloudinary` package (you included cloudinary>=1.41 in requirements).
CLOUDINARY_CLOUD_NAME = env("CLOUDINARY_CLOUD_NAME", default="")
CLOUDINARY_API_KEY = env("CLOUDINARY_API_KEY", default="")
CLOUDINARY_API_SECRET = env("CLOUDINARY_API_SECRET", default="")

if CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET:
    try:
        import cloudinary

        cloudinary.config(
            cloud_name=CLOUDINARY_CLOUD_NAME,
            api_key=CLOUDINARY_API_KEY,
            api_secret=CLOUDINARY_API_SECRET,
            secure=True,
        )
    except Exception:
        # If cloudinary library is missing or misconfigured, keep going.
        # The presence of these env vars signals intent to use Cloudinary for image uploads.
        pass

# Cloudflare R2 (S3-compatible) via django-storages/boto3
if STORAGE_PROVIDER == "r2":
    DEFAULT_FILE_STORAGE = "storages.backends.s3boto3.S3Boto3Storage"
    AWS_ACCESS_KEY_ID = env("R2_ACCESS_KEY_ID", default="")
    AWS_SECRET_ACCESS_KEY = env("R2_SECRET_ACCESS_KEY", default="")
    AWS_STORAGE_BUCKET_NAME = env("R2_BUCKET_NAME", default="")
    AWS_S3_REGION_NAME = env("R2_REGION", default="")
    AWS_S3_ENDPOINT_URL = env("R2_ENDPOINT_URL", default="")  # e.g. https://<accountid>.r2.cloudflarestorage.com
    AWS_DEFAULT_ACL = None
    AWS_S3_OBJECT_PARAMETERS = {"CacheControl": "max-age=86400"}

elif STORAGE_PROVIDER == "cloudinary":
    # Two options for Cloudinary integration:
    # 1) Use direct Cloudinary SDK upload (recommended with current requirements).
    #    Keep Django file storage local and call cloudinary.uploader.upload(...) in your views/serializers.
    # 2) If you prefer a Django storage backend for Cloudinary, install:
    #       pip install django-cloudinary-storage
    #    and then set:
    #       DEFAULT_FILE_STORAGE = "cloudinary_storage.storage.MediaCloudinaryStorage"
    #
    # To avoid import-time failures if django-cloudinary-storage is not installed,
    # we keep the default as local filesystem by default. Use direct SDK calls until
    # you intentionally install `django-cloudinary-storage`.
    DEFAULT_FILE_STORAGE = "django.core.files.storage.FileSystemStorage"

else:
    # Local filesystem (default)
    DEFAULT_FILE_STORAGE = "django.core.files.storage.FileSystemStorage"

# -----------------------
# Logging (basic, can be overridden in prod)
# -----------------------
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {"class": "logging.StreamHandler"},
    },
    "root": {"handlers": ["console"], "level": "INFO"},
}

# Sentry placeholder
SENTRY_DSN = env("SENTRY_DSN", default="")
if SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration

    sentry_sdk.init(dsn=SENTRY_DSN, integrations=[DjangoIntegration()], traces_sample_rate=0.0)

from corsheaders.defaults import default_headers

CORS_ALLOW_HEADERS = list(default_headers) + [
    "authorization",
]
