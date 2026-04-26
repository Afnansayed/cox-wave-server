# CoxWave Server

CoxWave Server is the backend API for the CoxWave event platform. It provides secure authentication, role-based authorization, event and booking management, payment flow, review moderation, and profile operations for Admin, Owner, and Customer roles.

## Table of Contents

- [Project Description](#project-description)
- [Live URLs](#live-urls)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Architecture Overview](#architecture-overview)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Scripts](#scripts)
- [Troubleshooting](#troubleshooting)

## Project Description

This project is built with a modular, scalable architecture using TypeScript + Express and Prisma with PostgreSQL. It includes:

- Better Auth based authentication and session flow
- OTP-based email verification and password reset
- Event lifecycle management (create, update, approve, activate, soft delete)
- Booking flow with payment integration hooks
- Review creation and moderation
- Centralized error handling and request validation

## Live URLs

- Backend (Production): https://cox-wave-server.vercel.app
- Frontend (Production): https://cox-wave-client.vercel.app
- Local API Base URL: http://localhost:5000/api/v1

## Features

- Role-based access control for Admin, Owner, and Customer
- Email OTP verification and password reset OTP
- Owner profile with media upload (profile image and trade license)
- Event management with approval and active status controls
- Seat-aware booking workflow and payment processing integration
- Review moderation with approval status
- Stripe webhook support for payment status updates
- Cloudinary integration for media storage
- Zod-based payload validation
- Structured global error response handling

## Technologies Used

- Node.js
- TypeScript
- Express.js
- Prisma ORM
- PostgreSQL
- Better Auth
- Stripe
- Cloudinary
- Multer
- Zod
- JWT
- Nodemailer
- ESLint
- PNPM

## Architecture Overview

- `src/app/module`: domain modules (`auth`, `user`, `owner`, `event`, `booking`, `review`, `customer`, `admin`, `payment`)
- `src/app/middleware`: auth guard, validation, global error handling, not-found handling
- `src/app/config`: environment, cloudinary, multer, stripe configuration
- `src/routes`: root router registration (`/api/v1`)
- `prisma/schema`: split Prisma schema files
- `prisma/migrations`: database migration history

## Setup Instructions

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd cox-wave-server
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Create environment file

Copy `.env.example` to `.env` and update all values.

```bash
cp .env.example .env
```

### 4. Generate Prisma client

```bash
pnpm generate
```

### 5. Run migrations

```bash
pnpm migrate
```

### 6. Seed admin user (optional)

```bash
pnpm seed:admin
```

### 7. Start development server

```bash
pnpm dev
```

Server URL:

- http://localhost:5000

### 8. Build and run production mode

```bash
pnpm build
pnpm start
```

## Environment Variables

Use `.env.example` as the source of truth. The main variables are:

| Category | Variables |
| --- | --- |
| App | `NODE_ENV`, `PORT`, `FRONTEND_URL` |
| Database | `DATABASE_URL` |
| Better Auth | `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` |
| JWT | `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `ACCESS_TOKEN_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_IN` |
| SMTP | `EMAIL_SENDER_SMTP_USER`, `EMAIL_SENDER_SMTP_PASS`, `EMAIL_SENDER_SMTP_HOST`, `EMAIL_SENDER_SMTP_PORT`, `EMAIL_SENDER_SMTP_FROM` |
| Cloudinary | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| Admin seed | `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |

## API Overview

Base path: `/api/v1`

| Module | Route Prefix | Description |
| --- | --- | --- |
| Auth | `/auth` | Register, login, token refresh, verify email, reset password |
| User | `/user` | Owner creation and user-related operations |
| Owner | `/owner` | Owner profile, approval, and owner management |
| Event | `/event` | Event CRUD, status and active-state controls |
| Booking | `/booking` | Booking creation, status updates, payment initiation |
| Review | `/review` | Review create/read/update/delete and approval flow |
| Customer | `/customer` | Customer profile management |
| Admin | `/admin` | Admin profile and admin actions |

## Scripts

- `pnpm dev`: start development server (watch mode)
- `pnpm build`: generate Prisma client, compile TypeScript, and fix output imports
- `pnpm start`: run compiled server
- `pnpm lint`: run ESLint
- `pnpm generate`: generate Prisma client only
- `pnpm migrate`: run Prisma migration in development
- `pnpm studio`: open Prisma Studio
- `pnpm seed:admin`: seed initial admin user
- `pnpm webhook:stripe`: forward Stripe webhooks to local `/webhook`

## Troubleshooting

- Stripe CLI DNS/auth issue:
	- If you see `lookup api.stripe.com: no such host`, check internet, DNS, VPN/proxy, and Stripe CLI login status.
- OTP email not sending:
	- Verify SMTP host, port, sender, app password, and provider security settings.
- Prisma field/type mismatch:
	- Run `pnpm generate` after schema updates.
- Build/start module resolution issue:
	- Run `pnpm build` again to refresh generated dist imports.
