from django.contrib import admin
from .models import (
    User, Company, Role, Project, Task, Worker, Timesheet,
    Material, PurchaseOrder, PurchaseOrderLine, Equipment,
    MaintenanceRecord, Inspection, Invoice, Document, ActivityLog
)
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = ('username', 'email', 'company', 'is_active', 'is_staff')
    search_fields = ('username', 'email')
    list_filter = ('is_staff', 'is_superuser', 'company')

@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'created_at')
    search_fields = ('name',)

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('name',)

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'company', 'status', 'start_date', 'end_date')
    search_fields = ('name', 'code')
    list_filter = ('status', 'company')

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'project', 'assigned_to', 'status', 'priority')
    search_fields = ('title',)
    list_filter = ('status', 'priority')

@admin.register(Worker)
class WorkerAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'company', 'role', 'phone')
    search_fields = ('first_name', 'last_name', 'phone')

@admin.register(Timesheet)
class TimesheetAdmin(admin.ModelAdmin):
    list_display = ('worker', 'task', 'date', 'hours')
    list_filter = ('date',)
    search_fields = ('worker__first_name', 'worker__last_name')

@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'company')
    search_fields = ('name', 'sku')
    list_filter = ('company',)

class PurchaseOrderLineInline(admin.TabularInline):
    model = PurchaseOrderLine
    extra = 0

@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'supplier', 'status', 'order_date', 'total')
    inlines = [PurchaseOrderLineInline]
    list_filter = ('status',)
    search_fields = ('supplier',)

@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'company', 'serial_number', 'last_service_date')

@admin.register(MaintenanceRecord)
class MaintenanceRecordAdmin(admin.ModelAdmin):
    list_display = ('equipment', 'performed_by', 'date')

@admin.register(Inspection)
class InspectionAdmin(admin.ModelAdmin):
    list_display = ('project', 'inspector', 'date')

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('number', 'company', 'project', 'amount', 'status', 'date')
    list_filter = ('status',)

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('filename', 'company', 'uploaded_by', 'created_at')
    search_fields = ('filename',)

@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('action', 'company', 'user', 'created_at')
    list_filter = ('company',)
