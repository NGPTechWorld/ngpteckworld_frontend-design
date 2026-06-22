# NGP TechWorld — Marketing Website

> **شركة برمجيات وحلول تقنية** — موقع تسويقي ثنائي اللغة (عربي / إنجليزي) يعرض خدمات الشركة ومعرض أعمالها مع لوحة إدارة كاملة.

A bilingual (Arabic / English) marketing website for NGP TechWorld, a software & tech-solutions studio. The stack is a **React SPA** (Vite) for the frontend, a **Laravel 12 REST API** for the backend, and a **Filament 3 admin panel** for content management.

---

## Table of contents

1. [Prerequisites](#prerequisites)
2. [Backend setup](#backend-setup)
3. [Frontend setup](#frontend-setup)
4. [Admin panel](#admin-panel)
5. [Enabling contact email](#enabling-contact-email)
6. [Placeholder links & images](#placeholder-links--images)
7. [Production deployment](#production-deployment)
8. [Project structure](#project-structure)

---

## Prerequisites

| Tool | Minimum version |
|------|----------------|
| PHP | 8.2 |
| Composer | 2.x |
| Node.js | 18.x |
| MySQL / MariaDB | 8.0 / 10.5 (XAMPP works fine) |

---

## Backend setup

### 1. Create the database

Open your MySQL client (phpMyAdmin, XAMPP shell, or MySQL CLI) and run:

```sql
CREATE DATABASE ngp_techworld CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Install dependencies and configure the environment

```bash
cd backend
composer install
cp .env.example .env
```

Open `backend/.env` and confirm (or adjust) the database credentials:

```dotenv
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ngp_techworld
DB_USERNAME=root
DB_PASSWORD=
```

### 3. Generate the app key, migrate, and seed

```bash
php artisan key:generate
php artisan migrate:fresh --seed
php artisan storage:link
```

The seeder creates 7 services and 6 portfolio projects, plus the default admin account.

### 4. Start the development server

```bash
php artisan serve
```

The API is now available at **http://127.0.0.1:8000**.

---

## Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The React SPA starts at **http://localhost:5173**. In development mode Vite proxies all `/api` requests to `http://127.0.0.1:8000`, so both servers must be running at the same time.

---

## Admin panel

| URL | `http://127.0.0.1:8000/admin` |
|-----|-------------------------------|
| Email | `admin@ngptechworld.com` |
| Password | `password` |

The Filament admin lets you manage Services, Projects (with gallery images, team members, and links), and view Contact submissions.

---

## Enabling contact email

By default the contact form saves submissions to the database only. To also send an email notification, edit `backend/.env`:

```dotenv
CONTACT_MAIL_ENABLED=true

MAIL_MAILER=smtp
MAIL_HOST=smtp.your-provider.com
MAIL_PORT=587
MAIL_USERNAME=your@email.com
MAIL_PASSWORD=your-password
MAIL_FROM_ADDRESS="no-reply@ngptechworld.com"
MAIL_FROM_NAME="NGP TechWorld"

CONTACT_NOTIFY_EMAIL=info@ngptechworld.com
```

Replace the `MAIL_*` values with your SMTP provider credentials (Mailgun, Postmark, SendGrid, etc.). `CONTACT_NOTIFY_EMAIL` is the address that receives the notification.

---

## Placeholder links & images

After the first run, a few things need real content:

- **Social media links** — The footer and Contact page display company social links. Edit them through the admin panel or update `companySocials` in `frontend/src/i18n/ui.js`. All URLs default to `#`.
- **Project links** — Each project card has a website/GitHub/Instagram link. Go to the admin panel → Projects → edit a project → Links tab and paste the real URLs.
- **Project images** — Upload a cover image and gallery photos for each project in the admin panel → Projects → edit a project → Images tab.
- **Team member photos** — Upload avatars in the admin panel → Projects → edit a project → Team tab.

---

## Production deployment

### Frontend

```bash
cd frontend
npm run build
```

The compiled output lands in `frontend/dist/`. Serve that folder on any static host (Netlify, Vercel, Nginx, Apache, etc.).

Point the frontend at the deployed API by setting the environment variable before building:

```dotenv
# frontend/.env (production)
VITE_API_BASE_URL=https://api.yourdomain.com
```

### Backend

Deploy the Laravel app to a PHP host (shared hosting, VPS, Laravel Forge, etc.) and:

1. Set `APP_ENV=production` and `APP_DEBUG=false`.
2. Set `FRONTEND_URL` to the deployed frontend origin so CORS is allowed:

   ```dotenv
   FRONTEND_URL=https://www.yourdomain.com
   ```

3. Run `php artisan migrate --force` and `php artisan storage:link` on the server.
4. Configure a real mail driver for contact-form notifications.

---

## Project structure

```
frontend-design/
├── backend/                    Laravel 12 API + Filament admin
│   ├── app/
│   │   ├── Filament/
│   │   │   └── Resources/      Admin resources (Service, Project, Contact)
│   │   ├── Http/
│   │   │   ├── Controllers/    API controllers (Services, Projects, Contact)
│   │   │   ├── Requests/       Form-request validation
│   │   │   └── Resources/      JSON API resources
│   │   ├── Mail/
│   │   │   └── ContactReceived.php
│   │   ├── Models/             Eloquent models (Service, Project, ProjectLink, TeamMember, Contact, User)
│   │   └── Support/
│   │       └── SeedData.php    Static seed data (services & projects)
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   ├── routes/
│   │   └── api.php             Public REST endpoints (/api/services, /api/projects, /api/contact)
│   ├── tests/
│   │   └── Feature/Api/        Feature tests for all three API groups
│   ├── .env.example
│   └── phpunit.xml             Test runs on in-memory SQLite
│
└── frontend/                   Vite + React SPA
    ├── public/
    ├── src/
    │   ├── assets/             Static assets (logo, images)
    │   ├── components/         Shared UI components (Navbar, Footer, Button, PageTitle, …)
    │   ├── i18n/
    │   │   ├── ui.js           Full AR/EN copy dictionary
    │   │   └── LanguageContext.jsx  Language context & hook
    │   ├── lib/
    │   │   ├── api.js          Fetch helpers for the backend API
    │   │   └── visuals.js      Gradient/color utilities
    │   ├── pages/              Route-level page components (Home, Services, Portfolio, About, Contact, ProjectDetail)
    │   └── test/               Vitest setup
    ├── .env.example
    ├── tailwind.config.js
    └── vite.config.js          Dev proxy: /api → http://127.0.0.1:8000
```

---

## Running the tests

**Backend** (PHPUnit via Artisan — uses in-memory SQLite, no DB setup needed):

```bash
cd backend
php artisan test
```

Expected: **9 tests, 41 assertions, all passing**.

**Frontend** (Vitest):

```bash
cd frontend
npm test
```

Expected: **3 test files, 6 tests, all passing**.
