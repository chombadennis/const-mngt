# Construction Management App – Local Dry-Run & Docker Testing

This guide consolidates **all steps, commands, and configuration notes** for local development and dry-run testing of the Construction Management App in a single Markdown file.

---

## Step-by-Step Instructions

### 1. Sync Code from Windows → WSL Projects Folder

Dry-run (preview what will be copied):

```bash
rsync -avhn /mnt/c/Users/DENNIS/construction-management-app/ ~/projects/construction-management-app
```

Actual sync (apply changes):

```bash
rsync -avh /mnt/c/Users/DENNIS/construction-management-app/ ~/projects/construction-management-app
```

Verify:

```bash
cd ~/projects/construction-management-app
ls -l
tree -L 3
```

---

### 2. Prepare `.env.prod` for Local Production

Create `.env.prod` in the project root (never commit secrets to Git):

```text
DJANGO_SETTINGS_MODULE=config.settings.prod
SECRET_KEY=<strong-random-secret>
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,backend
SECURE_SSL_REDIRECT=False

DATABASE_URL=postgresql://neondb_owner:password@ep-shiny-thunder-xxxx-pooler.region.aws.neon.tech/cm_db_prod?sslmode=require&channel_binding=require

STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=<cloud_name>
CLOUDINARY_API_KEY=<api_key>
CLOUDINARY_API_SECRET=<api_secret>

SIMPLE_JWT_SECRET=<another-random-secret>
CORS_ALLOWED_ORIGINS=http://localhost:3000
NEXT_PUBLIC_API_URL=http://backend:8000/api
REDIS_URL=redis://redis:6379/0

NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=<upload-preset>
NEXT_PUBLIC_SENTRY_DSN=
```

> Ensure `DATABASE_URL` has `sslmode=require` and correct Neon credentials.

---

### 3. Validate Neon DATABASE_URL

Check it contains `sslmode=require` and the correct username, password, host, and database.

---

### 4. Build and Start Docker Images

Stop any running containers first:

```bash
docker compose -f docker-compose.prod.yml stop
```

Build backend container:

```bash
docker compose -f docker-compose.prod.yml build backend
```

Start all containers:

```bash
docker compose -f docker-compose.prod.yml up -d
```

Rebuild after code or `.env.prod` changes:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

---

### 5. Inspect DB, Run Migrations, Collect Static, Create Superuser

**Inspect Neon DB using Django dbshell:**

```bash
docker compose -f docker-compose.prod.yml run --rm backend python manage.py dbshell
```

Inside psql shell:

```sql
\dt
\q
```

**Run migrations:**

```bash
docker compose -f docker-compose.prod.yml run --rm backend python manage.py migrate
```

**Collect static files:**

```bash
docker compose -f docker-compose.prod.yml run --rm backend python manage.py collectstatic --noinput
```

**Create superuser:**

```bash
docker compose -f docker-compose.prod.yml run --rm backend python manage.py createsuperuser
```

> For CI/non-interactive: use `--noinput` and environment variables.

---

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

Verify login, API calls, and uploads.

---

### 7. Stop / Remove Containers

Stop containers (keep volumes):

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

---

### 8. DB Schema & Storage Logic Notes

* DB Schema managed by Neon/Postgres. Migrations create tables in `public` schema.
* `STORAGE_PROVIDER` in `config/settings/base.py` determines storage:

  * `cloudinary` → Cloudinary SDK
  * `r2` → S3-compatible R2
* Ensure SDKs installed and secrets set.

---

### 9. Final Checklist Before Deployment

* `.env.prod` correct: `DEBUG`, `ALLOWED_HOSTS`, `SECRET_KEY`, `SIMPLE_JWT_SECRET`.
* Correct `DATABASE_URL` from Neon.
* Valid `STORAGE_PROVIDER` and Cloudinary keys.
* `NEXT_PUBLIC_API_URL` points to backend.
* Migrations and collectstatic successful.
* Verify uploads.
* Secrets never committed.
* Know container restart and log commands.

---

### 10. Optional: Deploy to Render / Cloud Provider

* Push repo to GitHub.
* Create Render Web Service → Docker → select branch.
* Set environment variables from `.env.prod`.
* Deploy → run:

```bash
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

* Create frontend service → Docker/static → `NEXT_PUBLIC_API_URL` backend URL.
* Add domain → TLS provisioned automatically.

---

### 11. Git Setup & `.gitignore`

Initialize repo:

```bash
git init
git branch -m main
```

Create `.gitignore` (root project):

```text
# Node / Next.js
/node_modules
/.next/
/out/
/build
.pnp*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/versions

# Env files
.env*

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# Python / Django
*.pyc
__pycache__/
*.pyo
*.pyd
db.sqlite3
/staticfiles/
media/

# Docker
*.pid
docker-compose.override.yml

# IDE / VSCode
.vscode/
.idea/
```

> Ensures node_modules, .next, logs, env secrets, and temporary files are ignored.

---

**End of README – full local dry-run, Docker testing, and commit guide.**
