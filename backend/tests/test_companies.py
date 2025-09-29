from django.urls import reverse




def test_create_company_requires_auth(api_client):
    resp = api_client.post("/api/companies/", {"name": "NoAuthCo"}, format="json")
    assert resp.status_code in (401, 403)




def test_create_company_with_auth(auth_client):
    client, user = auth_client
    resp = client.post("/api/companies/", {"name": "My Company"}, format="json")
    assert resp.status_code == 201
    data = resp.json()
    assert data.get("name") == "My Company"
