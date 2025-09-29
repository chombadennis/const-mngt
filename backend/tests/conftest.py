import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient


User = get_user_model()


@pytest.fixture
def api_client():
    """Unauthenticated DRF API client."""
    return APIClient()


@pytest.fixture
def create_user(db):
    """Helper to create a user via ORM. Returns the created user instance."""
    def _create_user(username="user", password="pass1234", **extra):
        return User.objects.create_user(username=username, password=password, **extra)


    return _create_user


@pytest.fixture
def auth_client(api_client, create_user):
    """Authenticated API client (obtains JWT via the token endpoint). Returns (client, user)."""
    username = "testuser"
    password = "testpass123"
    user = create_user(username=username, password=password, email=f"{username}@example.com")


    # Obtain token via your API endpoint (adjust path if your token endpoint differs)
    resp = api_client.post("/api/auth/token/", {"username": username, "password": password}, format="json")
    assert resp.status_code == 200, f"Token endpoint failed: {resp.status_code} {resp.data}"
    token = resp.data.get("access")
    assert token, "No access token returned from token endpoint"


    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    return api_client, user
