from django.shortcuts import render

from rest_framework import viewsets, status, generics, permissions, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import get_user_model
from .mixins import CompanyScopedMixin, CompanyCreateMixin
from .models import (
    Role,
    Company,
    Project,
    Task,
    Worker,
    Timesheet,
    Material,
    PurchaseOrder,
    PurchaseOrderLine,
    Equipment,
    MaintenanceRecord,
    Inspection,
    Invoice,
    Document,
    ActivityLog,
)
from .serializers import (
    RoleSerializer,
    CompanySerializer,
    ProjectSerializer,
    TaskSerializer,
    WorkerSerializer,
    TimesheetSerializer,
    MaterialSerializer,
    PurchaseOrderSerializer,
    PurchaseOrderLineSerializer,
    EquipmentSerializer,
    MaintenanceRecordSerializer,
    InspectionSerializer,
    InvoiceSerializer,
    DocumentSerializer,
    ActivityLogSerializer,
    UserSerializer,
    RegisterSerializer,
)
from .permissions import IsAdminOrReadOnly, RoleBasedPermission

User = get_user_model()

# -------------------------
# Auth / Registration
# -------------------------
class RegisterView(generics.CreateAPIView):
    """
    Public endpoint to register a new user. Optionally pass `company_id` to join a company.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer


# -------------------------
# Basic ModelViewSets
# -------------------------
class UserViewSet(CompanyScopedMixin, CompanyCreateMixin, viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["username", "email", "first_name", "last_name"]
    ordering_fields = ["username", "email"]

    def get_queryset(self):
        qs = User.objects.all().order_by("-id")
        company = self.get_company_from_request()
        # superusers see everything
        if getattr(self.request.user, "is_superuser", False) or not company:
            return qs
        return qs.filter(company=company).order_by("-id")


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAdminOrReadOnly]


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [IsAdminOrReadOnly]


class ProjectViewSet(CompanyScopedMixin, CompanyCreateMixin, viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [RoleBasedPermission]
    required_roles = ["PM", "Admin"]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "code"]
    ordering_fields = ["start_date", "end_date", "name"]

    def get_queryset(self):
        qs = Project.objects.all()
        company = self.get_company_from_request()
        if getattr(self.request.user, "is_superuser", False) or not company:
            return qs
        return qs.filter(company=company)


class TaskViewSet(CompanyScopedMixin, CompanyCreateMixin, viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [RoleBasedPermission]
    required_roles = ["PM", "Admin"]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "project__name"]
    ordering_fields = ["due_date", "priority"]

    def get_queryset(self):
        qs = Task.objects.select_related("project", "assigned_to").all()
        company = self.get_company_from_request()
        if getattr(self.request.user, "is_superuser", False) or not company:
            return qs
        return qs.filter(project__company=company)


class WorkerViewSet(CompanyScopedMixin, CompanyCreateMixin, viewsets.ModelViewSet):
    serializer_class = WorkerSerializer
    permission_classes = [RoleBasedPermission]

    def get_queryset(self):
        qs = Worker.objects.all()
        company = self.get_company_from_request()
        if getattr(self.request.user, "is_superuser", False) or not company:
            return qs
        return qs.filter(company=company)


class TimesheetViewSet(CompanyScopedMixin, CompanyCreateMixin, viewsets.ModelViewSet):
    serializer_class = TimesheetSerializer
    permission_classes = [RoleBasedPermission]
    required_roles = ["Worker", "PM", "Admin"]

    def get_queryset(self):
        qs = Timesheet.objects.select_related("worker", "task").all()
        company = self.get_company_from_request()
        if getattr(self.request.user, "is_superuser", False) or not company:
            return qs
        return qs.filter(worker__company=company)


class MaterialViewSet(CompanyScopedMixin, CompanyCreateMixin, viewsets.ModelViewSet):
    serializer_class = MaterialSerializer
    permission_classes = [RoleBasedPermission]
    required_roles = ["PM", "Admin"]

    def get_queryset(self):
        qs = Material.objects.all()
        company = self.get_company_from_request()
        if getattr(self.request.user, "is_superuser", False) or not company:
            return qs
        return qs.filter(company=company)


class PurchaseOrderViewSet(CompanyScopedMixin, CompanyCreateMixin, viewsets.ModelViewSet):
    serializer_class = PurchaseOrderSerializer
    permission_classes = [RoleBasedPermission]
    required_roles = ["PM", "Admin"]

    def get_queryset(self):
        qs = PurchaseOrder.objects.prefetch_related("lines").all()
        company = self.get_company_from_request()
        if getattr(self.request.user, "is_superuser", False) or not company:
            return qs
        return qs.filter(company=company)


class PurchaseOrderLineViewSet(CompanyScopedMixin, CompanyCreateMixin, viewsets.ModelViewSet):
    serializer_class = PurchaseOrderLineSerializer
    permission_classes = [RoleBasedPermission]

    def get_queryset(self):
        qs = PurchaseOrderLine.objects.select_related("material", "purchase_order").all()
        company = self.get_company_from_request()
        if getattr(self.request.user, "is_superuser", False) or not company:
            return qs
        return qs.filter(purchase_order__company=company)


class EquipmentViewSet(CompanyScopedMixin, CompanyCreateMixin, viewsets.ModelViewSet):
    serializer_class = EquipmentSerializer
    permission_classes = [RoleBasedPermission]

    def get_queryset(self):
        qs = Equipment.objects.all()
        company = self.get_company_from_request()
        if getattr(self.request.user, "is_superuser", False) or not company:
            return qs
        return qs.filter(company=company)


class MaintenanceRecordViewSet(CompanyScopedMixin, CompanyCreateMixin, viewsets.ModelViewSet):
    serializer_class = MaintenanceRecordSerializer
    permission_classes = [RoleBasedPermission]

    def get_queryset(self):
        qs = MaintenanceRecord.objects.select_related("equipment").all()
        company = self.get_company_from_request()
        if getattr(self.request.user, "is_superuser", False) or not company:
            return qs
        return qs.filter(equipment__company=company)


class InspectionViewSet(CompanyScopedMixin, CompanyCreateMixin, viewsets.ModelViewSet):
    serializer_class = InspectionSerializer
    permission_classes = [RoleBasedPermission]
    parser_classes = [MultiPartParser, FormParser]  # allow file uploads

    def get_queryset(self):
        qs = Inspection.objects.select_related("project", "inspector").all()
        company = self.get_company_from_request()
        if getattr(self.request.user, "is_superuser", False) or not company:
            return qs
        return qs.filter(project__company=company)


class InvoiceViewSet(CompanyScopedMixin, CompanyCreateMixin, viewsets.ModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = [RoleBasedPermission]

    def get_queryset(self):
        qs = Invoice.objects.all()
        company = self.get_company_from_request()
        if getattr(self.request.user, "is_superuser", False) or not company:
            return qs
        return qs.filter(company=company)


class DocumentViewSet(CompanyScopedMixin, CompanyCreateMixin, viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = [RoleBasedPermission]
    required_roles = ["Worker", "PM", "Admin"]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        qs = Document.objects.select_related("company", "uploaded_by").all()
        company = self.get_company_from_request()
        if getattr(self.request.user, "is_superuser", False) or not company:
            return qs
        return qs.filter(company=company)

    def perform_create(self, serializer):
        """
        When a file is uploaded to /documents/ set the company and uploaded_by based on request.user,
        and capture content_type and size from uploaded file if available.
        """
        user = getattr(self.request, "user", None)
        company = getattr(user, "company", None) if user is not None else None

        # Save initial instance with company and uploaded_by
        instance = serializer.save(company=company, uploaded_by=user)

        # If the uploaded file object is present, try to capture content_type and size reliably.
        uploaded_file = self.request.FILES.get("file")
        if uploaded_file:
            try:
                if hasattr(uploaded_file, "content_type") and uploaded_file.content_type:
                    instance.content_type = uploaded_file.content_type
                # size may already be set in Document.save() but ensure it's correct
                if hasattr(uploaded_file, "size"):
                    instance.size = uploaded_file.size
                instance.save()
            except Exception:
                # Best-effort: don't crash the request on metadata set failures
                pass


class ActivityLogViewSet(CompanyScopedMixin, CompanyCreateMixin, viewsets.ModelViewSet):
    serializer_class = ActivityLogSerializer
    permission_classes = [RoleBasedPermission]

    def get_queryset(self):
        qs = ActivityLog.objects.select_related("company", "user").all()
        company = self.get_company_from_request()
        if getattr(self.request.user, "is_superuser", False) or not company:
            return qs
        return qs.filter(company=company)


# -------------------------
# Cloudinary direct upload helper (optional)
# -------------------------
class CloudinaryUploadView(APIView):
    """
    Optional endpoint to upload a file to Cloudinary using the Cloudinary Python SDK.
    This is provided for convenience if you prefer server-side direct uploads to Cloudinary.

    Request: multipart/form-data with `file` and optional `folder` fields.
    Response: { "url": "<secure_url>", "public_id": "...", "raw": <cloudinary_response> }
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get("file")
        folder = request.data.get("folder", "construction_app")
        if not file_obj:
            return Response({"detail": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            import cloudinary.uploader
        except Exception:
            return Response({"detail": "cloudinary package not available"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            result = cloudinary.uploader.upload(file_obj, folder=folder, use_filename=True, unique_filename=False)
            return Response({"url": result.get("secure_url"), "public_id": result.get("public_id"), "raw": result}, status=status.HTTP_201_CREATED)
        except Exception as exc:
            return Response({"detail": "Upload failed", "error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
