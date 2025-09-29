import io
from django.core.files.uploadedfile import SimpleUploadedFile
from core.models import Company




def test_upload_document_and_list(auth_client, tmp_path):
    client, user = auth_client


    # Ensure a company exists
    company = Company.objects.create(name="UploadCo")


    # Create a simple in-memory file
    content = b"hello pdf content"
    upload = SimpleUploadedFile("cv.pdf", content, content_type="application/pdf")


    resp = client.post(
    "/api/documents/",
    {"company": str(company.id), "uploaded_by": str(user.id), "file": upload},
    format="multipart",
    )
    assert resp.status_code == 201, f"Upload failed: {resp.status_code} {resp.content}"
    data = resp.json()
    assert data.get("filename") == "cv.pdf"


    # List documents
    resp2 = client.get("/api/documents/")
    assert resp2.status_code == 200
    results = resp2.json()
    assert isinstance(results, list) or "results" in results
