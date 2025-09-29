def test_projects_list_requires_auth(api_client):
    resp = api_client.get("/api/projects/")
    assert resp.status_code in (401, 403)




def test_projects_list_with_auth(auth_client):
    client, _user = auth_client
    resp = client.get("/api/projects/")
    assert resp.status_code == 200
