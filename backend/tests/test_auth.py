import pytest
pytestmark = pytest.mark.django_db

import json

def test_register_and_obtain_token(api_client):
    payload = {
        "username": "demo_test",
        "email": "demo_test@example.com",
        "password": "safepwd123",
        "first_name": "Demo",
        "last_name": "User",
    }

    # Register
    resp = api_client.post("/api/auth/register/", payload, format="json")
    assert resp.status_code == 201, f"Register failed: {resp.status_code} {resp.content}"
    data = resp.json()
    assert data.get("username") == payload["username"]

    # Obtain token
    resp2 = api_client.post(
        "/api/auth/token/",
        {"username": payload["username"], "password": payload["password"]},
        format="json",
    )
    assert resp2.status_code == 200
    tokens = resp2.json()
    assert "access" in tokens and "refresh" in tokens


def test_token_refresh(api_client):
    payload = {
        "username": "demo_refresh",
        "email": "demo_ref@example.com",
        "password": "safepwd123",
    }

    # Register
    r = api_client.post("/api/auth/register/", payload, format="json")
    assert r.status_code == 201

    # Obtain token
    t = api_client.post(
        "/api/auth/token/",
        {"username": payload["username"], "password": payload["password"]},
        format="json",
    )
    assert t.status_code == 200
    refresh = t.json().get("refresh")
    assert refresh

    # Refresh token
    r2 = api_client.post("/api/auth/token/refresh/", {"refresh": refresh}, format="json")
    assert r2.status_code == 200
    assert "access" in r2.json()
