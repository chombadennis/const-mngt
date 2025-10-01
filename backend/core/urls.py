from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MeView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    UserViewSet,
    RoleViewSet,
    CompanyViewSet,
    ProjectViewSet,
    TaskViewSet,
    WorkerViewSet,
    TimesheetViewSet,
    MaterialViewSet,
    PurchaseOrderViewSet,
    PurchaseOrderLineViewSet,
    EquipmentViewSet,
    MaintenanceRecordViewSet,
    InspectionViewSet,
    InvoiceViewSet,
    DocumentViewSet,
    ActivityLogViewSet,
    RegisterView,
    CloudinaryUploadView,
)

router = DefaultRouter()
router.register("users", UserViewSet, basename="user")
router.register("roles", RoleViewSet, basename="role")
router.register("companies", CompanyViewSet, basename="company")
router.register("projects", ProjectViewSet, basename="project")
router.register("tasks", TaskViewSet, basename="task")
router.register("workers", WorkerViewSet, basename="worker")
router.register("timesheets", TimesheetViewSet, basename="timesheet")
router.register("materials", MaterialViewSet, basename="material")
router.register("purchase-orders", PurchaseOrderViewSet, basename="purchaseorder")
router.register("purchase-order-lines", PurchaseOrderLineViewSet, basename="poline")
router.register("equipment", EquipmentViewSet, basename="equipment")
router.register("maintenance-records", MaintenanceRecordViewSet, basename="maintenance")
router.register("inspections", InspectionViewSet, basename="inspection")
router.register("invoices", InvoiceViewSet, basename="invoice")
router.register("documents", DocumentViewSet, basename="document")
router.register("activity-logs", ActivityLogViewSet, basename="activitylog")

urlpatterns = [
    path("", include(router.urls)),
    # JWT token endpoints
    path("auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # Registration
    path("auth/register/", RegisterView.as_view(), name="auth_register"),
    path("auth/me/", MeView.as_view(), name="auth_me"),
    # optional server-side Cloudinary upload
    path("uploads/cloudinary/", CloudinaryUploadView.as_view(), name="cloudinary_upload"),
]
