# Construction Management Application: Technical Blueprint

## 1. High-Level Overview

This document provides a detailed technical blueprint of the Construction Management Application. The application is a multi-tenant, web-based platform designed to help construction companies manage their projects, resources, and finances.

It is architected as a modern web application with a distinct frontend and backend:

-   **Backend:** A robust API built with Django and Django REST Framework, responsible for all business logic, data storage, and authentication.
-   **Frontend:** A dynamic and responsive user interface built with Next.js and TypeScript, designed for an optimal user experience.

The core tenancy model is centered around the **`Company`**. Each `Company` is an isolated silo containing its own users, projects, equipment, documents, and all other related data.

---

## 2. Technology Stack

| Area      | Technology                                                                                                | Purpose                                                              |
| :-------- | :-------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------- |
| **Backend** | [Python](https://www.python.org/)                                                                         | Core programming language                                            |
|           | [Django](https://www.djangoproject.com/)                                                                 | High-level web framework for rapid development                       |
|           | [Django REST Framework](https://www.django-rest-framework.org/)                                           | Toolkit for building RESTful APIs                                    |
|           | [djangorestframework-simplejwt](https://django-rest-framework-simplejwt.readthedocs.io/)                  | JSON Web Token (JWT) authentication                                  |
|           | [PostgreSQL](https.postgresql.org/)                                                                       | Primary relational database                                          |
| **Frontend**| [Next.js](https://nextjs.org/)                                                                            | React framework for server-side rendering and static site generation |
|           | [React](https://react.dev/)                                                                               | Core library for building user interfaces                            |
|           | [TypeScript](https://www.typescriptlang.org/)                                                             | Superset of JavaScript that adds static typing                     |
|           | [TanStack Query (React Query)](https://tanstack.com/query/latest)                                         | Data fetching, caching, and server-state management                  |
|           | [Tailwind CSS](https://tailwindcss.com/)                                                                  | Utility-first CSS framework for styling                              |
| **DevOps**  | [Docker](https://www.docker.com/)                                                                         | Containerization for consistent development and deployment           |

---

## 3. Project Structure

The codebase is organized into two main directories: `backend` and `frontend`.

### 3.1. Backend (`backend/`)

```
backend/
├── config/             # Django project configuration
│   ├── settings/       # Environment-specific settings (dev, prod)
│   ├── urls.py         # Root URL configuration
│   └── wsgi.py         # WSGI entrypoint for web servers
├── core/               # The primary Django app containing all business logic
│   ├── migrations/     # Database migration files
│   ├── management/     # Custom Django management commands (e.g., seed_demo)
│   ├── models.py       # Defines the database schema (see Section 4.1)
│   ├── serializers.py  # Defines API data representations
│   ├── views.py        # Contains the API ViewSets (controller logic)
│   ├── urls.py         # API endpoint routing for the 'core' app
│   └── permissions.py  # Custom permission classes for the API
├── manage.py           # Django's command-line utility
└── requirements.txt    # Python package dependencies
```

### 3.2. Frontend (`frontend/`)

```
frontend/
├── app/                      # Next.js 13+ App Router
│   ├── (auth)/login/page.tsx # Login page route
│   ├── (main)/dashboard/     # Protected dashboard route group
│   └── layout.tsx            # Root application layout (see Section 5.1)
├── components/               # Reusable React components (buttons, forms, etc.)
├── context/
│   └── AuthContext.tsx       # Core authentication state management (see Section 5.2)
├── lib/
│   ├── api.ts                # Centralized functions for calling the backend API
│   └── react-query.tsx       # Configuration for React Query
├── public/                   # Static assets (images, fonts)
├── next.config.js            # Next.js configuration, including API proxy
└── package.json              # Node.js package dependencies
```

---

## 4. Backend Architecture Deep Dive

### 4.1. Database Models (`core/models.py`)

The database schema is the foundation of the application. All models use a `UUIDField` as the primary key for security and scalability.

| Model                   | Purpose                                                                    | Key Relationships                                                       |
| :---------------------- | :------------------------------------------------------------------------- | :---------------------------------------------------------------------- |
| **`Company`**           | **Top-level tenant.** Owns all other data.                                 | One-to-Many with almost all other models.                               |
| **`User`**              | Extends Django's `AbstractUser`. Represents a login account.              | `ForeignKey` to `Company`, `ManyToManyField` to `Role`.                 |
| **`Role`**              | Defines user roles (e.g., "Admin", "Project Manager").                     | Many-to-Many with `User`.                                               |
| **`Project`**           | The central object for a construction project.                             | `ForeignKey` to `Company`. One-to-Many with `Task`, `Inspection`, etc.  |
| **`Task`**              | A specific task within a project.                                          | `ForeignKey` to `Project`. Can be assigned to a `Worker`.               |
| **`Worker`**            | A field worker profile.                                                    | `ForeignKey` to `Company`. `OneToOne` with `User` (optional).           |
| **`Timesheet`**         | Tracks hours worked by a `Worker` on a `Task`.                             | `ForeignKey` to `Worker` and `Task`.                                    |
| **`Material`**          | A catalog of construction materials available to a company.                | `ForeignKey` to `Company`.                                              |
| **`PurchaseOrder`**     | Represents an order for materials from a supplier.                         | `ForeignKey` to `Company`. One-to-Many with `PurchaseOrderLine`.        |
| **`PurchaseOrderLine`** | A line item within a `PurchaseOrder`.                                      | `ForeignKey` to `PurchaseOrder` and `Material`.                         |
| **`Equipment`**         | Tracks a company's physical assets (vehicles, tools).                       | `ForeignKey` to `Company`. One-to-Many with `MaintenanceRecord`.        |
| **`MaintenanceRecord`** | A log of service performed on a piece of `Equipment`.                      | `ForeignKey` to `Equipment`.                                            |
| **`Inspection`**        | Records a quality or safety inspection for a `Project`.                    | `ForeignKey` to `Project` and `User` (inspector).                       |
| **`Invoice`**           | Represents an invoice issued for a `Project`.                              | `ForeignKey` to `Company` and `Project`.                                |
| **`Document`**          | Stores metadata and a file link for uploaded documents.                    | `ForeignKey` to `Company` and `User` (uploader).                        |
| **`ActivityLog`**       | A simple audit trail that records actions performed by users.              | `ForeignKey` to `Company` and `User`.                                   |

### 4.2. API Endpoints & Views (`core/urls.py`, `core/views.py`)

The API is built using Django REST Framework's `ViewSets` and `Routers`, which automatically generate standard CRUD (Create, Read, Update, Delete) endpoints for each model.

-   **Router-Generated Endpoints**: The `DefaultRouter` creates endpoints like:
    -   `GET /api/projects/`: List all projects.
    -   `POST /api/projects/`: Create a new project.
    -   `GET /api/projects/{id}/`: Retrieve a single project.
    -   `PUT /api/projects/{id}/`: Update a project.
    -   `DELETE /api/projects/{id}/`: Delete a project.
    -   *(This pattern applies to all models registered in `core/urls.py`)*

-   **Custom Authentication Endpoints**:
    -   `POST /api/auth/token/`: **Login.** Takes `username` and `password`, returns `access` and `refresh` JWTs.
    -   `POST /api/auth/token/refresh/`: Takes a `refresh` token, returns a new `access` token.
    -   `POST /api/auth/register/`: **Register.** Creates a new `User`.
    -   `GET /api/auth/me/`: Retrieves the profile of the currently authenticated user.

### 4.3. Permissions & Roles

The application uses a two-layered permission system.

1.  **Simple Role Model (`core.Role`)**: A high-level role assignment (e.g., "Admin", "Worker"). The frontend uses this for broad UI-level access control. A user's administrative status is determined by the `is_admin()` method on the `User` model, which checks for superuser status or membership in a role named "admin".

2.  **Django's Built-in Permissions**: Under the hood, Django automatically creates `add`, `change`, `delete`, and `view` permissions for every model. This system can be used for more granular, backend-enforced permissions if required.

    | Model               | Available Permissions                                    |
    | :------------------ | :------------------------------------------------------- |
    | `Project`           | `add_project`, `change_project`, `delete_project`, `view_project` |
    | `Task`              | `add_task`, `change_task`, `delete_task`, `view_task`       |
    | `Equipment`         | `add_equipment`, `change_equipment`, `delete_equipment`, `view_equipment` |
    | `Invoice`           | `add_invoice`, `change_invoice`, `delete_invoice`, `view_invoice` |
    | *(...and so on for all models)* |

---

## 5. Frontend Architecture Deep Dive

### 5.1. Core Providers (`app/layout.tsx`)

The root layout is the entry point for the frontend and sets up two critical context providers that wrap the entire application:

1.  **`ReactQueryProvider`**: Initializes TanStack Query, making its powerful data-fetching and caching capabilities available to all components. This is the foundation for managing all server state.
2.  **`AuthProvider`**: Initializes the `AuthContext`, making user session information (login status, user data, roles) available to all components. This is the foundation for managing all authentication state.

### 5.2. Authentication (`context/AuthContext.tsx`)

This is the most important file for frontend session management. It orchestrates the entire user authentication lifecycle.

-   **State:** It holds the `user` object, `token` (access token), and `refreshToken`.
-   **Persistence:** It uses `localStorage` to persist the tokens and user data across browser refreshes. On initial load, a `useEffect` hook reads this data back into the React state.
-   **`login(jwt, userData)` function:**
    1.  Called after a successful API login.
    2.  Sets the user, token, and refresh token in the React state.
    3.  Writes the `accessToken`, `refreshToken`, and `user` data to `localStorage`.
    4.  Redirects the user to the `/dashboard`.
-   **`logout()` function:**
    1.  Clears the state variables.
    2.  Removes the items from `localStorage`.
    3.  Redirects the user to the `/auth/login` page.
-   **Proactive Token Refresh:** A `useEffect` hook continuously monitors the `accessToken`. It decodes the token's expiration timestamp (`exp`) and sets a `setTimeout` to call the `refreshAccessToken` API function 30 seconds *before* it expires. This ensures a seamless user experience by preventing abrupt logouts.
-   **Role-Based Access Control (RBAC):**
    -   It exposes a `hasRole(role: string)` function that checks if the user is a superuser or if their roles array contains the specified role.
    -   It also exports convenient custom hooks like `useIsAdmin()`, `useIsPM()`, and `useIsWorker()` which components can use to conditionally render UI elements.

### 5.3. API Proxy (`next.config.js`)

To avoid Cross-Origin Resource Sharing (CORS) errors during development, the `next.config.js` file uses a `rewrite` to act as a proxy. Any request made from the frontend to its own `/api/...` path is automatically forwarded to the backend server running on `http://127.0.0.1:8000/api/...`. This is transparent to the developer and simplifies API calls.

---

## 6. End-to-End Workflow: User Login

This workflow illustrates how all the pieces work together.

1.  **User Interaction:** The user navigates to `/auth/login`, fills in their username and password in the form provided by `frontend/app/(auth)/login/page.tsx`, and clicks "Login".
2.  **Frontend API Call:** An `onSubmit` handler calls a login function (e.g., from `lib/api.ts`). This function makes a `POST` request to `/api/auth/token/` with the user's credentials in the request body.
3.  **Next.js Proxy:** The Next.js development server intercepts the request. The `next.config.js` rewrite rule matches `/api/...` and proxies the request to the Django backend at `http://127.0.0.1:8000/api/auth/token/`.
4.  **Backend Authentication:** Django's `TokenObtainPairView` receives the request. It validates the username and password against the `core_user` table in the database.
5.  **Backend Response:** On success, the backend generates a short-lived `access` token and a long-lived `refresh` token. It sends these back in a JSON response: `{ "access": "...", "refresh": "..." }`.
6.  **Frontend State Update:** The frontend API function receives the tokens. It then makes a second request to `/api/auth/me/` (using the new access token) to get the user's profile data.
7.  **Context Update:** The `login` function from `AuthContext` is called with the tokens and user data. The context saves this information to `localStorage` and its internal React state.
8.  **Redirection:** The `login` function completes by calling `router.push("/dashboard")`.
9.  **Authenticated State:** The application is now in an authenticated state. The `useAuth()` hook returns `isAuthenticated: true`. Any component can access the user's data. Any subsequent API call made via `lib/api.ts` will automatically have the `Authorization: Bearer <access_token>` header attached, allowing it to access protected backend resources.
