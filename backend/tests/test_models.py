from core.models import Company
from django.contrib.auth import get_user_model


User = get_user_model()




def test_company_model_create(db):
    c = Company.objects.create(name="ModelCo")
    assert c.id is not None




def test_user_creation(db):
    u = User.objects.create_user(username="mtest", password="mtestpass")
    assert u.username == "mtest"
