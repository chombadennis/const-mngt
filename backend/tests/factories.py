# Small helpers (not required to use factory_boy; these are convenience functions)
from django.contrib.auth import get_user_model
from core.models import Company


User = get_user_model()


def create_company(name="Demo Company"):
    return Company.objects.create(name=name)


def create_user(username="user", password="pass1234", company=None, **kwargs):
    user = User.objects.create_user(username=username, password=password, **kwargs)
    if company:
        user.company = company
        user.save()
    return user
