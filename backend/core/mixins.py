from django.core.exceptions import FieldDoesNotExist
from rest_framework.exceptions import PermissionDenied


class CompanyScopedMixin:
    """
    Restricts queryset to the company of the current user, unless superuser.
    """

    def get_company_from_request(self):
        user = getattr(self.request, "user", None)
        return getattr(user, "company", None) if user and hasattr(user, "company") else None

    def get_queryset(self):
        queryset = getattr(self, "queryset", None)
        if queryset is None:
            queryset = super().get_queryset()

        user = getattr(self.request, "user", None)
        if user and user.is_superuser:
            return queryset

        company = self.get_company_from_request()
        if company is None:
            return queryset.none()

        model = queryset.model
        try:
            model._meta.get_field("company")
            return queryset.filter(company=company)
        except FieldDoesNotExist:
            if any(f.name == "project" for f in model._meta.fields):
                return queryset.filter(project__company=company)
            return queryset


class CompanyCreateMixin:
    """
    Automatically sets company and uploaded_by on create if available.
    """

    def perform_create(self, serializer):
        user = getattr(self.request, "user", None)
        company = getattr(user, "company", None) if user else None
        try:
            serializer.save(company=company, uploaded_by=user)
        except TypeError:
            serializer.save(company=company)
