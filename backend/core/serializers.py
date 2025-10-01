from rest_framework import serializers
from django.contrib.auth import get_user_model
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

User = get_user_model()


# -------------------------
# Basic serializers
# -------------------------
class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ["id", "name", "description"]


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ["id", "name", "address", "phone", "created_at"]
        read_only_fields = ["id", "created_at"]


# -------------------------
# User & registration
# -------------------------
class UserSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)
    company_id = serializers.PrimaryKeyRelatedField(
        source="company", queryset=Company.objects.all(), write_only=True, required=False
    )
    roles = RoleSerializer(many=True, read_only=True)
    role_ids = serializers.PrimaryKeyRelatedField(
        source="roles", many=True, queryset=Role.objects.all(), write_only=True, required=False
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "company",
            "company_id",
            "roles",
            "role_ids",
            "is_active",
            "is_superuser",
        ]
        read_only_fields = ["id", "company", "roles"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.is_superuser:
            # Ensure "Admin" is included in roles output
            roles = data.get("roles", [])
            if not any(role.get("name") == "Admin" for role in roles):
                roles.append({"id": None, "name": "Admin", "description": "Superuser role"})
                data["roles"] = roles
        return data


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    company_id = serializers.PrimaryKeyRelatedField(queryset=Company.objects.all(), required=False, allow_null=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "first_name", "last_name", "company_id"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        company = validated_data.pop("company_id", None)
        user = User(**validated_data)
        if company:
            user.company = company
        user.set_password(password)
        user.save()
        return user


# -------------------------
# Worker, Project, Task, Timesheet
# -------------------------
class WorkerSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(source="user", queryset=User.objects.all(), write_only=True, required=False)

    class Meta:
        model = Worker
        fields = ["id", "company", "user", "user_id", "first_name", "last_name", "phone", "role", "trade", "created_at"]
        read_only_fields = ["id", "created_at", "company"]


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "company", "name", "code", "description", "start_date", "end_date", "status", "created_at"]
        read_only_fields = ["id", "created_at", "company"]


class TaskSerializer(serializers.ModelSerializer):
    assigned_to = serializers.PrimaryKeyRelatedField(queryset=Worker.objects.all(), allow_null=True, required=False)
    assigned_to_detail = WorkerSerializer(source="assigned_to", read_only=True)

    class Meta:
        model = Task
        fields = [
            "id",
            "project",
            "title",
            "description",
            "assigned_to",
            "assigned_to_detail",
            "start_date",
            "due_date",
            "priority",
            "status",
            "estimate_hours",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class TimesheetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Timesheet
        fields = ["id", "worker", "task", "date", "hours", "notes", "created_at"]
        read_only_fields = ["id", "created_at"]


# -------------------------
# Materials & Purchase Orders
# -------------------------
class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = ["id", "company", "sku", "name", "description", "unit", "created_at"]
        read_only_fields = ["id", "created_at", "company"]


class PurchaseOrderLineSerializer(serializers.ModelSerializer):
    line_total = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = PurchaseOrderLine
        fields = [
            "id",
            "purchase_order",
            "material",
            "description",
            "quantity",
            "unit_price",
            "line_total",
            "created_at",
        ]
        read_only_fields = ["id", "line_total", "created_at"]

    def get_line_total(self, obj):
        return (obj.quantity or 0) * (obj.unit_price or 0)


class PurchaseOrderSerializer(serializers.ModelSerializer):
    lines = PurchaseOrderLineSerializer(many=True, required=False)

    class Meta:
        model = PurchaseOrder
        fields = ["id", "company", "supplier", "order_date", "status", "total", "lines", "created_at"]
        read_only_fields = ["id", "total", "created_at", "company"]

    def create(self, validated_data):
        lines_data = validated_data.pop("lines", [])
        po = PurchaseOrder.objects.create(**validated_data)
        total = 0
        for line in lines_data:
            line["purchase_order"] = po
            pol = PurchaseOrderLine.objects.create(**line)
            total += (pol.quantity or 0) * (pol.unit_price or 0)
        po.total = total
        po.save()
        return po

    def update(self, instance, validated_data):
        lines_data = validated_data.pop("lines", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if lines_data is not None:
            # simple replace logic: delete existing and recreate
            instance.lines.all().delete()
            total = 0
            for line in lines_data:
                line["purchase_order"] = instance
                pol = PurchaseOrderLine.objects.create(**line)
                total += (pol.quantity or 0) * (pol.unit_price or 0)
            instance.total = total
            instance.save()
        return instance


# -------------------------
# Equipment, Maintenance, Inspection, Invoice, Document, ActivityLog
# -------------------------
class EquipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipment
        fields = ["id", "company", "name", "serial_number", "purchase_date", "last_service_date", "created_at"]
        read_only_fields = ["id", "created_at", "company"]


class MaintenanceRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaintenanceRecord
        fields = ["id", "equipment", "performed_by", "notes", "date", "created_at"]
        read_only_fields = ["id", "created_at"]


class InspectionSerializer(serializers.ModelSerializer):
    photo = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = Inspection
        fields = ["id", "project", "inspector", "notes", "photo", "date", "created_at"]
        read_only_fields = ["id", "created_at"]


class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = ["id", "company", "project", "number", "date", "due_date", "amount", "status", "created_at"]
        read_only_fields = ["id", "created_at", "company"]


class DocumentSerializer(serializers.ModelSerializer):
    file = serializers.FileField()

    class Meta:
        model = Document
        fields = ["id", "company", "uploaded_by", "file", "filename", "content_type", "size", "created_at"]
        # company and uploaded_by are set on the server in perform_create, so mark them read-only here.
        read_only_fields = ["id", "company", "uploaded_by", "filename", "content_type", "size", "created_at"]


class ActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityLog
        fields = ["id", "company", "user", "action", "detail", "created_at"]
        read_only_fields = ["id", "created_at", "company"]
