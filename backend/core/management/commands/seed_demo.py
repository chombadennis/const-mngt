from django.core.management.base import BaseCommand
from django.apps import apps
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.utils import timezone
from django.db import IntegrityError
from django.db.models.fields import NOT_PROVIDED
import uuid

class Command(BaseCommand):
    help = "Seed demo data for local development. Use --flush to remove the demo data created by this command."

    def add_arguments(self, parser):
        parser.add_argument(
            "--flush",
            action="store_true",
            help="Delete demo data previously created by this command (matches demo usernames and demo company).",
        )

    def get_model(self, model_name):
        try:
            return apps.get_model("core", model_name)
        except LookupError:
            return None

    def create_user_if_missing(self, UserModel, username, email, password, first_name="", last_name="", company=None, is_staff=False):
        created = False
        try:
            user = UserModel.objects.get(username=username)
        except UserModel.DoesNotExist:
            # prefer create_user if available
            if hasattr(UserModel.objects, "create_user"):
                user = UserModel.objects.create_user(username=username, email=email, password=password, first_name=first_name, last_name=last_name)
            else:
                user = UserModel(username=username, email=email, first_name=first_name, last_name=last_name)
                user.set_password(password)
                user.save()
            created = True

        # attach company if user model supports it
        if company is not None and hasattr(user, "company"):
            try:
                user.company = company
                user.save()
            except Exception:
                # ignore if assignment not supported
                pass

        if is_staff and hasattr(user, "is_staff"):
            if not user.is_staff:
                user.is_staff = True
                user.save()

        return user, created

    def handle(self, *args, **options):
        flush = options.get("flush", False)
        UserModel = get_user_model()

        Company = self.get_model("Company")
        Project = self.get_model("Project")
        Document = self.get_model("Document")

        if flush:
            self.stdout.write("Flushing demo data...")
            # delete demo users
            demo_usernames = ["demo_manager", "demo_worker", "demo", "demo_test", "demo_refresh"]
            for u in demo_usernames:
                try:
                    qs = UserModel.objects.filter(username=u)
                    n = qs.count()
                    if n:
                        qs.delete()
                        self.stdout.write(f"Deleted {n} user(s) with username='{u}'")
                except Exception:
                    pass

            # delete demo company
            if Company:
                n = Company.objects.filter(name__icontains="Demo Company").delete()
                self.stdout.write(f"Deleted demo company objects (if any).")

            # delete demo documents (by filename pattern)
            if Document:
                try:
                    n = Document.objects.filter(file__icontains="demo-file").delete()
                    self.stdout.write("Deleted demo documents (if any).")
                except Exception:
                    pass

            self.stdout.write(self.style.SUCCESS("Flush complete."))
            return

        # ------- Create demo company -------
        company = None
        if Company:
            company, created = Company.objects.get_or_create(
                name="Demo Company",
                defaults={"address": "", "phone": ""},
            )
            self.stdout.write(f"Company: '{company}' (created={created})")
        else:
            self.stdout.write("Skipping Company creation — model not found (core.Company).")

        # ------- Create demo users -------
        manager, m_created = self.create_user_if_missing(
            UserModel,
            username="demo_manager",
            email="manager@example.com",
            password="safepwd123",
            first_name="Demo",
            last_name="Manager",
            company=company,
            is_staff=True,
        )
        self.stdout.write(f"Manager user: {manager.username} (created={m_created})")

        worker, w_created = self.create_user_if_missing(
            UserModel,
            username="demo_worker",
            email="worker@example.com",
            password="safepwd123",
            first_name="Demo",
            last_name="Worker",
            company=company,
        )
        self.stdout.write(f"Worker user: {worker.username} (created={w_created})")

        # ------- Create a demo project (best-effort) -------
        if Project:
            proj_defaults = {"name": "Demo Project",}
            try:
                if any(f.name == "company" for f in Project._meta.fields) and company is not None:
                    proj_defaults["company"] = company
            except Exception:
                pass

            try:
                project, created = Project.objects.get_or_create(name=proj_defaults.get("name"), defaults=proj_defaults)
                self.stdout.write(f"Project: '{getattr(project, 'name', project)}' (created={created})")
            except IntegrityError as e:
                try:
                    project = Project.objects.create()
                    setattr(project, "name", "Demo Project")
                    if company is not None and hasattr(project, "company"):
                        setattr(project, "company", company)
                    project.save()
                    self.stdout.write("Created fallback project instance.")
                except Exception as e2:
                    self.stdout.write(self.style.WARNING(f"Could not create Project: {e2}"))
                    project = None
        else:
            self.stdout.write("Skipping Project creation — model not found (core.Project).")
            project = None

        # ------- Create a demo document (always provide company & uploaded_by if required) -------
        if Document:
            try:
                file_field_name = None
                for f in Document._meta.fields:
                    ft = f.get_internal_type()
                    if ft in ("FileField", "ImageField") or "file" in f.name.lower() or "document" in f.name.lower():
                        file_field_name = f.name
                        break

                demo_contents = b"Demo file for seed_demo - replace with real file if needed.\n"
                fields = {}
                if company is not None and any(f.name == "company" for f in Document._meta.fields):
                    fields["company"] = company
                if manager and (hasattr(Document, "uploaded_by") or any(f.name == "uploaded_by" for f in Document._meta.fields)):
                    fields["uploaded_by"] = manager

                new_doc = Document.objects.create(**fields)
                if file_field_name:
                    getattr(new_doc, file_field_name).save("demo-file.txt", ContentFile(demo_contents), save=True)
                    new_doc.save()
                    self.stdout.write(f"Document created and file attached (id={getattr(new_doc, 'pk', None)}).")
                else:
                    self.stdout.write("No file field discovered on Document model — created a blank document instance if the model permits.")
            except Exception as e:
                self.stdout.write(self.style.WARNING(f"Could not create Document: {e}"))
        else:
            self.stdout.write("Skipping Document creation — model not found (core.Document).")

        self.stdout.write(self.style.SUCCESS("Seeding complete."))
