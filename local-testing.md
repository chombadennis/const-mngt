# Construction Management App – Local Dry-Run & Docker Testing

This guide walks you through **phase D**: testing your production Docker setup locally, inspecting the database, and verifying everything works before real deployment. Follow **exactly in order**.

---

## Full Step-by-Step Instructions (1–10)

### 1. Sync Code from Windows → WSL Projects Folder

Dry-run (no changes, just see what would be copied):

```bash
rsync -avhn /mnt/c/Users/DENNIS/construction-management-app/ ~/projects/construction-management-app
```

Actual sync (after dry-run looks OK):

```bash
rsync -avh /mnt/c/Users/DENNIS/construction-management-app/ ~/projects/construction-management-app
```

Verify in WSL:

```bash
cd ~/projects/construction-management-app
ls -l
# or
tree -L 3
```

### 2. Prepare `.env.prod` for Local Production Dry-Run

Create `.env.prod` (do **not** commit to Git) with minimum required variables:

```text
DJANGO_SETTINGS_MODULE=config.settings.prod
SECRET_KEY=<strong-random-secret>
DEBUG=False
ALLOWED_HOSTS=localhost

DATABASE_URL=postgresql://neondb_owner:password@ep-shiny-thunder-xxxx-pooler.region.aws.neon.tech/cm_db_prod?sslmode=require&channel_binding=require

STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=<cloud_name>
CLOUDINARY_API_KEY=<api_key>
CLOUDINARY_API_SECRET=<api_secret>

SIMPLE_JWT_SECRET=<another-random-secret>
CORS_ALLOWED_ORIGINS=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000/api
REDIS_URL=redis://redis:6379/0
```

> **Tip:** Ensure DATABASE_URL includes `sslmode=require` and copy Neon credentials exactly.

### 3. Validate Neon DATABASE_URL

Make sure it contains sslmode, correct Neon user, password, host, and database.

### 4. Local Production Dry-Run – Build Docker Images

```bash
cd ~/projects/construction-management-app
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

> This starts backend, frontend, and Redis. Backend will attempt to connect to Neon DB.
> Rebuild after code changes:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 5. Inspect DB, Run Migrations, Collect Static, Create Superuser

**1. Inspect Neon DB using Django dbshell**

```bash
docker compose -f docker-compose.prod.yml run --rm backend python manage.py dbshell
```

Inside psql shell:

```sql
-- Check tables
\dt

-- Exit
\q
```

**2. Run Migrations**

```bash
docker compose -f docker-compose.prod.yml run --rm backend python manage.py migrate
```

**3. Collect Static Files**

```bash
docker compose -f docker-compose.prod.yml run --rm backend python manage.py collectstatic --noinput
```

**4. Create Superuser (interactive)**

```bash
docker compose -f docker-compose.prod.yml run --rm backend python manage.py createsuperuser
```

> For CI or non-interactive setup: use environment variables or `--noinput` and set password via manage.py shell.

### 6. Tail Logs & Health Check

Watch backend logs:

```bash
docker compose -f docker-compose.prod.yml logs -f backend
```

Test API endpoint:

```bash
curl -v http://localhost:8000/api/
```

Open frontend in browser:

```
http://localhost:3000
```

Verify login, API calls, file uploads, etc.

### 7. Stop / Remove Containers

Stop (keep volumes):

```bash
docker compose -f docker-compose.prod.yml stop
```

Remove containers & network (keep volumes):

```bash
docker compose -f docker-compose.prod.yml down
```

Remove containers + volumes:

```bash
docker compose -f docker-compose.prod.yml down --volumes
```

### 8. DB Schema & Storage Logic Notes

* **DB Schema:** Managed by Postgres/Neon. Django migrations create tables in public schema by default.
* **R2 / Cloudinary logic:** Controlled via `STORAGE_PROVIDER` in `config/settings/base.py`.

  * `STORAGE_PROVIDER=cloudinary` → uses Cloudinary SDK (`cloudinary.uploader.upload(...)`)
  * `STORAGE_PROVIDER=r2` → uses S3-compatible R2 backend
* Ensure SDKs are installed and secrets are set.

### 9. Final Checklist Before Deployment

* `.env.prod` has correct `DEBUG`, `ALLOWED_HOSTS`, `SECRET_KEY`, `SIMPLE_JWT_SECRET`.
* `DATABASE_URL` copied exactly from Neon.
* `STORAGE_PROVIDER` and Cloudinary keys valid.
* `NEXT_PUBLIC_API_URL` points to correct backend URL.
* Migrate and collectstatic run successfully.
* Verify uploads go to Cloudinary (or chosen provider).
* Secrets are never committed to Git.
* Know how to restart containers and view logs.

### 10. Optional: Deploy to Render

* Push repo to GitHub.
* Create Render Web Service → Docker → select branch.
* Set environment variables (production `.env.prod` values).
* Deploy → run:

```bash
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

* Create frontend Render service → Docker or static → `NEXT_PUBLIC_API_URL` pointing to backend.
* Add domain → Render provisions TLS automatically.

**End of Local Dry-Run Testing Guide**
