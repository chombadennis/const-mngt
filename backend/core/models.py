import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

# --- User & Role models -----------------------------------------------------
class Role(models.Model):
    """
    Simple role model. For more advanced permissioning, integrate django-guardian or django-rules.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=64, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Company(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=64, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class User(AbstractUser):
    """
    Custom user with UUID primary key and optional company affiliation.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, null=True, blank=True, on_delete=models.SET_NULL, related_name="users")
    roles = models.ManyToManyField(Role, blank=True, related_name="users")

    # keep username/email behavior from AbstractUser; consider switching to email-based auth later
    def is_admin(self):
        return self.is_superuser or self.roles.filter(name__iexact="admin").exists()

# --- Project/Task/Worker/Timesheet models -----------------------------------
class Project(models.Model):
    STATUS_CHOICES = [
        ("planning", "Planning"),
        ("active", "Active"),
        ("paused", "Paused"),
        ("completed", "Completed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="projects")
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=64, blank=True)
    description = models.TextField(blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default="planning")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.code})" if self.code else self.name


class Task(models.Model):
    PRIORITY_CHOICES = [("low", "Low"), ("medium", "Medium"), ("high", "High")]
    STATUS_CHOICES = [("todo", "To Do"), ("in_progress", "In Progress"), ("done", "Done")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="tasks")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    assigned_to = models.ForeignKey("Worker", null=True, blank=True, on_delete=models.SET_NULL, related_name="tasks")
    start_date = models.DateField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    priority = models.CharField(max_length=16, choices=PRIORITY_CHOICES, default="medium")
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default="todo")
    estimate_hours = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.project.name}"


class Worker(models.Model):
    """
    Worker profile representing a craftsperson / field worker.
    May link to a User account for app access.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="workers")
    user = models.OneToOneField("User", null=True, blank=True, on_delete=models.SET_NULL, related_name="worker_profile")
    first_name = models.CharField(max_length=128)
    last_name = models.CharField(max_length=128)
    phone = models.CharField(max_length=64, blank=True)
    role = models.CharField(max_length=128, blank=True)
    trade = models.CharField(max_length=128, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class Timesheet(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    worker = models.ForeignKey(Worker, on_delete=models.CASCADE, related_name="timesheets")
    task = models.ForeignKey(Task, null=True, blank=True, on_delete=models.SET_NULL, related_name="timesheets")
    date = models.DateField(default=timezone.now)
    hours = models.DecimalField(max_digits=5, decimal_places=2)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return f"{self.worker} - {self.date} ({self.hours}h)"

# --- Materials & Purchase Orders -------------------------------------------
class Material(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="materials")
    sku = models.CharField(max_length=128, blank=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    unit = models.CharField(max_length=32, default="unit")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class PurchaseOrder(models.Model):
    STATUS_CHOICES = [("draft", "Draft"), ("ordered", "Ordered"), ("received", "Received"), ("cancelled", "Cancelled")]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="purchase_orders")
    supplier = models.CharField(max_length=255)
    order_date = models.DateField(default=timezone.now)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default="draft")
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"PO-{self.id}"


class PurchaseOrderLine(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name="lines")
    material = models.ForeignKey(Material, null=True, blank=True, on_delete=models.SET_NULL)
    description = models.CharField(max_length=512, blank=True)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def line_total(self):
        return (self.quantity or 0) * (self.unit_price or 0)

# --- Equipment & Maintenance ------------------------------------------------
class Equipment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="equipment")
    name = models.CharField(max_length=255)
    serial_number = models.CharField(max_length=255, blank=True)
    purchase_date = models.DateField(null=True, blank=True)
    last_service_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class MaintenanceRecord(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    equipment = models.ForeignKey(Equipment, on_delete=models.CASCADE, related_name="maintenance_records")
    performed_by = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
    date = models.DateField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Maintenance {self.equipment} @ {self.date}"


# --- Inspections, Invoices, Documents, ActivityLog --------------------------
class Inspection(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="inspections")
    inspector = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    notes = models.TextField(blank=True)
    photo = models.FileField(upload_to="inspections/", null=True, blank=True)
    date = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)


class Invoice(models.Model):
    STATUS_CHOICES = [("draft", "Draft"), ("issued", "Issued"), ("paid", "Paid"), ("overdue", "Overdue")]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="invoices")
    project = models.ForeignKey(Project, null=True, blank=True, on_delete=models.SET_NULL)
    number = models.CharField(max_length=128, blank=True)
    date = models.DateField(default=timezone.now)
    due_date = models.DateField(null=True, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default="draft")
    created_at = models.DateTimeField(auto_now_add=True)


class Document(models.Model):
    """
    Stores metadata for documents; actual file stored using configured DEFAULT_FILE_STORAGE.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="documents")
    uploaded_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    file = models.FileField(upload_to="documents/")
    filename = models.CharField(max_length=512, blank=True)
    content_type = models.CharField(max_length=128, blank=True)
    size = models.BigIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.file:
            self.filename = getattr(self.file, "name", "")[:512]
            try:
                self.size = self.file.size
            except Exception:
                pass
        super().save(*args, **kwargs)


class ActivityLog(models.Model):
    """
    Simple Activity log for audit trail.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="activity_logs")
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=255)
    detail = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
